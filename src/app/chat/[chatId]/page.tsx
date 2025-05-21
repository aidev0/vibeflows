'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import WorkflowDAG from '@/app/components/WorkflowDAG';
import Navbar from '@/app/components/Navbar';
import { Send, Bot, User, Mic, MicOff, Menu, X, Trash2, Edit2, Check, X as XIcon, Layout } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Components } from 'react-markdown';
import Chat from '@/app/components/Chat';

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
  const [showChatList, setShowChatList] = useState(true);
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
        const response = await fetch(`/api/chat?chatId=${chatId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Chat load error:', errorData);
          
          // Handle specific error cases with user-friendly messages
          if (response.status === 404) {
            throw new Error(errorData.message || 'This chat no longer exists or has been deleted.');
          } else if (response.status === 401) {
            throw new Error(errorData.message || 'You must be logged in to access this chat.');
          } else if (response.status === 400) {
            throw new Error(errorData.message || 'Invalid chat request. Please try again.');
          } else if (response.status === 500) {
            throw new Error(errorData.message || 'Server error. Please try again later.');
          } else {
            throw new Error(errorData.message || 'Failed to load chat. Please try again.');
          }
        }

        const data = await response.json();
        console.log('Chat data received:', data);

        // Check if we have messages in the response
        if (!data.messages || !Array.isArray(data.messages)) {
          console.error('Invalid messages format:', data);
          throw new Error('Unable to load chat messages. Please try again.');
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
          // Don't throw here, as workflow loading is not critical
        }
      } catch (error) {
        console.error('Error in chat initialization:', error);
        // Add error message to chat with more specific error details
        const errorMessage: Message = {
          id: Date.now().toString(),
          chatId: chatId as string,
          text: error instanceof Error ? error.message : "An error occurred loading the chat. Please try again.",
          sender: 'user',
          timestamp: new Date(),
          type: 'simple_text'
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
      const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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
    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      const errorMessage: Message = {
        id: Date.now().toString(),
        chatId: chatId as string,
        text: "Error saving message. Please try again.",
        sender: 'user',
        timestamp: new Date(),
        type: 'simple_text'
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
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Navbar showChatList={showChatList} setShowChatList={setShowChatList} />
      <main className="flex-1 pt-16">
        <div className="h-[calc(100vh-4rem)]">
          <Chat
            chatId={chatId as string}
            onChatIdChange={(id) => router.push(`/chat/${id}`)}
            systemMessage="You are a helpful AI assistant."
            welcomeMessage="Hi! I am VibeFlows AI. How can I help you today?"
            chatType="workflow"
            allChats={allChats.map(chat => ({
              ...chat,
              lastMessageAt: chat.created_at
            }))}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
            showChatList={showChatList}
            setShowChatList={setShowChatList}
          />
        </div>
      </main>
    </div>
  );
}