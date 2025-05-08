'use client'; // This directive is necessary for using React Hooks and event handlers

import { useState, useRef, useEffect } from 'react';
import { Send, Mic, Bot, User, Maximize2, Minimize2 } from 'lucide-react'; // Using lucide-react for icons
import WorkflowDAG from '@/app/components/WorkflowDAG';
import Navbar from '@/app/components/Navbar';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

// Add global styles for animations
const globalStyles = `
  @keyframes gradient-x {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .animate-gradient-x {
    background-size: 200% auto;
    animation: gradient-x 15s ease infinite;
  }
`;

// Define the structure for a chat message
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

interface Message {
  id: string;
  chatId: string;
  text?: string;
  nodeList?: Node[];
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'workflow_plan' | 'clarification_question' | 'simple_text' | 'error';
  options?: string[];
}

interface Workflow {
  id: string;
  user_id: string;
  nodes: Node[];
  created_at: Date;
  message_id: string;
  chat_id: string;
}

// Declare SpeechRecognition type for browser compatibility
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// Add polyfill for SpeechRecognition
const SpeechRecognition = typeof window !== 'undefined' 
  ? window.SpeechRecognition || window.webkitSpeechRecognition 
  : null;

export default function ChatPage() {
  const { user, error, isLoading } = useUser();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatId, setChatId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showDAG, setShowDAG] = useState(false);
  const [isDAGMaximized, setIsDAGMaximized] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of the messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to login if not authenticated
      router.push('/api/auth/login');
      return;
    }
  }, [user, isLoading, router]);

  // Effect for chat initialization
  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.sub) return;

      try {
        console.log('Creating new chat...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const response = await fetch('/api/chat/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'New Chat' }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        let data;
        try {
          const text = await response.text();
          console.log('Raw response:', text);
          
          // Handle markdown-formatted JSON
          const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (jsonMatch) {
            data = JSON.parse(jsonMatch[1].trim());
          } else {
            // Try parsing as regular JSON if no markdown formatting
            data = JSON.parse(text);
          }
          console.log('Parsed response:', data);
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          throw new Error('Invalid response from server');
        }

        if (!response.ok) {
          console.error('Chat creation error:', data);
          throw new Error(data?.details || data?.error || 'Failed to create chat');
        }

        if (!data?.chatId) {
          console.error('Invalid response format:', data);
          throw new Error('Invalid response format: missing chatId');
        }

        setChatId(data.chatId);
        router.push(`/chat/${data.chatId}`);

        // Add initial system message
        const systemMessage: Message = {
          id: Date.now().toString(),
          chatId: data.chatId,
          text: `👋 Hi ${user.name || 'there'}! I'm your AI workflow automation assistant. I'll help you create and manage your automation workflows.

I can help you with:
1. Creating new workflows
2. Modifying existing workflows
3. Explaining how workflows work
4. Troubleshooting workflow issues

Feel free to start with a simple greeting or directly describe what you'd like to automate. I'll guide you through the process step by step!`,
          sender: 'ai',
          timestamp: new Date(),
          type: 'simple_text'
        };

        setMessages([systemMessage]);

        try {
          console.log('Saving system message...');
          const saveResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId: data.chatId,
              message: systemMessage,
            }),
          });

          if (!saveResponse.ok) {
            console.error('Failed to save system message');
          }
        } catch (saveError) {
          console.error('Error saving system message:', saveError);
          // Continue even if saving fails - we can retry later
        }

        // Load workflows after chat is initialized
        try {
          console.log('Loading workflows...');
          const workflowsResponse = await fetch(`/api/workflows?chatId=${data.chatId}`);
          if (workflowsResponse.ok) {
            const workflowsData = await workflowsResponse.json();
            setWorkflows(workflowsData.workflows);
          }
        } catch (error) {
          console.error('Error loading workflows:', error);
          // Continue even if workflow loading fails - we can retry later
        }
      } catch (error) {
        console.error('Error creating chat:', error);
        // Show error message to user
        const errorMessage: Message = {
          id: Date.now().toString(),
          chatId: 'error',
          text: error instanceof Error && error.name === 'AbortError' 
            ? "The request took too long to complete. Please try again."
            : "I apologize, but I encountered an error creating the chat. Please try again.",
          sender: 'ai',
          timestamp: new Date(),
          type: 'error'
        };
        setMessages([errorMessage]);
      }
    };

    if (user?.sub) {
      initializeChat();
    }
  }, [user, router]);

  // Effect for auto-scrolling
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          handleSendMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !user?.sub) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      chatId,
      text,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Save user message
      await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          message: userMessage,
        }),
      });

      // Get AI response
      const aiResponse = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: text,
          chatId: chatId,
          userId: user.sub,
          history: messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{ text: msg.text || '' }]
          }))
        }),
      });

      if (!aiResponse.ok) {
        const errorData = await aiResponse.json();
        console.error('AI response error:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to get AI response');
      }

      const { type, text: aiText, nodes, options, requiresUserInput } = await aiResponse.json();

      if (!aiText) {
        throw new Error('Invalid AI response format');
      }

      // Create AI message with the response text
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        chatId,
        text: aiText,
        sender: 'ai',
        timestamp: new Date(),
        nodeList: type === 'workflow_plan' ? nodes : undefined,
        options: type === 'clarification_question' ? options : undefined,
        type: type
      };

      // Add AI message to chat
      setMessages(prev => [...prev, aiMessage]);

      // Only save to database if this is a final response (not a clarifying question)
      if (type === 'workflow_plan' || type === 'simple_text') {
        // Save AI message to database
        const saveResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId,
            message: aiMessage,
          }),
        });

        if (!saveResponse.ok) {
          console.error('Failed to save AI message');
        }

        // Only create workflow if it's a workflow plan
        if (type === 'workflow_plan' && nodes?.length > 0) {
          const newWorkflow: Workflow = {
            id: Date.now().toString(),
            user_id: user.sub,
            nodes: nodes.map((node: Node) => ({
              id: node.id,
              type: node.type,
              data: {
                ...node.data,
                label: node.data.label // Ensure label is last to avoid overwriting
              },
              position: node.position
            })),
            created_at: new Date(),
            message_id: aiMessage.id,
            chat_id: chatId,
          };

          const workflowResponse = await fetch('/api/workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chatId,
              workflow: newWorkflow,
            }),
          });

          if (workflowResponse.ok) {
            const { workflow } = await workflowResponse.json();
            setWorkflows(prev => [...prev, workflow]);
            setCurrentWorkflow(workflow);
            setShowDAG(true);
          }
        } else {
          // Hide DAG for non-workflow responses
          setShowDAG(false);
          setCurrentWorkflow(null);
        }
      } else {
        // For clarifying questions, just update the UI without saving to database
        setShowDAG(false);
        setCurrentWorkflow(null);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        chatId,
        text: "I apologize, but I encountered an error. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleWorkflowClick = (workflow: Workflow) => {
    setCurrentWorkflow(workflow);
    setShowDAG(true);
  };

  // Handle text input submission (Enter key)
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line on Enter
      handleSendMessage(inputText);
    }
  };

  // Handle microphone button click
  const handleMicClick = async () => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not available in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      } else {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current?.start();
        setIsListening(true);
      }
    } catch (error) {
      console.error('Microphone error:', error);
      alert('Microphone access denied. Please enable it in your browser settings.');
      setIsListening(false);
    }
  };

  const toggleDAGMaximize = () => {
    setIsDAGMaximized(!isDAGMaximized);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-lg">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Chat Section */}
      <div 
        className={`flex flex-col ${
          showDAG 
            ? isDAGMaximized 
              ? 'w-0 overflow-hidden' 
              : 'w-1/3'
            : 'w-full'
        } transition-all duration-300 ease-in-out`}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === user?.sub ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap">{message.text}</div>
                {message.sender === 'ai' && workflows.find(w => w.message_id === message.id) && (
                  <div className="mt-3 pt-3 border-t border-gray-600">
                    <button
                      onClick={() => handleWorkflowClick(workflows.find(w => w.message_id === message.id)!)}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                      View Workflow
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isListening ? "Listening..." : "Type your message..."}
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isListening}
            />
            <button
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isListening}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
            <button
              onClick={handleMicClick}
              className={`flex items-center justify-center p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* DAG Section */}
      {showDAG && currentWorkflow && (
        <div 
          className={`relative ${
            isDAGMaximized 
              ? 'w-full' 
              : 'w-2/3'
          } transition-all duration-300 ease-in-out`}
        >
          <button
            onClick={toggleDAGMaximize}
            className="absolute top-4 right-4 z-10 bg-gray-800 text-white p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isDAGMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
          <div className="h-full w-full">
            <WorkflowDAG steps={currentWorkflow.nodes} />
          </div>
        </div>
      )}
    </div>
  );
} 