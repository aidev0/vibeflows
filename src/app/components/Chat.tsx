'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import { Send, Bot, User } from 'lucide-react';

interface ChatProps {
  chatId: string | null;
  onChatIdChange: (id: string) => void;
  systemMessage: string;
  welcomeMessage: string;
  chatType: 'workflow' | 'support';
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

export default function Chat({ chatId, onChatIdChange, systemMessage, welcomeMessage, chatType }: ChatProps) {
  const { user, isLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');

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

      // Get AI response with chat history
      const aiResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: text,
          chatId,
          userId: user.sub,
          messages: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          })),
          fullPrompt: text
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await aiResponse.json();
      console.log('AI Response:', data);
      const { text: aiText, json, type } = data;

      if (!aiText && !json) {
        throw new Error('Invalid AI response format');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId: chatId as string,
        text: aiText || '',
        sender: 'ai',
        timestamp: new Date(),
        type: json ? 'json' : 'simple_text',
        json: json || undefined
      };

      console.log('Saving AI message:', aiMessage);

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
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        chatId: chatId as string,
        text: "I apologize, but I encountered an error. Please try again.",
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
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <div className="flex-1 flex flex-col">
        {/* Chat Section */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="pt-2">
            {messages.map((msg) => {
              // Debug log
              console.log('Message:', {
                id: msg.id,
                type: msg.type,
                text: msg.text,
                json: msg.json,
                hasJson: !!msg.json,
                jsonIsArray: Array.isArray(msg.json),
                jsonLength: msg.json?.length
              });

              return (
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
                    {/* 1. Always show text */}
                    <p className="text-sm md:text-base whitespace-pre-wrap break-words mb-4">{msg.text}</p>

                    {/* 2. Show table if JSON exists */}
                    {msg.json && (
                      <div className="w-full overflow-x-auto bg-gray-800 rounded-lg p-2 mb-4">
                        <div className="text-sm text-gray-400 mb-2">JSON Data:</div>
                        <table className="w-full border-collapse">
                          <thead>
                            <tr>
                              {Object.keys(msg.json[0]).map((header) => (
                                <th
                                  key={header}
                                  className="px-4 py-2 text-left text-sm font-semibold text-white border-b border-gray-700 bg-gray-900"
                                >
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {msg.json.map((item: any, index: number) => (
                              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700">
                                {Object.keys(msg.json[0]).map((header) => (
                                  <td
                                    key={`${index}-${header}`}
                                    className="px-4 py-2 text-sm text-gray-300"
                                  >
                                    {String(item[header])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* 3. Show workflow if type is workflow_plan */}
                    {msg.type === 'workflow_plan' && msg.nodeList && (
                      <div className="w-full bg-gray-800 rounded-lg p-2">
                        <div className="text-sm text-gray-400 mb-2">Workflow:</div>
                        <pre className="text-sm text-gray-300">
                          {JSON.stringify(msg.nodeList, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="text-xs opacity-70 mt-1">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
} 