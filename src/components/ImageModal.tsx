import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2, Download, Palette, Tag, AlignLeft } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import axios from 'axios';

export default function ImageModal({ image, onClose }: { image: any, onClose: () => void }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeImage();
  }, [image]);

  const analyzeImage = async () => {
    setLoading(true);
    setError(null);
    try {
      const imageUrl = image.urls?.regular || image.image_url;
      
      // 1. Proxy image to bypass CORS and get base64
      const proxyRes = await axios.post('/api/proxy-image', { url: imageUrl });
      const { base64, mimeType } = proxyRes.data;

      // 2. Call Gemini API
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Analyze this image aesthetically. Provide:
      1. A creative color palette of 5 hex codes that represent the mood.
      2. 5 aesthetic keywords or tags.
      3. A short, poetic description of the vibe or mood (max 2 sentences).
      Return ONLY a JSON object with keys: "palette" (array of strings), "keywords" (array of strings), "description" (string).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            inlineData: {
              data: base64,
              mimeType: mimeType
            }
          },
          prompt
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const result = JSON.parse(response.text);
      setAnalysis(result);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/50 backdrop-blur-md hover:bg-white/80 rounded-full flex items-center justify-center text-gray-800 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Image Section */}
          <div className="w-full md:w-1/2 bg-gray-100 flex items-center justify-center relative overflow-hidden">
            <img
              src={image.urls?.regular || image.image_url}
              alt={image.alt_description || 'Inspiration'}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
              <span className="bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-medium">
                {image.user?.name || 'Unknown Artist'}
              </span>
              <a
                href={image.links?.html || '#'}
                target="_blank"
                rel="noreferrer"
                className="bg-white/90 backdrop-blur-md text-black w-8 h-8 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Download size={14} />
              </a>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="w-full md:w-1/2 p-8 md:p-12 overflow-y-auto bg-white flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-serif font-medium text-gray-900">AI Analysis</h2>
                <p className="text-sm text-gray-500 font-medium">Extracting aesthetic essence</p>
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4 py-12">
                <Loader2 className="animate-spin text-indigo-500" size={32} />
                <p className="text-sm font-medium animate-pulse">Analyzing mood, colors, and composition...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-red-500 text-sm font-medium">
                {error}
              </div>
            ) : analysis ? (
              <div className="space-y-10 flex-1">
                {/* Palette */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Palette size={18} />
                    <h3>Color Palette</h3>
                  </div>
                  <div className="flex gap-3">
                    {analysis.palette?.map((color: string, i: number) => (
                      <div key={i} className="group relative">
                        <div
                          className="w-12 h-12 rounded-full shadow-sm border border-gray-100 cursor-pointer transform hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                          onClick={() => navigator.clipboard.writeText(color)}
                        />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Keywords */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <Tag size={18} />
                    <h3>Aesthetic Tags</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords?.map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="px-4 py-1.5 bg-gray-50 border border-gray-100 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-default"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-gray-900 font-medium">
                    <AlignLeft size={18} />
                    <h3>Vibe Description</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed font-serif italic text-lg">
                    "{analysis.description}"
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
