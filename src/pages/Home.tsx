import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import MasonryGrid from '../components/MasonryGrid';
import ImageModal from '../components/ImageModal';
import { motion } from 'motion/react';

export default function Home() {
  const [images, setImages] = useState<any[]>([]);
  const [query, setQuery] = useState('minimalist aesthetic');
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<any | null>(null);
  const [source, setSource] = useState<'unsplash' | 'pinterest'>('unsplash');
  const [pinterestConnected, setPinterestConnected] = useState(false);

  useEffect(() => {
    checkPinterestStatus();
    fetchImages();
  }, []);

  const checkPinterestStatus = async () => {
    try {
      const res = await axios.get('/api/pinterest/status');
      setPinterestConnected(res.data.connected);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchImages = async (searchQuery = query) => {
    setLoading(true);
    try {
      if (source === 'unsplash') {
        const res = await axios.get(`/api/unsplash/search?query=${searchQuery}`);
        setImages(res.data.results || []);
      } else if (source === 'pinterest' && pinterestConnected) {
        // For demo, we just fetch boards if connected.
        // In a real app, we'd fetch pins from a specific board or search.
        const res = await axios.get('/api/pinterest/boards');
        // We'll just map boards to a similar structure for the grid for now,
        // or prompt user to select a board.
        // To keep it simple, if Pinterest is selected but we don't have pins, we show boards.
        // Let's just stick to Unsplash for the main search demo, and show Pinterest connection status.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchImages();
  };

  const connectPinterest = async () => {
    try {
      const res = await axios.get('/api/auth/pinterest/url');
      const authWindow = window.open(res.data.url, 'pinterest_oauth', 'width=600,height=700');
      
      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
        if (event.data?.type === 'OAUTH_SUCCESS') {
          setPinterestConnected(true);
          window.removeEventListener('message', handleMessage);
        }
      };
      window.addEventListener('message', handleMessage);
    } catch (err) {
      console.error('Failed to get Pinterest auth URL', err);
    }
  };

  return (
    <div className="space-y-12">
      <section className="text-center max-w-2xl mx-auto space-y-6 mt-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-serif font-light tracking-tight text-gray-900"
        >
          Curate your <span className="italic">vision</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-gray-500 text-lg font-light"
        >
          Discover aesthetic inspiration and use AI to extract color palettes, moods, and creative direction.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
        >
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inspiration..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-gray-300 transition-all shadow-sm"
            />
          </form>
          
          <button
            onClick={connectPinterest}
            className={`px-6 py-3 rounded-full font-medium text-sm transition-all flex items-center gap-2 ${
              pinterestConnected 
                ? 'bg-red-50 text-red-600 border border-red-100' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 shadow-sm'
            }`}
          >
            <ImageIcon size={16} />
            {pinterestConnected ? 'Pinterest Connected' : 'Connect Pinterest'}
          </button>
        </motion.div>
      </section>

      <section>
        {loading ? (
          <div className="flex justify-center items-center py-32 text-gray-400">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : (
          <MasonryGrid images={images} onImageClick={setSelectedImage} />
        )}
      </section>

      {selectedImage && (
        <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
}
