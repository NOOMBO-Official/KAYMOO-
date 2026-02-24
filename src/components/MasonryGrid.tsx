import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

export default function MasonryGrid({ images, onImageClick }: { images: any[], onImageClick: (img: any) => void }) {
  return (
    <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4 pb-24">
      {images.map((img, index) => (
        <motion.div
          key={img.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.5 }}
          className="relative group break-inside-avoid mb-4 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
          onClick={() => onImageClick(img)}
        >
          <img
            src={img.urls?.regular || img.image_url}
            alt={img.alt_description || 'Inspiration image'}
            className="w-full h-auto object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm text-black px-4 py-2 rounded-full font-medium text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
              <Sparkles size={14} />
              Analyze with AI
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
