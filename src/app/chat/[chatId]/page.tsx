'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import WorkflowDAG from '@/app/components/WorkflowDAG';
import Navbar from '@/app/components/Navbar';
import { Send, Bot, User, Menu, X } from 'lucide-react';
import { useChats } from '@/app/context/ChatContext';

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    [key: string]: any;
  };
  position: {
    x: number;
    y: number;
  };
}

interface Workflow {
  id: string;
  user_id: string;
  nodes: Node[];
  created_at: Date;
  message_id: string;
  chat_id: string;
}

export default function ChatPage() {
  const { chatId } = useParams();
  const { user, isLoading: isUserLoading } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDAG, setShowDAG] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [inputText, setInputText] = useState('');
  const [showChatList, setShowChatList] = useState(false);
  const { chats } = useChats();

  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.sub) return;

      try {
        // If no chatId, redirect to the chats page
        if (!chatId) {
          router.push('/chats');
          return;
        }

        // Load messages for this chat
        console.log('Loading messages for chat...', { chatId });
        const response = await fetch(`/api/chat/${chatId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Chat load error:', errorData);
          throw new Error(errorData.error || 'Failed to load chat');
        }

        const data = await response.json();
        console.log('Chat data received:', data);

        // Check if we have messages in the response
        if (!data.messages || !Array.isArray(data.messages)) {
          console.error('Invalid messages format:', data);
          throw new Error('Invalid messages format in response');
        }

        setMessages(data.messages);

        // Load workflows for this chat
        try {
          const workflowsResponse = await fetch(`/api/workflows?chatId=${chatId}`);
          if (workflowsResponse.ok) {
            const workflowsData = await workflowsResponse.json();
            console.log('Workflows loaded:', workflowsData);
            setWorkflows(workflowsData.workflows || []);
          }
        } catch (workflowError) {
          console.error('Error loading workflows:', workflowError);
        }
      } catch (error) {
        console.error('Error in chat initialization:', error);
        // Add error message to chat
        const errorMessage: Message = {
          id: Date.now().toString(),
          chatId: chatId as string,
          text: "I apologize, but I encountered an error loading the chat. Please try again.",
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages([errorMessage]);
      }
    };

    if (user?.sub) {
      initializeChat();
    }
  }, [chatId, user?.sub, router]);

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
      timestamp: new Date()
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

      // Get AI response
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
          }))
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await aiResponse.json();
      const { text: aiText, nodes, type } = data;

      if (!aiText) {
        throw new Error('Invalid AI response format');
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId: chatId as string,
        text: aiText,
        nodeList: nodes,
        type: type || 'simple_text',
        sender: 'ai',
        timestamp: new Date()
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

      if (nodes && nodes.length > 0) {
        setCurrentWorkflow({
          id: Date.now().toString(),
          user_id: user.sub,
          nodes,
          created_at: new Date(),
          message_id: aiMessage.id,
          chat_id: chatId as string
        });
        setShowDAG(true);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        chatId: chatId as string,
        text: "I apologize, but I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentChat = chats.find(chat => chat.id === chatId);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Navbar />
      {/* Main Content Area - Flex container */}
      <div className="flex-1 flex relative min-h-0 pt-16">
        {/* Menu Button */}
        <button
          onClick={() => router.push('/chat')}
          className="fixed top-20 left-4 z-50 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Chat Section - Scrollable */}
        <div className={`flex-1 p-2 md:p-4 space-y-8 overflow-y-auto bg-gray-800 transition-all duration-300 ${
          showDAG ? 'w-1/3 opacity-100' : 'w-full opacity-100'
        }`}>
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
                  {msg.nodeList && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          if (msg.nodeList) {
                            setCurrentWorkflow({
                              id: Date.now().toString(),
                              user_id: user?.sub || '',
                              nodes: msg.nodeList as Node[],
                              created_at: new Date(),
                              message_id: msg.id,
                              chat_id: chatId as string
                            });
                            setShowDAG(true);
                          }
                        }}
                        className="w-full"
                      >
                        <ul className="list-none space-y-2 pl-1">
                          {msg.nodeList.map((node: Node, index) => (
                            <li 
                              key={index} 
                              className="text-sm md:text-base text-gray-300 bg-gray-600/50 p-3 rounded-md shadow hover:bg-gray-600 transition-colors cursor-pointer"
                            >
                              <span className="font-mono text-xs text-indigo-300 mr-2">[{index + 1}]</span>
                              {node.data.label}
                            </li>
                          ))}
                        </ul>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-3 text-right">
                    {new Date(msg.timestamp).toLocaleString([], { 
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                {msg.sender === 'user' && (
                  <User className="w-8 h-8 text-gray-400 flex-shrink-0 mb-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DAG Visualization Section */}
        {showDAG && currentWorkflow && (
          <div className="w-2/3 border-l border-gray-700 bg-gray-800 relative">
            <div className="h-[calc(100vh-12rem)]">
              <WorkflowDAG 
                steps={currentWorkflow.nodes} 
                onClose={() => setShowDAG(false)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="flex-none p-3 md:p-4 border-t border-gray-700 bg-gray-850 shadow-lg">
        <div className="flex items-center space-x-2 md:space-x-3 bg-gray-700 rounded-xl p-1 md:p-2 shadow-inner">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe the workflow you want to automate..."
            className="flex-grow p-2 md:p-3 bg-transparent text-gray-100 placeholder-gray-400 focus:outline-none text-sm md:text-base"
          />
          <button
            onClick={() => handleSendMessage(inputText)}
            disabled={!inputText.trim()}
            className="p-2 md:p-3 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}