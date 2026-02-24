import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fafafa]/80 backdrop-blur-md border-b border-black/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <Sparkles size={16} />
            </div>
            <span className="font-serif italic text-xl tracking-tight">Aesthetic AI</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            <a href="https://unsplash.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-black transition-colors">Unsplash</a>
            <a href="https://pinterest.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-black transition-colors">Pinterest</a>
          </div>
        </div>
      </div>
    </nav>
  );
}
