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
        try {
          // Check if we should force a new chat
          const forceNew = searchParams.get('new') === 'true';
          const isSupport = searchParams.get('type') === 'support';
          
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
            // If no existing chats, create a new one instead of redirecting to home
            const response = await fetch('/api/chat/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                title: 'New Workflow',
                type: 'workflow'
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
                text: "👋 Hi! I'm your AI workflow automation assistant. How can I help you today?",
                sender: 'ai',
                timestamp: new Date(),
                type: 'simple_text',
                systemMessage: "You are VibeFlows AI, a helpful, insightful, and proactive workflow automation assistant. Your primary goal is to help non-technical users define and automate workflows. You should be conversational and guide the user."
              }
            };

            await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(welcomeMessage),
            });

            // Redirect to the new chat
            router.push(`/chat/${data.chatId}`);
            return;
          }

          // Create a new chat
          const response = await fetch('/api/chat/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              title: isSupport ? 'Support Chat' : 'New Workflow',
              type: isSupport ? 'support' : 'workflow'
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
              text: isSupport ? "How can I help you?" : "👋 Hi! I'm your AI workflow automation assistant. How can I help you today?",
              sender: 'ai',
              timestamp: new Date(),
              type: 'simple_text',
              systemMessage: isSupport ? 
                "You are a helpful support assistant. Your goal is to help users with their questions and concerns. Be friendly, professional, and concise in your responses." :
                "You are VibeFlows AI, a helpful, insightful, and proactive workflow automation assistant. Your primary goal is to help non-technical users define and automate workflows. You should be conversational and guide the user."
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