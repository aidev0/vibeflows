'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function UserSync() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    console.log('UserSync effect - User state:', { 
      isLoading, 
      hasUser: !!user,
      userId: user?.sub 
    });

    if (!isLoading && user) {
      console.log('Attempting to sync user:', user.sub);
      fetch('/api/auth/sync')
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || errorData.error || 'Failed to sync user');
          }
          console.log('User sync successful');
        })
        .catch((error) => {
          console.error('Error syncing user:', error);
        });
    }
  }, [user, isLoading]);

  return null;
} 