'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">BM</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Beauty Masters</span>
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            <Link 
              href="/" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'text-pink-600 bg-pink-50' 
                  : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              Home
            </Link>
            <Link 
              href="/masters" 
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/masters' 
                  ? 'text-pink-600 bg-pink-50' 
                  : 'text-gray-700 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              Masters
            </Link>
            <Link
  href="/auth"
  className="px-4 py-2 rounded-md bg-pink-600 text-white font-semibold hover:bg-pink-700 transition"
>
  Register
</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
