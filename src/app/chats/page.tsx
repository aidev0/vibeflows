'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useChats } from '@/app/context/ChatContext';
import Navbar from '@/app/components/Navbar';
import { Send, Bot, User, Menu, X, Trash2, Edit2, Check, X as XIcon } from 'lucide-react';

interface Chat {
  id: string;
  title: string;
  created_at: string;
  messageCount: number;
  lastMessageAt: string;
  user_id: string;
}

interface UserChats {
  [userId: string]: {
    user: {
      name: string;
      email: string;
    };
    chats: Chat[];
  };
}

export default function ChatsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { chats, updateChat, removeChat, addChat } = useChats();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [userChats, setUserChats] = useState<UserChats>({});

  useEffect(() => {
    const fetchAllChats = async () => {
      if (!user?.sub) return;

      try {
        setIsLoading(true);
        const response = await fetch('/api/chats');
        
        if (!response.ok) {
          if (response.status === 403) {
            setError('You are not authorized to view all chats');
          } else {
            setError('Failed to fetch chats');
          }
          return;
        }

        const data = await response.json();
        if (data.userChats) {
          setUserChats(data.userChats);
          // Update context with all chats
          Object.values(data.userChats).forEach((userData: any) => {
            userData.chats.forEach((chat: Chat) => {
              addChat(chat);
            });
          });
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
        setError('Failed to fetch chats');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.sub) {
      fetchAllChats();
    }
  }, [user?.sub]);

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/chat/delete?chatId=${chatIdToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove chat from context
      removeChat(chatIdToDelete);
      // Update userChats state
      setUserChats(prev => {
        const newUserChats = { ...prev };
        Object.keys(newUserChats).forEach(userId => {
          newUserChats[userId].chats = newUserChats[userId].chats.filter(
            chat => chat.id !== chatIdToDelete
          );
        });
        return newUserChats;
      });
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameChat = async (chatIdToRename: string, newTitle: string) => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch('/api/chat/rename', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: chatIdToRename,
          title: newTitle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }

      // Update chat in context
      updateChat(chatIdToRename, { title: newTitle });
      // Update userChats state
      setUserChats(prev => {
        const newUserChats = { ...prev };
        Object.keys(newUserChats).forEach(userId => {
          newUserChats[userId].chats = newUserChats[userId].chats.map(chat =>
            chat.id === chatIdToRename ? { ...chat, title: newTitle } : chat
          );
        });
        return newUserChats;
      });
      setEditingChatId(null);
    } catch (error) {
      console.error('Error renaming chat:', error);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="py-8">
            <div className="text-red-400 text-center">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white font-sans">
      <Navbar />
      <div className="flex-1 pt-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="py-8">
          <h1 className="text-2xl font-bold mb-8">All Chats</h1>
          
          {Object.entries(userChats).map(([userId, userData]) => (
            <div key={userId} className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-semibold">{userData.user.name}</h2>
                  <p className="text-sm text-gray-400">{userData.user.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userData.chats.map((chat) => (
                  <div
                    key={chat.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => router.push(`/chats/${chat.id}`)}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameChat(chat.id, editingTitle);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(null);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-medium truncate">{chat.title || 'Untitled Chat'}</div>
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
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={(e) => {
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
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 