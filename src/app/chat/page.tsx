'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useChats } from '@/app/context/ChatContext';
import Navbar from '@/app/components/Navbar';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { setChats, setIsLoading } = useChats();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecentChat = async () => {
      if (!user?.sub) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/chats/${user.sub}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recent chat');
        }
        const data = await response.json();
        
        // Load chats into context
        if (data.chats && Array.isArray(data.chats)) {
          setChats(data.chats);
          
          if (data.chats.length > 0) {
            // Redirect to the most recent chat
            router.push(`/chat/${data.chats[0].id}`);
          } else {
            // No chats found, create a new one
            const createResponse = await fetch('/api/chat/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: 'New Chat',
                type: 'workflow',
                user_id: user.sub,
              }),
            });
            if (!createResponse.ok) {
              throw new Error('Failed to create new chat');
            }
            const newChat = await createResponse.json();
            setChats([newChat.chat]);
            router.push(`/chat/${newChat.chat.id}`);
          }
        } else {
          throw new Error('Invalid chat data format');
        }
      } catch (error) {
        console.error('Error loading recent chat:', error);
        setError('Failed to load chat. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isLoading && user?.sub) {
      loadRecentChat();
    }
  }, [user, isLoading, router, setChats, setIsLoading]);

  if (isLoading) {
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
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      <Navbar />
      <div className="flex-1 p-4 md:p-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}
          <div className="text-center py-12 text-gray-400">
            Redirecting to your chat...
          </div>
        </div>
      </div>
    </div>
  );
} 