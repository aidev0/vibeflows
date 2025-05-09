'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import Navbar from '@/app/components/Navbar';
import Chat from '@/app/components/Chat';

export default function SupportPage() {
  const { user, isLoading } = useUser();
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user && !chatId) {
      const initializeChat = async () => {
        try {
          // Check for existing support chat
          const chatsResponse = await fetch(`/api/chats?userId=${user.sub}`);
          if (chatsResponse.ok) {
            const chatsData = await chatsResponse.json();
            const existingSupportChat = chatsData.chats?.find((chat: any) => chat.type === 'support');
            
            if (existingSupportChat) {
              setChatId(existingSupportChat.id);
              return;
            }
          }

          // Create new support chat if none exists
          const response = await fetch('/api/chat/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Support Chat',
              type: 'support'
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create chat');
          }

          const data = await response.json();
          setChatId(data.chatId);

          // Add welcome message
          const welcomeMessage = {
            chatId: data.chatId,
            message: {
              id: Date.now().toString(),
              chatId: data.chatId,
              text: "How can I help you?",
              sender: 'ai',
              timestamp: new Date(),
              type: 'simple_text',
              systemMessage: "You are a helpful support assistant. Your goal is to help users with their questions and concerns. Be friendly, professional, and concise in your responses."
            }
          };

          await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(welcomeMessage),
          });
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };

      initializeChat();
    }
  }, [user, isLoading, chatId]);

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
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Navbar />
      <div className="flex-1 flex flex-col pt-16">
        <Chat
          chatId={chatId}
          onChatIdChange={setChatId}
          systemMessage="You are a helpful support assistant. Your goal is to help users with their questions and concerns. Be friendly, professional, and concise in your responses."
          welcomeMessage="How can I help you?"
          chatType="support"
        />
      </div>
    </div>
  );
} 