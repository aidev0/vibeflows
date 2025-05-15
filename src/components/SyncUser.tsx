'use client';

import { useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function SyncUser() {
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      fetch('/api/auth/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user }),
      }).catch(console.error);
    }
  }, [user, isLoading]);

  return null;
} 