import express from 'express';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cookieParser());
  app.use(express.json());

  // Pinterest OAuth
  app.get('/api/auth/pinterest/url', (req, res) => {
    const redirectUri = `${process.env.APP_URL}/api/auth/pinterest/callback`;
    const clientId = process.env.PINTEREST_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ error: 'PINTEREST_CLIENT_ID is not configured' });
    }

    const state = Math.random().toString(36).substring(7);
    res.cookie('pinterest_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'none' });

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'boards:read,pins:read',
      state: state,
    });

    res.json({ url: `https://www.pinterest.com/oauth/?${params.toString()}` });
  });

  app.get('/api/auth/pinterest/callback', async (req, res) => {
    const { code, state, error } = req.query;
    const storedState = req.cookies.pinterest_oauth_state;

    if (error) {
      return res.send(`<html><body><script>window.opener.postMessage({ type: 'OAUTH_ERROR', error: '${error}' }, '*'); window.close();</script></body></html>`);
    }

    if (state !== storedState) {
      return res.send(`<html><body><script>window.opener.postMessage({ type: 'OAUTH_ERROR', error: 'State mismatch' }, '*'); window.close();</script></body></html>`);
    }

    try {
      const redirectUri = `${process.env.APP_URL}/api/auth/pinterest/callback`;
      const authHeader = Buffer.from(`${process.env.PINTEREST_CLIENT_ID}:${process.env.PINTEREST_CLIENT_SECRET}`).toString('base64');

      const tokenResponse = await axios.post('https://api.pinterest.com/v5/oauth/token', 
        new URLSearchParams({
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
        }).toString(),
        {
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;
      
      res.cookie('pinterest_access_token', accessToken, { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000 
      });

      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_SUCCESS', provider: 'pinterest' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Pinterest OAuth Error:', err.response?.data || err.message);
      res.send(`<html><body><script>window.opener.postMessage({ type: 'OAUTH_ERROR', error: 'Failed to exchange token' }, '*'); window.close();</script></body></html>`);
    }
  });

  app.get('/api/pinterest/status', (req, res) => {
    const token = req.cookies.pinterest_access_token;
    res.json({ connected: !!token });
  });

  app.get('/api/pinterest/boards', async (req, res) => {
    const token = req.cookies.pinterest_access_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated with Pinterest' });

    try {
      const response = await axios.get('https://api.pinterest.com/v5/boards', {
        headers: { Authorization: `Bearer ${token}` }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.response?.data || err.message });
    }
  });

  app.get('/api/pinterest/boards/:boardId/pins', async (req, res) => {
    const token = req.cookies.pinterest_access_token;
    if (!token) return res.status(401).json({ error: 'Not authenticated with Pinterest' });

    try {
      const response = await axios.get(`https://api.pinterest.com/v5/boards/${req.params.boardId}/pins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.response?.data || err.message });
    }
  });

  // Unsplash API Proxy
  app.get('/api/unsplash/search', async (req, res) => {
    const { query } = req.query;
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!accessKey) {
      return res.status(500).json({ error: 'UNSPLASH_ACCESS_KEY is not configured' });
    }

    try {
      const response = await axios.get(`https://api.unsplash.com/search/photos`, {
        params: { query: query || 'aesthetic', per_page: 30 },
        headers: { Authorization: `Client-ID ${accessKey}` }
      });
      res.json(response.data);
    } catch (err: any) {
      res.status(500).json({ error: err.response?.data || err.message });
    }
  });

  // Image proxy for Gemini
  app.post('/api/proxy-image', async (req, res) => {
    const { url } = req.body;
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const mimeType = response.headers['content-type'] || 'image/jpeg';
      res.json({ base64, mimeType });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch image' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
