'use client';

import { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';

// Create a global state for chats
let globalChats: any[] = [];

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
  const [error, setError] = useState<string | null>(null);

  // Load chats only once
  useEffect(() => {
    if (!isLoading && user && globalChats.length === 0) {
      const loadChats = async () => {
        if (!user?.sub) return;

        try {
          const response = await fetch('/api/chats');
          if (!response.ok) {
            throw new Error('Failed to fetch chats');
          }

          const data = await response.json();
          if (data.userChats) {
            // Flatten all chats from all users and store in global state
            globalChats = Object.values(data.userChats).flatMap((userData: any) => userData.chats);
          }
        } catch (error) {
          console.error('Error loading chats:', error);
          setError('Failed to load chats');
        }
      };

      loadChats();
    }
  }, [user, isLoading]);

  // Handle chat navigation
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
            const chat = globalChats.find(c => c.id === currentChatId);
            if (chat) {
              router.push(`/chat/${currentChatId}`);
              return;
            }
          }

          // If no valid chat found, create a new one
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

          // Add new chat to global state
          const newChat = {
            id: data.chatId,
            title: 'New Chat',
            type: 'chat',
            created_at: new Date().toISOString(),
            lastMessageAt: new Date().toISOString()
          };
          globalChats = [newChat, ...globalChats];

          // Redirect to the new chat
          router.push(`/chat/${data.chatId}`);
        } catch (error) {
          console.error('Error initializing chat:', error);
          setError('Failed to initialize chat');
        }
      };

      initializeChat();
    }
  }, [user, isLoading, router, searchParams]);

  // Function to remove chat from global state
  const removeChat = (chatId: string) => {
    globalChats = globalChats.filter(chat => chat.id !== chatId);
  };

  // Function to add chat to global state
  const addChat = (chat: any) => {
    globalChats = [chat, ...globalChats];
  };

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

  if (error) {
    return (
      <div className="pt-16 min-h-screen bg-gray-900">
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-red-500 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-gray-900">
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-white text-xl">Creating new chat...</div>
      </div>
    </div>
  );
};

export default ChatPage; 