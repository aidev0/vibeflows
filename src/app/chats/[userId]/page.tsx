'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useChats } from '@/app/context/ChatContext';
import Navbar from '@/app/components/Navbar';
import { Menu, Edit2, Trash2, Check, X } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  messageCount: number;
  lastMessageAt: string;
}

export default function UserChatsPage() {
  const params = useParams();
  const userId = params.userId as string;
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    const fetchUserChats = async () => {
      if (!user?.sub) return;

      try {
        setIsLoading(true);
        console.log('Fetching chats for user:', { 
          targetUserId: userId, 
          currentUser: user.sub,
          isAdmin: user.sub === process.env.ADMIN_ID 
        });
        const response = await fetch(`/api/chats/${userId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/api/auth/login');
            return;
          }
          if (response.status === 403) {
            setError('You do not have permission to view these chats');
            return;
          }
          throw new Error('Failed to fetch chats');
        }

        const data = await response.json();
        console.log('Received chats data:', data);
        setChats(data.chats || []);
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to load chats. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.sub) {
      fetchUserChats();
    }
  }, [userId, user?.sub, router]);

  const handleDeleteChat = async (chatId: string) => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/chat/delete?chatId=${chatId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      setError('Failed to delete chat. Please try again.');
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch('/api/chat/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          title: newTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }

      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
      setEditingChatId(null);
    } catch (error) {
      console.error('Error renaming chat:', error);
      setError('Failed to rename chat. Please try again.');
    }
  };

  if (isUserLoading || isLoading) {
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold">
              {userId === user.sub ? 'Your Chats' : 'User Chats'}
            </h1>
            {userId === user.sub && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/chat/create', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        title: 'New Chat',
                        type: 'workflow'
                      }),
                    });

                    if (!response.ok) {
                      throw new Error('Failed to create chat');
                    }

                    const data = await response.json();
                    if (!data?.chat) {
                      throw new Error('Invalid response format');
                    }

                    // Add welcome message
                    const welcomeMessage = {
                      chatId: data.chat.id,
                      message: {
                        id: Date.now().toString(),
                        chatId: data.chat.id,
                        text: `# 🚀 Welcome to VibeFlows, ${user?.given_name || 'there'}!\n\nI'm your **Marketing Automation AI** – ready to transform your marketing ideas into production-ready workflows without a single line of code.\n\n## What I Can Build For You:\n- **Email Marketing Campaigns** with smart segmentation and personalization\n- **Lead Nurturing Sequences** that convert prospects into customers  \n- **Social Media Automation** across all your channels\n- **Customer Journey Workflows** from first touch to retention\n- **Analytics Dashboards** that track what actually matters\n- **CRM Integrations** that sync your entire marketing stack\n\n## Just Tell Me What You Need:\n*\"Set up a welcome email series for new subscribers\"*  \n*\"Create a lead scoring system for our B2B prospects\"*  \n*\"Build a social media campaign for our product launch\"*  \n*\"Automate our customer onboarding process\"*\n\n**No technical jargon required** – describe your marketing challenge in plain English, and I'll architect the perfect solution using our 1000+ integrations and enterprise-grade AI agents.\n\nReady to automate something amazing? What marketing workflow should we build first? 💡`,
                        sender: 'ai',
                        timestamp: new Date(),
                        type: 'simple_text',
                        systemMessage: "You are VibeFlows AI, a helpful, insightful, and proactive workflow automation assistant. Your primary goal is to help non-technical users define and automate workflows. You should be conversational and guide the user."
                      }
                    };

                    await fetch('/api/chat', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(welcomeMessage),
                    });

                    router.push(`/chat/${data.chat.id}`);
                  } catch (error) {
                    console.error('Error creating chat:', error);
                    setError('Failed to create chat. Please try again.');
                  }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                New Chat
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {chats.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No chats found
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
                >
                  {editingChatId === chat.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameChat(chat.id, editingTitle);
                          } else if (e.key === 'Escape') {
                            setEditingChatId(null);
                          }
                        }}
                        className="flex-1 bg-gray-600 text-white px-2 py-1 rounded"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRenameChat(chat.id, editingTitle)}
                        className="p-1 hover:bg-gray-600 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingChatId(null)}
                        className="p-1 hover:bg-gray-600 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push(`/chat/${chat.id}`)}
                        className="w-full text-left"
                      >
                        <h3 className="font-medium truncate">{chat.title || 'Untitled Chat'}</h3>
                        <div className="flex justify-between items-center mt-2">
                          <div className="text-sm text-gray-400">
                            {new Date(chat.lastMessageAt).toLocaleString([], { 
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
                            {chat.messageCount} {chat.messageCount === 1 ? 'message' : 'messages'}
                          </div>
                        </div>
                      </button>
                      {userId === user.sub && (
                        <div className="absolute right-2 top-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEditingChatId(chat.id);
                              setEditingTitle(chat.title || '');
                            }}
                            className="p-1 hover:bg-gray-600 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (window.confirm('Are you sure you want to delete this chat?')) {
                                handleDeleteChat(chat.id);
                              }
                            }}
                            className="p-1 hover:bg-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 