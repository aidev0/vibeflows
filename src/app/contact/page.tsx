'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import Navbar from '@/app/components/Navbar';
import { Send, Bot, User } from 'lucide-react';

export default function ContactPage() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && user) {
      const initializeContactChat = async () => {
        try {
          // Create a new contact chat
          const response = await fetch('/api/chat/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: 'Contact Support',
              type: 'contact'
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to create chat');
          }

          const data = await response.json();
          setChatId(data.chatId);

          // Add welcome message
          const welcomeMessage: Message = {
            id: Date.now().toString(),
            chatId: data.chatId,
            text: "How can I help you?",
            sender: "ai",
            timestamp: new Date(),
            type: "simple_text",
            systemMessage: "You are a helpful support assistant. Your goal is to help users with their questions and concerns. Be friendly, professional, and concise in your responses."
          };

          await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(welcomeMessage),
          });

          setMessages([welcomeMessage]);
        } catch (error) {
          console.error('Error initializing contact chat:', error);
        }
      };

      initializeContactChat();
    }
  }, [user, isLoading]);

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
      const { text: aiText } = data;

      if (!aiText) {
        throw new Error('Invalid AI response format');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId: chatId as string,
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
        type: 'simple_text'
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
      <Navbar />
      <div className="flex-1 flex flex-col pt-16">
        {/* Chat Section */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          <div className="pt-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end space-x-3 mb-6 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <Bot className="w-8 h-8 text-indigo-400 flex-shrink-0 mb-1" />
                )}
                <div
                  className={`p-3 md:p-4 rounded-xl max-w-lg shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-200 rounded-bl-none'
                  }`}
                >
                  {msg.text && <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>}
                  <p className="text-xs text-gray-400 mt-3 text-right">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.sender === 'user' && (
                  <User className="w-8 h-8 text-gray-400 flex-shrink-0 mb-1" />
                )}
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
    </div>
  );
} 