'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navbar from '@/app/components/Navbar';

export default function UsersPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/api/auth/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        console.log('Fetched users:', data.users);
        setUsers(data.users);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="py-8">
          <h1 className="text-2xl font-bold mb-6">Users</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {users.length === 0 ? (
              <div className="text-gray-400 text-center py-4 col-span-full">No users found</div>
            ) : (
              users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => router.push(`/chats/${user.user_id}`)}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors text-left w-full"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-600 mb-4">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-gray-300">
                          {user.name?.[0]?.toUpperCase() || '?'}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-lg">
                        {user.name || 'Anonymous User'}
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.email || 'No email'}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Last login: {user.last_login ? new Date(user.last_login).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        }) : 'Never'}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 