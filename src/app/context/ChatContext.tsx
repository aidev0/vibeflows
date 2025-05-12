'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  messageCount: number;
  lastMessageAt: string;
}

interface ChatContextType {
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  removeChat: (chatId: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Helper function to sort chats by lastMessageAt
const sortChats = (chats: Chat[]): Chat[] => {
  return [...chats].sort((a, b) => 
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
};

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const addChat = (chat: Chat) => {
    setChats(prev => sortChats([chat, ...prev]));
  };

  const updateChat = (chatId: string, updates: Partial<Chat>) => {
    setChats(prev => sortChats(prev.map(chat => 
      chat.id === chatId ? { ...chat, ...updates } : chat
    )));
  };

  const removeChat = (chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
  };

  return (
    <ChatContext.Provider value={{
      chats,
      setChats: (newChats) => setChats(sortChats(newChats)),
      addChat,
      updateChat,
      removeChat,
      isLoading,
      setIsLoading
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChats must be used within a ChatProvider');
  }
  return context;
} 