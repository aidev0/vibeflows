'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useChats } from '../context/ChatContext';

export default function ChatPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { chats, setChats, addChat, isLoading: isChatsLoading, setIsLoading } = useChats();

  // Function to fetch chats
  const fetchChats = async () => {
    try {
      const chatsResponse = await fetch('/api/chats');
      if (!chatsResponse.ok) {
        throw new Error('Failed to fetch chats');
      }
      
      const chatsData = await chatsResponse.json();
      const existingChats = chatsData.chats || [];
      setChats(existingChats);
      return existingChats;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Function to create a new chat
  const createNewChat = async () => {
    try {
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

      // Add new chat to state
      const newChat = {
        id: data.chatId,
        title: 'New Workflow',
        created_at: new Date().toISOString(),
        messageCount: 1,
        lastMessageAt: new Date().toISOString()
      };
      addChat(newChat);

      return data.chatId;
    } catch (error) {
      console.error('Error creating chat:', error);
      return null;
    }
  };

  useEffect(() => {
    if (!isUserLoading) {
      if (!user) {
        // If not authenticated, redirect to login
        router.push('/api/auth/login');
        return;
      }

      const initializeChat = async () => {
        try {
          // If we don't have chats in state, fetch them
          if (chats.length === 0) {
            const existingChats = await fetchChats();
            
            if (existingChats.length > 0) {
              // If there are existing chats, redirect to the most recent one
              const mostRecentChat = existingChats[0];
              router.push(`/chat/${mostRecentChat.id}`);
              return;
            }
          } else if (chats.length > 0) {
            // If we have chats in state, use the most recent one
            const mostRecentChat = chats[0];
            router.push(`/chat/${mostRecentChat.id}`);
            return;
          }

          // If no chats exist, create a new one
          const newChatId = await createNewChat();
          if (newChatId) {
            router.push(`/chat/${newChatId}`);
          }
        } catch (error) {
          console.error('Error initializing chat:', error);
        }
      };

      initializeChat();
    }
  }, [user, isUserLoading, router, chats, setChats, addChat, setIsLoading]);

  if (isUserLoading || isChatsLoading) {
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