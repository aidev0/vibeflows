'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isLoading } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed w-full bg-gray-900 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xl md:text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              <span className="hidden md:inline">vibeflows.app: Your Workflow Automation AI.</span>
              <span className="md:hidden">VibeFlows AI</span>
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden md:flex items-center">
            {!isLoading && !user && (
              <a
                href="/api/auth/login"
                className="text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </a>
            )}
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-gray-300">
                  Let's dream big, {user.name || user.nickname || user.email}!
                </span>
                <a
                  href="/api/auth/logout"
                  className="text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </a>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            {!isLoading && !user && (
              <a
                href="/api/auth/login"
                className="block text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors mb-2"
              >
                Sign In
              </a>
            )}
            {user && (
              <div className="space-y-2">
                <div className="text-gray-300 px-4 py-2">
                  Let's dream big, {user.name || user.nickname || user.email}!
                </div>
                <a
                  href="/api/auth/logout"
                  className="block text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
} 