'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import WorkflowDAG from '@/app/components/WorkflowDAG';
import Navbar from '@/app/components/Navbar';
import { Send, Bot, User, Mic, MicOff, Menu, X, Trash2, Edit2, Check, X as XIcon } from 'lucide-react';

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
  const { user, isLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [showDAG, setShowDAG] = useState(false);
  const [currentWorkflow, setCurrentWorkflow] = useState<Workflow | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [lastWorkflowNodes, setLastWorkflowNodes] = useState<Node[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showChatList, setShowChatList] = useState(false);
  const [allChats, setAllChats] = useState<{ id: string; title: string; created_at: string; messageCount: number }[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    const initializeChat = async () => {
      if (!user?.sub) return;

      try {
        // If no chatId or chatId is 'new', redirect to the main chat page
        if (!chatId || chatId === 'new') {
          router.push('/chat');
          return;
        }

        // Load existing chat
        console.log('Loading chat...', { chatId, userId: user.sub });
        const response = await fetch(`/api/chat?chatId=${chatId}&userId=${user.sub}`);
        
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        const recognition = new SpeechRecognitionAPI();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = Array.from(event.results)
            .map(result => result[0].transcript)
            .join('');
          setInputText(transcript);
        };

        recognition.onerror = (event: SpeechRecognitionEvent) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob);

        try {
          const response = await fetch('/api/speech-to-text', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error('Failed to convert speech to text');
          }

          const { text } = await response.json();
          setInputText(text);
        } catch (error) {
          console.error('Error converting speech to text:', error);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

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
          fullPrompt: `You are VibeFlows AI, a helpful, insightful, and proactive workflow automation assistant.
Your primary goal is to help non-technical users define and automate workflows. You should be conversational and guide the user.

Interaction Flow:
1.  If the user's request is clear and provides enough detail for a specific workflow, break it down into actionable steps ("nodes"). Respond with "type": "workflow_plan".
2.  **If the user explicitly asks for an "example workflow", "show me …pic (e.g., "automate marketing") and you've already asked 1-2 clarifying questions without much progress, offer a common example "workflow_plan" related to that topic to help them.
5.  If the user asks a general question not about a specific workflow automation, provide a helpful answer with "type": "simple_text".

…Remember to use the conversation history (if provided) to understand context and avoid repeating questions.
The user is currently: ${user.sub}.
Current user message: "${text}"`
        }),
      });

      if (!aiResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      let data;
      try {
        const text = await aiResponse.text();
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

  // Add useEffect to fetch all chats
  useEffect(() => {
    const fetchAllChats = async () => {
      if (!user?.sub) {
        console.log('No user ID available');
        return;
      }
      try {
        console.log('Fetching chats for user:', user.sub);
        const response = await fetch(`/api/chats?userId=${user.sub}`);
        console.log('Chat fetch response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Received chats data:', data);
          
          if (!data.chats || !Array.isArray(data.chats)) {
            console.error('Invalid chats data format:', data);
            return;
          }

          // Sort chats by creation date, newest first
          const sortedChats = data.chats.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          console.log('Sorted chats:', sortedChats);
          setAllChats(sortedChats);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch chats:', errorData);
        }
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    if (user?.sub) {
      fetchAllChats();
    }
  }, [user?.sub]);

  // Add function to delete chat
  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (!user?.sub) return;
    
    try {
      const response = await fetch(`/api/chat/delete?chatId=${chatIdToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      // Remove chat from list
      setAllChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));

      // If we're currently in the deleted chat, redirect to the most recent chat
      if (chatIdToDelete === chatId) {
        // Get the most recent chat from the remaining chats
        const remainingChats = allChats.filter(chat => chat.id !== chatIdToDelete);
        if (remainingChats.length > 0) {
          const mostRecentChat = remainingChats[0]; // Already sorted by date
          router.push(`/chat/${mostRecentChat.id}`);
        } else {
          // If no chats left, redirect to home
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Add function to rename chat
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

      // Update chat in list
      setAllChats(prev => prev.map(chat => 
        chat.id === chatIdToRename 
          ? { ...chat, title: newTitle }
          : chat
      ));

      setEditingChatId(null);
    } catch (error) {
      console.error('Error renaming chat:', error);
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
      {/* Main Content Area - Flex container */}
      <div className="flex-1 flex relative min-h-0 pt-16">
        {/* Chat List Sidebar */}
        <div className={`fixed inset-y-0 left-0 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out z-40 ${
          showChatList ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Your Chats</h2>
            <button
              onClick={() => setShowChatList(false)}
              className="p-2 hover:bg-gray-700 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-4rem)]">
            <button
              onClick={() => {
                router.push('/chat?new=true');
                setShowChatList(false);
              }}
              className="w-full p-4 text-left hover:bg-gray-700 transition-colors border-b border-gray-700"
            >
              <div className="font-medium text-indigo-400">+ New Chat</div>
            </button>
            {allChats.length === 0 ? (
              <div className="p-4 text-gray-400 text-center">
                No chats found
              </div>
            ) : (
              allChats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group relative border-b border-gray-700 ${
                    chat.id === chatId ? 'bg-gray-700' : ''
                  }`}
                >
                  {editingChatId === chat.id ? (
                    <div className="p-4">
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
                            e.preventDefault();
                            e.stopPropagation();
                            handleRenameChat(chat.id, editingTitle);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setEditingChatId(null);
                          }}
                          className="p-1 hover:bg-gray-600 rounded"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          router.push(`/chat/${chat.id}`);
                          setShowChatList(false);
                        }}
                        className="w-full p-4 text-left hover:bg-gray-700 transition-colors"
                      >
                        <div className="font-medium truncate">{chat.title || 'Untitled Chat'}</div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="text-sm text-gray-400">
                            {new Date(chat.created_at).toLocaleString([], { 
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
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Menu Button */}
        <button
          onClick={() => setShowChatList(!showChatList)}
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
            onClick={toggleListening}
            className={`p-2 md:p-3 rounded-lg transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <Mic className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </button>
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