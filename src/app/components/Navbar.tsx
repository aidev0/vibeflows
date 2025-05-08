'use client';

import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <nav className="fixed w-full bg-gray-900 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition-colors">
              Workflow Automation AI
            </Link>
          </div>
          <div className="flex items-center">
            {!isLoading && !user && (
              <Link
                href="/api/auth/login"
                className="text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
            {user && (
              <div className="flex items-center gap-4">
                <span className="text-gray-300">
                  Let's dream big, {user.name || user.nickname || user.email}!
                </span>
                <Link
                  href="/api/auth/logout"
                  className="text-white border border-white/20 hover:bg-white/10 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sign Out
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 