'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import { usePathname, useRouter } from 'next/navigation';

const ADMIN_ID = process.env.ADMIN_ID;

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isLoading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = user?.sub === ADMIN_ID;

  console.log('Admin check:', {
    userSub: user?.sub,
    adminId: ADMIN_ID,
    isAdmin,
    user
  });

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      // First try the API route
      const response = await fetch('/api/auth/logout');
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      // If successful, redirect to home
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback to direct Auth0 logout
      window.location.href = '/api/auth/logout';
    }
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              VibeFlows
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {!isLoading && user ? (
              <div className="flex items-center space-x-4">
                <Link
                  href="/chat"
                  className={`text-sm ${
                    pathname === '/chat'
                      ? 'text-indigo-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  AI
                </Link>
                {isAdmin && (
                  <Link
                    href="/users"
                    className={`text-sm ${
                      pathname === '/users'
                        ? 'text-indigo-600'
                        : 'text-gray-700 hover:text-gray-900'
                    }`}
                  >
                    Users
                  </Link>
                )}
                <Link
                  href="/features"
                  className={`text-sm ${
                    pathname === '/features'
                      ? 'text-indigo-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Features
                </Link>
                <Link
                  href="/about"
                  className={`text-sm ${
                    pathname === '/about'
                      ? 'text-indigo-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  About
                </Link>
                <Link
                  href="/team"
                  className={`text-sm ${
                    pathname === '/team'
                      ? 'text-indigo-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Team
                </Link>
                <Link
                  href="/privacy"
                  className={`text-sm ${
                    pathname === '/privacy'
                      ? 'text-indigo-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Privacy
                </Link>
                <Link
                  href="/security"
                  className={`text-sm ${
                    pathname === '/security'
                      ? 'text-indigo-600'
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  Security
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/api/auth/login"
                className="text-sm text-gray-700 hover:text-gray-900"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 