'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import { Send, Bot, User, Layout, Menu, X, Check, Edit2, Trash2 } from 'lucide-react';
import WorkflowDAG from './WorkflowDAG';
import { useRouter } from 'next/navigation';

interface ChatProps {
  chatId: string | null;
  onChatIdChange: (id: string) => void;
  systemMessage: string;
  welcomeMessage: string;
  chatType: 'workflow' | 'support';
  allChats: {
    id: string;
    title: string;
    created_at: string;
    messageCount: number;
    lastMessageAt: string;
  }[];
  onDeleteChat: (chatId: string) => Promise<void>;
  onRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  showChatList: boolean;
  setShowChatList: (show: boolean) => void;
}

interface JsonTableProps {
  data: any;
}

function JsonTable({ data }: JsonTableProps) {
  console.log('JsonTable data:', data);
  
  if (!data || typeof data !== 'object') {
    console.log('Invalid data for JsonTable:', data);
    return null;
  }

  // If it's an array, use the first item's keys as headers
  const isArray = Array.isArray(data);
  const items = isArray ? data : [data];
  
  // Get all unique keys from all items
  const headers = Array.from(
    new Set(
      items.flatMap(item => Object.keys(item))
    )
  );

  console.log('JsonTable headers:', headers);
  console.log('JsonTable items:', items);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-900 divide-y divide-gray-700">
          {items.map((item, index) => (
            <tr key={index}>
              {headers.map((header) => (
                <td
                  key={`${index}-${header}`}
                  className="px-4 py-2 text-sm text-gray-300 whitespace-pre-wrap"
                >
                  {item[header] !== undefined ? String(item[header]) : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Chat({ 
  chatId, 
  onChatIdChange, 
  systemMessage, 
  welcomeMessage, 
  chatType,
  allChats,
  onDeleteChat,
  onRenameChat,
  showChatList,
  setShowChatList
}: ChatProps) {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [showDAG, setShowDAG] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Add effect to load messages when chatId is available
  useEffect(() => {
    if (!isLoading && user && chatId) {
      const loadMessages = async () => {
        try {
          console.log('Loading messages for chatId:', chatId);
          const messagesResponse = await fetch(`/api/chat?chatId=${chatId}&userId=${user.sub}`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
            console.log('Loaded messages:', messagesData.messages);
            setMessages(messagesData.messages || []);
          }
        } catch (error) {
          console.error('Error loading messages:', error);
        }
      };

      loadMessages();
    }
  }, [user, isLoading, chatId]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !user?.sub) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      chatId: chatId as string,
      text,
      sender: 'user',
      timestamp: new Date(),
      type: 'simple_text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Save user message
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message: userMessage,
        }),
      });

      // Mock response for testing
      const mockResponse = {
        type: 'workflow_plan',
        text: 'This is a mock workflow plan',
        nodes: [
          {
            id: '1',
            type: 'action',
            data: {
              label: 'Step 1',
              description: 'This is a mock step',
              tools: ['mock-tool'],
              notes: 'Mock notes'
            },
            position: { x: 0, y: 0 }
          }
        ],
        requiresUserInput: false
      };

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId: chatId as string,
        text: mockResponse.text,
        sender: 'ai',
        timestamp: new Date(),
        type: 'workflow_plan',
        json: mockResponse
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message: aiMessage,
        }),
      });
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        chatId: chatId as string,
        text: "Error saving message. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        type: 'simple_text'
      };
      setMessages(prev => [...prev, errorMessage]);
    }
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

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-900 text-white font-sans">
      {/* Chat History Sidebar */}
      <div className={`w-64 border-r border-gray-700 bg-gray-800 fixed left-0 top-16 h-[calc(100vh-4rem)] z-40 transition-transform duration-300 ${showChatList ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h3 className="font-semibold">Your Chats</h3>
          <button
            onClick={() => setShowChatList(false)}
            className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {allChats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 hover:bg-gray-700 cursor-pointer transition-colors ${
                chat.id === chatId ? 'bg-gray-700' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="flex-1 bg-gray-600 text-white px-2 py-1 rounded"
                    autoFocus
                  />
                ) : (
                  <div className="font-medium truncate">{chat.title || 'Untitled Chat'}</div>
                )}
                <div className="flex gap-2">
                  {editingChatId === chat.id ? (
                    <>
                      <button
                        onClick={() => {
                          onRenameChat(chat.id, editingTitle);
                          setEditingChatId(null);
                        }}
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
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingChatId(chat.id);
                          setEditingTitle(chat.title || '');
                        }}
                        className="p-1 hover:bg-gray-600 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteChat(chat.id)}
                        className="p-1 hover:bg-gray-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div 
                className="text-sm text-gray-400 mt-1 cursor-pointer"
                onClick={() => {
                  onChatIdChange(chat.id);
                  setShowChatList(false);
                }}
              >
                {new Date(chat.lastMessageAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {chat.messageCount} {chat.messageCount === 1 ? 'message' : 'messages'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${showDAG ? 'w-1/3' : 'w-full'} ${showChatList ? 'ml-64' : 'ml-0'} transition-all duration-300 relative`}>
        {/* Menu Button */}
        <div className="fixed top-20 left-4 z-50">
          <button
            onClick={() => setShowChatList(!showChatList)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center bg-gray-700 shadow-lg"
            aria-label="Toggle chat history"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Section */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="pt-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                } mb-4`}
              >
                <div
                  className={`p-3 md:p-4 rounded-xl shadow-lg w-fit ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-200 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm md:text-base whitespace-pre-wrap break-words mb-4">{msg.text}</p>

                  {msg.json && (
                    <div className="w-full overflow-x-auto bg-gray-800 rounded-lg p-2 mb-4">
                      <div className="text-sm text-gray-400 mb-2">JSON Data:</div>
                      <JsonTable data={msg.json} />
                    </div>
                  )}

                  {msg.type === 'workflow_plan' && msg.json && (
                    <div className="w-full bg-gray-800 rounded-lg p-2">
                      <div className="text-sm text-gray-400 mb-2">Workflow:</div>
                      <pre className="text-sm text-gray-300">
                        {JSON.stringify(msg.json, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Input Section */}
        <div className="flex-none p-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center space-x-2 bg-gray-700 rounded-xl p-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow p-2 bg-transparent text-white placeholder-gray-400 focus:outline-none"
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim()}
              className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* WorkflowDAG Component */}
      {showDAG && currentWorkflow && (
        <div className="fixed top-0 right-0 w-2/3 h-full z-50">
          <WorkflowDAG
            steps={currentWorkflow.nodes}
            onClose={() => {
              setShowDAG(false);
              setCurrentWorkflow(null);
            }}
          />
        </div>
      )}
    </div>
  );
} 