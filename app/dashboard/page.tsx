'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Network, Bot, Play, Settings, Search, Plus, Circle, Code, Maximize2, Minimize2, Maximize, Send, MessageCircle, FunctionSquare, User, LogOut, LogIn, GitBranch } from 'lucide-react';
import GraphPanel from '../components/GraphPanel';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@auth0/nextjs-auth0/client';

// API functions
const API = {
  getFlows: async () => {
    const response = await fetch('/api/flows');
    return response.json();
  },
  getAgents: async () => {
    const response = await fetch('/api/agents');
    return response.json();
  },
  getChats: async (userId?: string) => {
    const response = await fetch(`/api/chats${userId ? `?userId=${userId}` : ''}`);
    return response.json();
  },
  createChat: async (name: string) => {
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return response.json();
  },
  getMessages: async (chatId: string) => {
    const response = await fetch(`/api/messages?chatId=${chatId}`);
    return response.json();
  },
  callAIAutomation: async (user_query: string, chat_id?: string, user_id?: string) => {
    console.log('=== CALLING AI AUTOMATION ENDPOINT ===');
    console.log('user_query:', user_query);
    console.log('chat_id:', chat_id);
    console.log('user_id:', user_id);
    console.log('Full payload:', { user_query, chat_id, user_id });
    
    const response = await fetch('/api/ai/stream', {
      method: 'POST',
      headers: {
        "Accept": "text/event-stream",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ user_query, chat_id, user_id }),
    });
    return response;
  },
};

const Dashboard = () => {
  const { user, isLoading, error } = useUser();
  const [activeTab, setActiveTab] = useState<'flows' | 'agents'>('flows');
  const [flows, setFlows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [maximizedSection, setMaximizedSection] = useState<'none' | 'left' | 'graph' | 'chat'>('none');
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'assistant', timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [chatPanelWidth, setChatPanelWidth] = useState(320);
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const graphRef = useRef<{ fitView: () => void }>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Debug logging
  useEffect(() => {
    console.log('Auth0 user data:', { user, isLoading, error });
    if (user) {
      console.log('User object keys:', Object.keys(user));
      console.log('User properties:', {
        name: user.name,
        email: user.email,
        nickname: user.nickname,
        given_name: user.given_name,
        family_name: user.family_name,
        sub: user.sub
      });
    }
  }, [user, isLoading, error]);

  // Helper function to safely get ID from item
  const getItemId = (item: any): string => {
    if (item?._id) {
      return typeof item._id === 'string' ? item._id : String(item._id.$oid || item._id);
    }
    if (item?.id) {
      return String(item.id);
    }
    return Math.random().toString();
  };

  // Helper function to format names
  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Load flows/agents
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = activeTab === 'flows' ? await API.getFlows() : await API.getAgents();
        activeTab === 'flows' ? setFlows(data) : setAgents(data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  // Initialize or load existing chat
  useEffect(() => {
    const initChat = async () => {
      try {
        const chats = await API.getChats();
        if (chats && chats.length > 0) {
          // Load the most recent chat
          const lastChat = chats[0];
          setCurrentChat(lastChat);
          
          // Load messages for this chat
          const chatMessages = await API.getMessages(lastChat._id);
          const formattedMessages = chatMessages.map((msg: any) => ({
            id: msg._id,
            text: msg.text || msg.content || '',
            sender: msg.role === 'user' ? 'user' : 'assistant',
            timestamp: new Date(msg.created_at)
          }));
          setMessages(formattedMessages);
        } else {
          // Create new chat if none exist
          const chat = await API.createChat('Dashboard Chat');
          setCurrentChat(chat);
          setMessages([{
            id: '1',
            text: 'Welcome to VibeFlows! I can help you create flows, manage agents, and optimize your marketing automation.',
            sender: 'assistant',
            timestamp: new Date()
          }]);
        }
      } catch (err) {
        console.error('Error initializing chat:', err);
      }
    };
    initChat();
  }, []);

  const items = activeTab === 'flows' ? flows : agents;
  const filtered = items.filter((i) =>
    String(i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(i.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const createNewChat = async () => {
    try {
      const newChat = await API.createChat(`Chat ${new Date().toLocaleString()}`);
      setCurrentChat(newChat);
      setMessages([{
        id: '1',
        text: 'Welcome to VibeFlows! I can help you create flows, manage agents, and optimize your marketing automation.',
        sender: 'assistant',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  const sendMessage = async () => {
    if (chatInput.trim() && !isStreaming && user?.sub) {
      const userMessage = {
        id: Date.now().toString(),
        text: chatInput,
        sender: 'user' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setChatInput('');
      setIsStreaming(true);

      try {
        const response = await API.callAIAutomation(userMessage.text, currentChat?._id, user.sub);
        
        if (response.ok) {
          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          
          const botMessage = {
            id: (Date.now() + 1).toString(),
            text: '',
            sender: 'assistant' as const,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, botMessage]);
          
          if (reader) {
            let buffer = '';
            let accumulatedText = '';
            let lastUpdateTime = Date.now();
            const UPDATE_INTERVAL = 300; // Update UI every 300ms to accumulate more text
            
            const updateMessage = (text: string) => {
              setMessages(prev => prev.map(msg => 
                msg.id === botMessage.id 
                  ? { ...msg, text: text }
                  : msg
              ));
            };
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              // Decode chunk and add to buffer
              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              
              // Process complete lines
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer
              
              for (const line of lines) {
                if (line.trim() && line.startsWith('data: ')) {
                  try {
                    const jsonStr = line.slice(6).trim();
                    
                    // Skip empty data or done signal
                    if (!jsonStr || jsonStr === '[DONE]') {
                      continue;
                    }
                    
                    const data = JSON.parse(jsonStr);
                    
                    // Handle different message types from your AI server
                    if (data.type && data.message) {
                      console.log(`[${data.type}] "${data.message}"`); // Debug logging
                      let messageToAdd = '';
                      
                      switch (data.type) {
                        case 'thought_stream':
                          // Main content - add directly
                          messageToAdd = data.message;
                          break;
                          
                        case 'iteration':
                          // Show iterations as progress
                          messageToAdd = `\n**${data.message}**\n`;
                          break;
                          
                        case 'thinking':
                        case 'reasoning_start':
                          // Show thinking process
                          messageToAdd = `\n*${data.message}*\n`;
                          break;
                          
                        case 'tool_prep':
                        case 'tool_ready':
                        case 'executing':
                          // Show tool usage
                          messageToAdd = `\n${data.message}\n`;
                          break;
                          
                        case 'tool_result':
                        case 'tool_stream':
                          // Show tool results
                          messageToAdd = `\n${data.message}\n`;
                          break;
                          
                        case 'final':
                          // Show completion
                          messageToAdd = `\n**${data.message}**`;
                          break;
                          
                        case 'reasoning_done':
                        case 'continue':
                          // Show brief status updates
                          messageToAdd = `\n*${data.message}*\n`;
                          break;
                          
                        // Skip keepalive and tool_input messages (too noisy)
                        case 'keepalive':
                        case 'tool_input':
                          continue;
                          
                        default:
                          // Show other message types as-is
                          messageToAdd = `\n*${data.message}`;
                      }
                      
                      if (messageToAdd) {
                        accumulatedText += messageToAdd;
                        
                        // Update UI less frequently for thought_stream to avoid choppy display
                        const now = Date.now();
                        const isImportantMessage = ['iteration', 'final', 'tool_result'].includes(data.type);
                        const hasCompleteThought = data.type === 'thought_stream' && (/[.!?]\s*$/.test(messageToAdd) || messageToAdd.length > 10);
                        const enoughTimeElapsed = now - lastUpdateTime >= UPDATE_INTERVAL;
                        
                        // For thought_stream, be more conservative about updates to avoid showing fragments
                        if (data.type === 'thought_stream') {
                          // Only update if we have a complete sentence, enough text, or enough time has passed
                          if (hasCompleteThought || enoughTimeElapsed) {
                            updateMessage(accumulatedText);
                            lastUpdateTime = now;
                          }
                        } else if (isImportantMessage || enoughTimeElapsed) {
                          // For other message types, update more readily
                          updateMessage(accumulatedText);
                          lastUpdateTime = now;
                        }
                      }
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse streaming data:', line, parseError);
                    // Continue processing other lines instead of breaking
                  }
                }
              }
            }
            
            // Process any remaining buffer content
            if (buffer.trim() && buffer.startsWith('data: ')) {
              try {
                const jsonStr = buffer.slice(6).trim();
                if (jsonStr && jsonStr !== '[DONE]') {
                  const data = JSON.parse(jsonStr);
                  if (data.type && data.message && data.type !== 'keepalive') {
                    accumulatedText += data.message;
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse final buffer:', buffer, parseError);
              }
            }
            
            // Final update with complete text
            updateMessage(accumulatedText);
          }
        } else {
          // Handle non-OK response
          const errorText = await response.text();
          console.error('API Error:', response.status, errorText);
          
          const errorMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Sorry, I encountered an error. Please try again.',
            sender: 'assistant' as const,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Add error message to chat
        const errorMessage = {
          id: (Date.now() + 2).toString(),
          text: 'Sorry, I encountered a connection error. Please check that the AI service is running.',
          sender: 'assistant' as const,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsStreaming(false);
      }
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mouse drag handlers for resizable panels
  const handleMouseDown = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(side);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const containerWidth = window.innerWidth;
    
    if (isDragging === 'left') {
      const newWidth = Math.max(200, Math.min(600, e.clientX));
      setLeftPanelWidth(newWidth);
    } else if (isDragging === 'right') {
      const newWidth = Math.max(200, Math.min(600, containerWidth - e.clientX));
      setChatPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
        <div className="flex gap-2">
          {['flows', 'agents'].map((t) => (
            <button
              key={t}
              onClick={() => {
                setActiveTab(t as any);
                setSelectedItem(null);
                setSelectedNode(null);
              }}
              className={`
                group relative px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 
                flex items-center gap-2 overflow-hidden
                ${activeTab === t 
                  ? t === 'flows'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                    : 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                  : t === 'flows'
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-emerald-600/20 hover:text-emerald-300 hover:scale-102 border border-emerald-500/20'
                    : 'bg-gray-700/50 text-gray-300 hover:bg-purple-600/20 hover:text-purple-300 hover:scale-102 border border-purple-500/20'
                }
              `}
            >
              {t === 'flows' ? (
                <Network size={18} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'
                }`} />
              ) : (
                <Bot size={18} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'
                }`} />
              )}
              
              <span className="relative z-10">
                {formatName(t.charAt(0).toUpperCase() + t.slice(1))}
              </span>
            </button>
          ))}
        </div>
        
        {/* User menu */}
        <div className="flex items-center gap-2">
          <User size={20} />
          <span className="text-sm text-gray-300 mr-2">
            {isLoading ? 'Loading...' : user?.name || user?.nickname || user?.given_name || user?.email || 'User'}
          </span>
          {user && (
            <a
              href="/api/auth/logout"
              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              Logout
            </a>
          )}
          {!user && !isLoading && (
            <a
              href="/api/auth/login"
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <LogIn size={16} />
              Login
            </a>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Flows/Agents List */}
        <div className={`${
          maximizedSection === 'graph' || maximizedSection === 'chat' ? 'hidden' : 
          maximizedSection === 'left' ? 'flex-1' : ''
        } border-r border-gray-700 flex flex-col relative`}
        style={maximizedSection === 'left' ? {} : { 
          width: `${leftPanelWidth}px`,
          minWidth: `${leftPanelWidth}px`,
          maxWidth: `${leftPanelWidth}px`
        }}>
          {/* Left Panel - List */}
          <div 
            className={`bg-gray-800 border-r border-gray-700 overflow-y-auto transition-all duration-300 ${
              maximizedSection === 'left' ? 'w-full' : 
              maximizedSection !== 'none' ? 'w-0 opacity-0' : ''
            }`}
            style={{ width: maximizedSection === 'none' ? `${leftPanelWidth}px` : undefined }}
          >
            {/* Left Panel Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-white">
                {selectedNode ? 'Node Details' : formatName(activeTab)}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setMaximizedSection(maximizedSection === 'left' ? 'none' : 'left')}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  {maximizedSection === 'left' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>

            {selectedNode ? (
              // Node Details Panel
              <div className="p-4 space-y-4">
                <div className="border-b border-gray-700 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedNode.type === 'agent' ? (
                      <Bot size={16} className="text-purple-400" />
                    ) : (
                      <GitBranch size={16} className="text-green-400" />
                    )}
                    <h3 className="font-semibold text-sm text-white">{String(selectedNode.name || 'Unnamed Node')}</h3>
                  </div>
                  <p className="text-xs text-gray-400">{String(selectedNode.description || '')}</p>
                  {selectedNode.language && (
                    <div className="mt-2">
                      <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                        {String(selectedNode.language || '').toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {selectedNode.input_schema && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">INPUT SCHEMA</h4>
                    <pre className="text-green-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
                      {JSON.stringify(selectedNode.input_schema, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedNode.output_schema && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">OUTPUT SCHEMA</h4>
                    <pre className="text-blue-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-32 whitespace-pre-wrap">
                      {JSON.stringify(selectedNode.output_schema, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedNode.function_code && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">FUNCTION CODE</h4>
                    <pre className="text-yellow-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-40 whitespace-pre-wrap">
                      {String(selectedNode.function_code || '')}
                    </pre>
                  </div>
                )}

                {selectedNode.required_packages && selectedNode.required_packages.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">REQUIRED PACKAGES</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.required_packages.map((pkg: string, idx: number) => (
                        <span key={idx} className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">
                          {String(pkg || '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNode.integrations && selectedNode.integrations.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">INTEGRATIONS</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNode.integrations.map((integration: string, idx: number) => (
                        <span key={idx} className="text-xs bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">
                          {String(integration || '')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-700">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">ACTIONS</h4>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
                      <Play size={12} />
                      Execute
                    </button>
                    <button className="w-full bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
                      <Settings size={12} />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Original flow/agent list
              <div className="p-4">
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((item) => (
                      <div
                        key={getItemId(item)}
                        onClick={() => setSelectedItem(item)}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedItem && getItemId(selectedItem) === getItemId(item)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {activeTab === 'flows' ? (
                            <Network size={16} className="text-green-400" />
                          ) : (
                            <Bot size={16} className="text-purple-400" />
                          )}
                          <span className="font-medium text-sm">{formatName(String(item?.name || ''))}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{String(item?.description || '')}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resize Handle */}
          {maximizedSection === 'none' && (
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-600 hover:bg-gray-500 transition-colors"
              onMouseDown={handleMouseDown('left')}
            />
          )}
        </div>

        {/* Center - Graph View */}
        <div className={`${
          maximizedSection === 'left' || maximizedSection === 'chat' ? 'hidden' :
          maximizedSection === 'graph' ? 'flex-1' : 'flex-1'
        } bg-gray-900 flex flex-col relative`}>
          {/* Graph Control Buttons */}
          <div className="absolute top-2 right-2 z-20 flex gap-2">
            {/* Fit Button */}
            <button
              onClick={() => graphRef.current?.fitView()}
              className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              title="Fit Graph to View"
            >
              <Maximize size={16} />
            </button>
            
            {/* Maximize Button */}
            <button
              onClick={() => setMaximizedSection(maximizedSection === 'graph' ? 'none' : 'graph')}
              className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
              title={maximizedSection === 'graph' ? 'Restore' : 'Maximize Graph'}
            >
              {maximizedSection === 'graph' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>

          <div className="flex-1 w-full">
            <GraphPanel
              selectedItem={selectedItem}
              selectedNode={selectedNode}
              onNodeSelect={(node) => setSelectedNode(node)}
            />
          </div>
        </div>

        {/* Right Sidebar - Chat */}
        <div className={`${
          maximizedSection === 'left' || maximizedSection === 'graph' ? 'hidden' : 
          maximizedSection === 'chat' ? 'flex-1' : ''
        } border-l border-gray-700 flex flex-col bg-white/5 backdrop-blur-sm relative`}
        style={maximizedSection === 'chat' ? {} : { 
          width: `${chatPanelWidth}px`,
          minWidth: `${chatPanelWidth}px`,
          maxWidth: `${chatPanelWidth}px`
        }}>
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <MessageCircle className="text-white" size={16} />
                </div>
                <h3 className="font-semibold text-white">AI Assistant</h3>
                {isStreaming && (
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
              
              {/* Chat Control Buttons */}
              <div className="flex gap-2">
                {/* New Chat Button */}
                <button
                  onClick={createNewChat}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
                  title="Start new chat"
                >
                  <Plus size={16} />
                </button>
                
                {/* Maximize Button */}
                <button
                  onClick={() => setMaximizedSection(maximizedSection === 'chat' ? 'none' : 'chat')}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors"
                  title={maximizedSection === 'chat' ? 'Restore' : 'Maximize Chat'}
                >
                  {maximizedSection === 'chat' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={String(message.id || Math.random())}
                className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-lg px-4 py-3 rounded-2xl text-sm shadow-lg ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    <div className={`prose ${message.sender === 'user' ? 'prose-invert' : 'prose-gray'} max-w-none`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({children}) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({children}) => <em className="text-gray-300 text-xs">{children}</em>,
                          code: ({children}) => <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                          ul: ({children}) => <ul className="list-disc list-inside space-y-1">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside space-y-1">{children}</ol>,
                          li: ({children}) => <li>{children}</li>,
                          h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-semibold mb-2 text-white">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-white">{children}</h3>,
                        }}
                      >
                        {String(message.text || '')}
                      </ReactMarkdown>
                    </div>
                    {/* Show typing indicator for empty bot messages during streaming */}
                    {message.sender === 'assistant' && !message.text && isStreaming && (
                      <div className="flex items-center gap-1 text-gray-400">
                        <span className="text-xs">AI is thinking</span>
                        <div className="flex space-x-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Show streaming cursor for bot messages being typed */}
                  {message.sender === 'assistant' && message.text && isStreaming && (
                    <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse"></span>
                  )}
                </div>
                
                {message.sender === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask me anything..."
                disabled={isStreaming}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm placeholder-gray-400 disabled:opacity-50"
              />
              <button
                onClick={sendMessage}
                disabled={isStreaming || !chatInput.trim()}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Resize Handle */}
          {maximizedSection === 'none' && (
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-gray-600 hover:bg-gray-500 transition-colors"
              onMouseDown={handleMouseDown('right')}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 