'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

const ChatPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
};

const ChatPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) {
      const initializeChat = async () => {
        if (!user?.sub) return;

        try {
          const searchParams = new URLSearchParams(window.location.search);
          const forceNew = searchParams.get('new') === 'true';
          const currentChatId = searchParams.get('chatId');

          // If we have a chatId and it's not 'new', try to load it
          if (currentChatId && currentChatId !== 'new') {
            try {
              const response = await fetch(`/api/chat?chatId=${currentChatId}`);
              if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                  router.push(`/chat/${currentChatId}`);
                  return;
                }
              }
            } catch (error) {
              console.error('Error loading chat:', error);
            }
          }

          // Create a new chat
          const response = await fetch('/api/chat/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              title: 'New Chat',
              type: 'chat'
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create chat');
          }

          const data = await response.json();
          if (!data?.chatId) {
            throw new Error('Invalid response format');
          }

          // Add welcome message
          const welcomeMessage = {
            chatId: data.chatId,
            message: {
              id: Date.now().toString(),
              chatId: data.chatId,
              text: "Hi! I am VibeFlows AI. How can I help you today?",
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
};

export default ChatPage; 