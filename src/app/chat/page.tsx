'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      const initializeChat = async () => {
        try {
          // Check if we should force a new chat
          const forceNew = searchParams.get('new') === 'true';
          const isFromContact = searchParams.get('from') === 'contact';
          
          if (!forceNew) {
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
            // If no existing chats and not forcing new, redirect to home
            router.push('/');
            return;
          }

          // Create a new chat
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

          // Add welcome message based on source
          const welcomeMessage = {
            chatId: data.chatId,
            message: {
              id: Date.now().toString(),
              chatId: data.chatId,
              text: isFromContact ? "How can I help you?" : "👋 Hi! I'm your AI workflow automation assistant. How can I help you today?",
              sender: 'ai',
              timestamp: new Date(),
              type: 'simple_text'
            }
          };

          await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(welcomeMessage),
          });

          // Redirect to the new chat
          router.push(`/chat/${data.chatId}`);
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };

      initializeChat();
    }
  }, [user, isLoading, router, searchParams]);

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