'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      const initializeChat = async () => {
        try {
          // First check for existing chats
          const chatsResponse = await fetch(`/api/chats?userId=${user.sub}`);
          if (!chatsResponse.ok) {
            throw new Error('Failed to fetch chats');
          }
          
          const chatsData = await chatsResponse.json();
          const existingChats = chatsData.chats || [];

          if (existingChats.length > 0) {
            // If there are existing chats, redirect to the most recent one
            const mostRecentChat = existingChats[0]; // Already sorted by date in the API
            router.push(`/chat/${mostRecentChat.id}`);
            return;
          }

          // Only create a new chat if there are no existing chats
          const response = await fetch('/api/chat/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'New Chat' }),
          });

          if (!response.ok) {
            throw new Error('Failed to create chat');
          }

          const data = await response.json();
          if (!data?.chatId) {
            throw new Error('Invalid response format');
          }

          // Redirect to the new chat
          router.push(`/chat/${data.chatId}`);
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };

      initializeChat();
    }
  }, [user, isLoading, router]);

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
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-white text-xl">Creating new chat...</div>
    </div>
  );
} 