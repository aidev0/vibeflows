'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'https://vibeflows.app';
};

export default function Navbar() {
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const isAdmin = user?.sub === process.env.ADMIN_ID;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = `/api/auth/logout?returnTo=${encodeURIComponent(window.location.origin)}`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-white font-bold text-xl">
                VibeFlows
            </Link>
          </div>
            {user && (
              <div className="ml-6 text-gray-300">
                  Let's dream big, {user.name || user.nickname || user.email}!
              </div>
            )}
          </div>

          <div className="flex items-center">
            {!isLoading && (
              <>
                {user ? (
                  <>
                    <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
                        {isMenuOpen ? (
                          <X className="h-6 w-6" />
                        ) : (
                          <Menu className="h-6 w-6" />
                        )}
            </button>

        {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            <Link
                              href="/chat"
                              className={`block px-4 py-2 text-sm ${
                                pathname === '/chat'
                                  ? 'text-indigo-400'
                                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              AI
                            </Link>
                            {isAdmin && (
                              <Link
                                href="/users"
                                className={`block px-4 py-2 text-sm ${
                                  pathname === '/users'
                                    ? 'text-indigo-400'
                                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                                }`}
                                onClick={() => setIsMenuOpen(false)}
                              >
                                Users
                              </Link>
                            )}
                            <Link
                              href="/features"
                              className={`block px-4 py-2 text-sm ${
                                pathname === '/features'
                                  ? 'text-indigo-400'
                                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                Features
              </Link>
                            <Link
                              href="/about"
                              className={`block px-4 py-2 text-sm ${
                                pathname === '/about'
                                  ? 'text-indigo-400'
                                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              About
                            </Link>
                            <Link
                              href="/team"
                              className={`block px-4 py-2 text-sm ${
                                pathname === '/team'
                                  ? 'text-indigo-400'
                                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                Team
              </Link>
                            <Link
                              href="/privacy"
                              className={`block px-4 py-2 text-sm ${
                                pathname === '/privacy'
                                  ? 'text-indigo-400'
                                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Privacy
                            </Link>
                            <Link
                              href="/security"
                              className={`block px-4 py-2 text-sm ${
                                pathname === '/security'
                                  ? 'text-indigo-400'
                                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                              }`}
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Security
                            </Link>
                            <Link
                              href="#"
                              onClick={handleLogoutClick}
                              className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700"
                            >
                              Logout
                            </Link>
                          </div>
                        </div>
                      )}
            </div>
                  </>
                ) : (
                  <Link
                href="/api/auth/login"
                    className="text-sm text-gray-300 hover:text-white"
                >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 