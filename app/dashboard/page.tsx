'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Network, Bot, Play, Settings, Search, Plus, Circle, Code, Maximize2, Minimize2, Maximize, Send, MessageCircle, FunctionSquare, User, LogOut, LogIn, GitBranch, Menu, X, Key, Globe, Zap, ExternalLink } from 'lucide-react';
import GraphPanel from '../components/GraphPanel';
import N8nWorkflowViewer from '../components/N8nWorkflowViewer';
import KeysManager from '../components/KeysManager';
import ChatInput from '../components/ChatInput';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@auth0/nextjs-auth0/client';
import { createUserSession, updateUserSession, getLatestFlowFromMessages } from '../utils/sessionManager';

// API functions
const API = {
  getFlows: async (userId?: string) => {
    const response = await fetch(`/api/flows${userId ? `?userId=${userId}` : ''}`);
    return response.json();
  },
  getLatestFlow: async (userId: string) => {
    const response = await fetch(`/api/flows?userId=${userId}&latest=true`);
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
  createChat: async (name: string, userId?: string) => {
    const response = await fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, user_id: userId }),
    });
    return response.json();
  },
  getMessages: async (chatId: string) => {
    const response = await fetch(`/api/messages?chatId=${chatId}`);
    return response.json();
  },
  ensureUser: async () => {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
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
  sendMessage: async (chatId: string, text: string, role: 'user' | 'assistant') => {
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text: text, 
        role: role
      }),
    });
    return response.json();
  },
  getN8nWorkflows: async (userId?: string) => {
    const response = await fetch('/api/n8n?action=list_workflows');
    return response.json();
  },
  getN8nWorkflowById: async (workflowId: string) => {
    const response = await fetch(`/api/n8n?action=get_workflow&workflow_id=${workflowId}`);
    return response.json();
  },
};

const Dashboard = () => {
  const { user, isLoading, error } = useUser();
  const [activeTab, setActiveTab] = useState<'flows' | 'agents' | 'n8n'>('flows');
  const [flows, setFlows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [n8nWorkflows, setN8nWorkflows] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showKeysManager, setShowKeysManager] = useState(false);
  const [showApiManager, setShowApiManager] = useState(false);
  const [search, setSearch] = useState('');
  const [maximizedSection, setMaximizedSection] = useState<'none' | 'left' | 'graph' | 'chat'>('none');
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [messages, setMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'assistant', timestamp: Date}>>([]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300); // Default width
  const [chatPanelWidth, setChatPanelWidth] = useState(400); // Default width
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const graphRef = useRef<{ fitView: () => void }>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Enhanced device detection with orientation support
  useEffect(() => {
    const detectDevice = () => {
      if (typeof window === 'undefined') return;
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      const userAgent = navigator.userAgent;
      
      // Initialize panel widths based on actual window size
      setLeftPanelWidth(width * 0.2);
      setChatPanelWidth(width * 0.4);
      
      // Detect device type
      const isMobileDevice = width < 768;
      const isTabletDevice = width >= 768 && width < 1024;
      const isDesktopDevice = width >= 1024;
      
      // More sophisticated mobile detection
      const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      // Determine orientation
      const currentOrientation = height > width ? 'portrait' : 'landscape';
      
      // Set device type with touch and user agent consideration
      let deviceCategory: 'mobile' | 'tablet' | 'desktop';
      if (isMobileDevice || (isTouchDevice && isMobileUserAgent && width < 768)) {
        deviceCategory = 'mobile';
      } else if (isTabletDevice || (isTouchDevice && width >= 768 && width < 1024)) {
        deviceCategory = 'tablet';
      } else {
        deviceCategory = 'desktop';
      }
      
      setIsMobile(deviceCategory === 'mobile');
      setIsTablet(deviceCategory === 'tablet');
      setDeviceType(deviceCategory);
      setOrientation(currentOrientation);
      
      console.log('Device detection:', {
        width,
        height,
        deviceCategory,
        orientation: currentOrientation,
        isTouchDevice,
        isMobileUserAgent
      });
    };
    
    detectDevice();
    
    // Listen for both resize and orientation changes
    const handleResize = () => detectDevice();
    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(detectDevice, 100);
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', handleOrientationChange);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, []);

  // Update panel widths on window resize to maintain proportions
  useEffect(() => {
    const handleResize = () => {
      if (!isMobile && typeof window !== 'undefined') {
        const newWidth = window.innerWidth;
        setLeftPanelWidth(newWidth * 0.2);
        setChatPanelWidth(newWidth * 0.4);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', handleResize);
      }
    };
  }, [isMobile]);

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

  // Reset and reload function
  const resetAndReload = async () => {
    console.log('🔄 Resetting and reloading data...');
    setLoading(true);
    setSelectedItem(null);
    setFlows([]);
    setAgents([]);
    setN8nWorkflows([]);
    
    // Small delay to ensure state is reset
    setTimeout(async () => {
      const fetchData = async () => {
        try {
          console.log('🔄 Fetching fresh data for activeTab:', activeTab);
          console.log('🔄 User ID:', user?.sub);
          
          let data;
          if (activeTab === 'flows') {
            data = await API.getFlows(user?.sub || undefined);
          } else if (activeTab === 'agents') {
            data = await API.getAgents();
          } else if (activeTab === 'n8n') {
            data = await API.getN8nWorkflows(user?.sub || undefined);
          }
            
          console.log('🔄 Fresh data received:', data);
          const arrayData = Array.isArray(data) ? data : [];
          
          if (activeTab === 'flows') {
            setFlows(arrayData);
            console.log('🔄 Flows set to:', arrayData.length, 'items');
          } else if (activeTab === 'agents') {
            setAgents(arrayData);
            console.log('🔄 Agents set to:', arrayData.length, 'items');
          } else if (activeTab === 'n8n') {
            setN8nWorkflows(arrayData);
            console.log('🔄 N8n workflows set to:', arrayData.length, 'items');
          }
          
          if (arrayData.length > 0) {
            console.log('🔄 Auto-selecting first item:', arrayData[0]);
            setSelectedItem(arrayData[0]);
          }
        } catch (error) {
          console.error('🔄 Error during reset and reload:', error);
        } finally {
          setLoading(false);
        }
      };
      
      await fetchData();
    }, 100);
  };

  // Expose functions to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).loadLatestFlowForUser = loadLatestFlowForUser;
      (window as any).resetAndReload = resetAndReload;
      (window as any).debugState = () => ({
        user: user?.sub,
        activeTab,
        flows: flows.length,
        agents: agents.length,
        selectedItem: selectedItem?.name || 'none'
      });
      
      console.log('🔧 Debug functions available:');
      console.log('  - loadLatestFlowForUser(userId)');
      console.log('  - resetAndReload()');
      console.log('  - debugState()');
      
      if (user?.sub) {
        console.log(`🔧 To test latest flow: loadLatestFlowForUser("${user.sub}")`);
      }
    }
  }, [user?.sub, activeTab, flows.length, agents.length, selectedItem]);

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
      .map(word => {
        // Special case for n8n - keep it lowercase
        if (word.toLowerCase() === 'n8n') return 'n8n';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  };

  // Helper function to clean and format AI messages
  const formatAIMessage = (text: string) => {
    if (!text) return '';
    
    return text
      // First, normalize all multiple line breaks to single ones
      .replace(/\n+/g, '\n')
      // Only allow double line breaks before major headers/sections
      .replace(/\n\s*(#{1,3}\s|🎯|Key Components|Next Steps|Flow ID|My reasoning:)/g, '\n\n$1')
      // Trim whitespace
      .trim();
  };

  // Function to manually load latest flow for a specific user
  const loadLatestFlowForUser = async (userId: string) => {
    try {
      setLoading(true);
      console.log('Manually loading latest flow for user:', userId);
      
      const latestFlow = await API.getLatestFlow(userId);
      console.log('Latest flow loaded for user:', latestFlow);
      
      if (latestFlow && !latestFlow.error) {
        setSelectedItem(latestFlow);
        console.log('Successfully set latest flow as selected item');
        return latestFlow;
      } else {
        console.log('No flows found for user:', userId);
        return null;
      }
    } catch (error) {
      console.error('Error loading latest flow for user:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load flows/agents
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let data;
        if (activeTab === 'flows') {
          data = await API.getFlows(user?.sub || undefined);
        } else if (activeTab === 'agents') {
          data = await API.getAgents();
        } else if (activeTab === 'n8n') {
          data = await API.getN8nWorkflows(user?.sub || undefined);
        }
        
        console.log(`${activeTab} API response:`, data, 'Type:', typeof data, 'IsArray:', Array.isArray(data));
        const arrayData = Array.isArray(data) ? data : [];
        
        if (activeTab === 'flows') {
          setFlows(arrayData);
        } else if (activeTab === 'agents') {
          setAgents(arrayData);
        } else if (activeTab === 'n8n') {
          setN8nWorkflows(arrayData);
        }
        
        // Auto-select latest flow for current user
        if (activeTab === 'flows' && user?.sub && arrayData.length > 0) {
          try {
            console.log('Loading latest flow for user:', user.sub);
            const latestFlow = await API.getLatestFlow(user.sub);
            console.log('Latest flow loaded:', latestFlow);
            
            if (latestFlow && !latestFlow.error) {
              setSelectedItem(latestFlow);
            } else {
              // Fallback to first available flow if no latest flow found
              const selectedItem = arrayData[0];
              if (selectedItem) {
                setSelectedItem(selectedItem);
              }
            }
          } catch (latestFlowError) {
            console.log('Error loading latest flow, using fallback:', latestFlowError);
            // Fallback to manual selection logic
            const userItems = arrayData.filter((item: any) => item.user_id === user.sub);
            if (userItems.length > 0) {
              const sortedUserItems = userItems.sort((a: any, b: any) => {
                const aDate = new Date(a.updated_at || a.created_at || 0);
                const bDate = new Date(b.updated_at || b.created_at || 0);
                return bDate.getTime() - aDate.getTime();
              });
              setSelectedItem(sortedUserItems[0]);
            } else if (arrayData.length > 0) {
              setSelectedItem(arrayData[0]);
            }
          }
        } else if (activeTab === 'agents' && arrayData.length > 0) {
          // For agents, use existing logic
          let selectedItem = null;
          if (user?.sub) {
            const userItems = arrayData.filter((item: any) => item.user_id === user.sub);
            if (userItems.length > 0) {
              const sortedUserItems = userItems.sort((a: any, b: any) => {
                const aDate = new Date(a.updated_at || a.created_at || 0);
                const bDate = new Date(b.updated_at || b.created_at || 0);
                return bDate.getTime() - aDate.getTime();
              });
              selectedItem = sortedUserItems[0];
            }
          }
          
          if (!selectedItem && arrayData.length > 0) {
            selectedItem = arrayData[0];
          }
          
          if (selectedItem) {
            setSelectedItem(selectedItem);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab, isMobile, user?.sub]);


  const items = activeTab === 'flows' ? flows : activeTab === 'agents' ? agents : n8nWorkflows;
  const filtered = (Array.isArray(items) ? items : []).filter((i) =>
    String(i.name || '').toLowerCase().includes(search.toLowerCase()) ||
    String(i.description || '').toLowerCase().includes(search.toLowerCase())
  );

  // Main user login flow
  useEffect(() => {
    // Step 1: Wait for Auth0 response
    if (!user?.sub || isLoading) {
      return;
    }

    // Step 2: User authenticated - ensure user exists in database and start loading latest chat
    const loadUserChat = async () => {
      try {
        console.log('User authenticated, ensuring user exists for user_id:', user.sub);
        
        // Step 2a: Ensure user exists in database (create if new user)
        const userResult = await API.ensureUser();
        console.log('User ensured in database:', userResult.created ? 'Created new user' : 'Updated existing user');
        console.log('User last_login updated to:', userResult.user?.last_login);
        
        // Step 3: Load latest chat_id for this user
        const chats = await API.getChats(user.sub!);
        console.log('User chats:', chats);
        
        if (chats && chats.length > 0) {
          // Step 4: Load latest chat and its messages
          const latestChat = chats[0];
          setCurrentChat(latestChat);
          
          const messages = await API.getMessages(latestChat._id);
          const formattedMessages = messages.map((msg: any) => ({
            id: msg._id,
            text: msg.text || msg.content || '',
            sender: msg.role === 'user' ? 'user' : 'assistant',
            timestamp: new Date(msg.created_at)
          }));
          setMessages(formattedMessages);
          
          console.log('Loaded latest chat with', formattedMessages.length, 'messages');
        } else {
          // Step 5: No chat_id exists → create one
          console.log('No existing chat found, creating new chat');
          const chatTitle = `Welcome ${user.name || user.nickname || 'User'}`;
          const newChat = await API.createChat(chatTitle, user.sub!);
          setCurrentChat(newChat);
          
          // Create greeting message
          const greetingText = `Hello ${user.name || user.nickname || 'there'}! 👋 Welcome to VibeFlows!`;
          const savedMessage = await API.sendMessage(newChat._id, greetingText, 'assistant');
          
          setMessages([{
            id: savedMessage._id || '1',
            text: greetingText,
            sender: 'assistant',
            timestamp: new Date(savedMessage.created_at || new Date())
          }]);
          
          console.log('Created new chat with greeting message');
        }
        
        // Create user session after chat is loaded
        const sessionId = await createUserSession({
          user_profile: {
            name: user.name,
            email: user.email,
            nickname: user.nickname,
            picture: user.picture
          }
        });
        setSessionId(sessionId);
        
      } catch (error) {
        console.error('Error in user login flow:', error);
      }
    };
    
    loadUserChat();
  }, [user, isLoading]);


  const createNewChat = async (userQuery?: string) => {
    if (!user?.sub) {
      console.log('User not authenticated');
      return;
    }

    try {
      console.log('Creating new chat for user_id:', user?.sub);
      
      let chatTitle = userQuery || `New Chat ${new Date().toLocaleDateString()}`;
      
      if (chatTitle.length > 40) {
        chatTitle = chatTitle.substring(0, 40).replace(/\s+\S*$/, '');
      }
      
      const newChat = await API.createChat(chatTitle, user!.sub!);
      setCurrentChat(newChat);
      
      if (sessionId) {
        await updateUserSession(sessionId, { chat_id: newChat._id });
      }
      
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

  const loadN8nWorkflow = async () => {
    // Switch to n8n tab and load latest workflow
    setActiveTab('n8n');
    setSelectedItem(null);
    setSelectedNode(null);
    
    // Load latest n8n workflow and auto-select it
    if (user?.sub) {
      try {
        const data = await API.getN8nWorkflows(user.sub);
        const workflows = Array.isArray(data) ? data : [];
        setN8nWorkflows(workflows);
        
        // Auto-select the latest (first) workflow
        if (workflows.length > 0) {
          setSelectedItem(workflows[0]);
          console.log('Auto-selected latest n8n workflow:', workflows[0].name);
        }
      } catch (error) {
        console.error('Error loading n8n workflows:', error);
      }
    }
  };


  const sendMessage = async (messageText: string) => {
    if (messageText.trim() && !isStreaming) {
      if (!user?.sub) {
        console.log('User not authenticated');
        return;
      }
      const userMessage = {
        id: Date.now().toString(),
        text: messageText,
        sender: 'user' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage]);
      setIsStreaming(true);

      try {
        const response = await API.callAIAutomation(userMessage.text, currentChat?._id, user!.sub!);
        
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
                      
                      // Mobile-optimized message filtering
                      if (isMobile) {
                        switch (data.type) {
                          case 'thought_stream':
                            // Main content only on mobile
                            messageToAdd = data.message;
                            break;
                            
                          case 'final':
                            // Final results
                            messageToAdd = `\n**${data.message}**`;
                            break;
                            
                          case 'tool_result':
                            // Important tool results only
                            messageToAdd = `\n${data.message}\n`;
                            break;
                            
                          // Skip all other verbose messages on mobile
                          case 'iteration':
                          case 'thinking':
                          case 'reasoning_start':
                          case 'tool_prep':
                          case 'tool_ready':
                          case 'executing':
                          case 'tool_stream':
                          case 'reasoning_done':
                          case 'continue':
                          case 'keepalive':
                          case 'tool_input':
                            continue;
                            
                          default:
                            continue;
                        }
                      } else {
                        // Desktop - show more detail
                        switch (data.type) {
                          case 'thought_stream':
                            messageToAdd = data.message;
                            break;
                            
                          case 'iteration':
                            messageToAdd = `\n**${data.message}**\n`;
                            break;
                            
                          case 'thinking':
                          case 'reasoning_start':
                            messageToAdd = `\n*${data.message}*\n`;
                            break;
                            
                          case 'tool_prep':
                          case 'tool_ready':
                          case 'executing':
                            messageToAdd = `\n${data.message}\n`;
                            break;
                            
                          case 'tool_result':
                          case 'tool_stream':
                            messageToAdd = `\n${data.message}\n`;
                            break;
                            
                          case 'final':
                            messageToAdd = `\n**${data.message}**`;
                            break;
                            
                          case 'reasoning_done':
                          case 'continue':
                            messageToAdd = `\n*${data.message}*\n`;
                            break;
                            
                          case 'keepalive':
                          case 'tool_input':
                            continue;
                            
                          default:
                            messageToAdd = `\n*${data.message}`;
                        }
                      }
                      
                      if (messageToAdd) {
                        accumulatedText += messageToAdd;
                        
                        // Update UI less frequently for thought_stream to avoid choppy display
                        const now = Date.now();
                        const isImportantMessage = ['iteration', 'final', 'tool_result'].includes(data.type);
                        const hasCompleteThought = data.type === 'thought_stream' && (/[.!?]\s*$/.test(messageToAdd) || messageToAdd.length > 10);
                        const enoughTimeElapsed = now - lastUpdateTime >= UPDATE_INTERVAL;
                        
                        // Mobile-optimized update frequency
                        if (isMobile) {
                          // Less frequent updates on mobile for cleaner experience
                          if (data.type === 'thought_stream') {
                            if (hasCompleteThought || now - lastUpdateTime >= 500) {
                              updateMessage(accumulatedText);
                              lastUpdateTime = now;
                            }
                          } else if (isImportantMessage) {
                            updateMessage(accumulatedText);
                            lastUpdateTime = now;
                          }
                        } else {
                          // Desktop - normal frequency
                          if (data.type === 'thought_stream') {
                            if (hasCompleteThought || enoughTimeElapsed) {
                              updateMessage(accumulatedText);
                              lastUpdateTime = now;
                            }
                          } else if (isImportantMessage || enoughTimeElapsed) {
                            updateMessage(accumulatedText);
                            lastUpdateTime = now;
                          }
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

  // Auto-scroll to bottom when chat is maximized
  useEffect(() => {
    if (isMobile && maximizedSection === 'chat') {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [maximizedSection, isMobile]);

  // Mouse drag handlers for resizable panels
  const handleMouseDown = (side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(side);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || typeof window === 'undefined') return;
    
    const containerWidth = window.innerWidth;
    const minWidth = containerWidth * 0.15; // 15% minimum
    const maxWidth = containerWidth * 0.6;  // 60% maximum
    
    if (isDragging === 'left') {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setLeftPanelWidth(newWidth);
    } else if (isDragging === 'right') {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, containerWidth - e.clientX));
      setChatPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging && typeof document !== 'undefined') {
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
    <>
      {isMobile && (
        <style jsx global>{`
          /* Mobile container that adapts to dynamic browser bars */
          .mobile-container {
            height: 100dvh;
            height: 100vh;
            height: 100svh;
            min-height: 100dvh;
            min-height: 100vh; 
            min-height: 100svh;
            position: relative;
            z-index: 1;
            padding-top: env(safe-area-inset-top, 20px);
            padding-bottom: env(safe-area-inset-bottom, 20px);
            margin: 0;
            overflow: hidden;
          }
          
          /* Ensure full viewport usage regardless of browser bars */
          @supports (height: 100dvh) {
            .mobile-container {
              height: 100dvh;
              min-height: 100dvh;
            }
          }
          
          @supports (height: 100svh) {
            .mobile-container {
              height: 100svh;
              min-height: 100svh;
            }
          }
          
          /* Mobile navigation with proper layering */
          .mobile-nav-overlay {
            z-index: 999999 !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
          }
          
          .mobile-nav-sidebar {
            z-index: 999999 !important;
            position: relative;
          }
          
          /* Ensure chat input is always visible above Chrome buttons */
          .mobile-chat-input {
            bottom: calc(env(safe-area-inset-bottom, 0px) + 80px) !important;
            margin-bottom: env(safe-area-inset-bottom, 80px);
            padding-bottom: 20px;
          }
        `}</style>
      )}
      <div 
        className={`bg-gray-900 text-white flex flex-col ${
          isMobile ? 'mobile-container' : 'h-screen'
        }`}
      >
      {/* Header */}
      <header className={`bg-gray-800 px-4 md:px-6 py-4 flex justify-between items-center border-b border-gray-700 relative z-50 ${isMobile ? 'h-[10vh] min-h-[60px]' : ''}`}>
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
        
        {/* Mobile Flow Title */}
        {isMobile && (
          <div className="flex-1 text-center px-4">
            <h1 className="text-xs sm:text-sm md:text-base font-semibold text-white truncate">
              {selectedItem?.name ? formatName(selectedItem.name) : 
               activeTab === 'flows' ? 'Flows' : 
               activeTab === 'agents' ? 'Agents' : 'n8n Workflows'}
            </h1>
          </div>
        )}
        
        {/* Tab Navigation - Hidden on mobile, shown in sidebar */}
        <div className={`${isMobile ? 'hidden' : 'flex'} gap-2`}>
          {['flows', 'agents', 'n8n'].map((t) => (
            <button
              key={t}
              onClick={() => {
                if (t === 'n8n') {
                  loadN8nWorkflow();
                } else {
                  setActiveTab(t as any);
                  setSelectedItem(null);
                  setSelectedNode(null);
                }
                setIsMobileMenuOpen(false);
              }}
              className={`
                group relative px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 
                flex items-center gap-1 md:gap-2 overflow-hidden
                ${activeTab === t 
                  ? t === 'flows'
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                    : t === 'agents'
                    ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/30 scale-105'
                    : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                  : t === 'flows'
                    ? 'bg-gray-700/50 text-gray-300 hover:bg-emerald-600/20 hover:text-emerald-300 hover:scale-102 border border-emerald-500/20'
                    : t === 'agents'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-400 text-white hover:bg-gradient-to-r hover:from-purple-400 hover:to-purple-300 hover:text-white hover:scale-105 border-2 border-purple-400 hover:border-purple-300 transition-all duration-300'
                    : 'bg-gradient-to-r from-orange-500/50 to-red-500/50 text-white hover:bg-gradient-to-r hover:from-orange-400 hover:to-red-400 hover:text-white hover:scale-105 border-2 border-orange-400/50 hover:border-orange-300 transition-all duration-300'
                }
              `}
            >
              {t === 'flows' ? (
                <Network size={16} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'
                }`} />
              ) : t === 'agents' ? (
                <Bot size={16} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-white'
                }`} />
              ) : (
                <Zap size={16} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-orange-400 group-hover:text-orange-300'
                }`} />
              )}
              
              <span className="relative z-10">
                {formatName(t.charAt(0).toUpperCase() + t.slice(1))}
              </span>
            </button>
          ))}
          {/* Keys Button */}
          <button
            onClick={() => setShowKeysManager(true)}
            className="group relative px-3 md:px-6 py-2 md:py-3 rounded-xl font-semibold text-xs md:text-sm transition-all duration-300 
              flex items-center gap-1 md:gap-2 overflow-hidden
              bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/30 hover:scale-105"
          >
            <Key size={16} className="text-white" />
            <span className="relative z-10">Keys</span>
          </button>

        </div>
        
        {/* User menu */}
        <div className="flex items-center gap-2">
          <User size={18} className="md:block hidden" />
          <span className="text-xs md:text-sm text-gray-300 mr-2 hidden md:block">
            {isLoading ? 'Loading...' : String(user?.name || user?.nickname || user?.given_name || user?.email || 'User')}
          </span>
          {user && (
            <a
              href="/api/auth/logout"
              className="hidden md:flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-xs md:text-sm"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </a>
          )}
          {!user && !isLoading && (
            <a
              href="/api/auth/login"
              className="flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1 md:py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-xs md:text-sm"
            >
              <LogIn size={14} />
              <span className="hidden md:inline">Login</span>
            </a>
          )}
        </div>
      </header>

      {/* Mobile Navigation Sidebar */}
      {(isMobile || isTablet) && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 mobile-nav-overlay">
          {/* Full Screen Sidebar */}
          <div className="bg-gray-800 shadow-lg flex flex-col mobile-nav-sidebar w-full h-full">
            <div className="p-4 border-b border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-end">
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
              {/* Main Navigation */}
              {['flows', 'agents', 'n8n'].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (t === 'n8n') {
                      loadN8nWorkflow();
                    } else {
                      setActiveTab(t as any);
                      setSelectedItem(null);
                      setSelectedNode(null);
                    }
                    
                    if (isMobile) {
                      // In mobile, show the left panel with items to choose from (except for n8n which auto-selects)
                      if (t !== 'n8n') {
                        setMaximizedSection('left');
                      }
                      setIsMobileMenuOpen(false);
                    } else {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                  className={`
                    w-full flex items-center gap-4 px-6 py-5 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg
                    ${activeTab === t 
                      ? t === 'flows'
                        ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30 border border-emerald-400/50'
                        : t === 'agents'
                        ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-purple-500/50 border border-purple-400/50 ring-2 ring-purple-400/30'
                        : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/50 border border-orange-400/50 ring-2 ring-orange-400/30'
                      : t === 'flows'
                        ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600 border border-gray-600/50'
                        : t === 'agents'
                        ? 'bg-gradient-to-r from-purple-600/20 to-violet-600/20 text-purple-200 hover:from-purple-500/30 hover:to-violet-500/30 border border-purple-500/30 hover:border-purple-400/50'
                        : 'bg-gradient-to-r from-orange-600/20 to-red-600/20 text-orange-200 hover:from-orange-500/30 hover:to-red-500/30 border border-orange-500/30 hover:border-orange-400/50'
                    }
                  `}
                >
                  {t === 'flows' ? (
                    <Network size={18} className={activeTab === t ? 'text-white' : 'text-emerald-400'} />
                  ) : t === 'agents' ? (
                    <Bot size={18} className={activeTab === t ? 'text-white' : 'text-purple-300'} />
                  ) : (
                    <Zap size={18} className={activeTab === t ? 'text-white' : 'text-orange-300'} />
                  )}
                  {formatName(t.charAt(0).toUpperCase() + t.slice(1))}
                </button>
              ))}
              
              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-700 space-y-4">
                <button
                  onClick={() => {
                    setShowKeysManager(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-4 px-6 py-5 rounded-xl font-semibold text-lg bg-yellow-600/20 text-yellow-200 hover:bg-yellow-500/30 border border-yellow-500/30 hover:border-yellow-400/50 transition-all duration-300 shadow-lg"
                >
                  <Key size={20} className="text-yellow-400" />
                  API Keys
                </button>
                
                
                {/* User Section */}
                {user && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-4 px-6 py-3 mb-4">
                      <User size={20} className="text-gray-400" />
                      <span className="text-lg text-gray-300 truncate font-medium">
                        {user.name || user.nickname || user.email || 'User'}
                      </span>
                    </div>
                    <a
                      href="/api/auth/logout"
                      className="w-full flex items-center gap-4 px-6 py-5 rounded-xl font-semibold text-lg bg-red-600/20 text-red-200 hover:bg-red-500/30 border border-red-500/30 hover:border-red-400/50 transition-all duration-300 shadow-lg"
                    >
                      <LogOut size={20} className="text-red-400" />
                      Logout
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      

      <div className={`${isMobile ? 'flex flex-col' : 'flex'} flex-1 overflow-hidden relative`} style={{ paddingBottom: isMobile ? '80px' : '90px' }}>
        {/* Left Sidebar - Flows/Agents List */}
        <div className={`${
          isMobile ? (maximizedSection === 'left' ? 'flex-1' : 'hidden') :
          maximizedSection === 'graph' || maximizedSection === 'chat' ? 'hidden' : 
          maximizedSection === 'left' ? 'flex-1' : ''
        } ${isMobile && maximizedSection === 'left' ? '' : 'border-r border-gray-700'} flex flex-col bg-gray-900`}
        style={maximizedSection === 'left' || isMobile ? {} : { 
          width: `${leftPanelWidth}px`,
          minWidth: `${leftPanelWidth}px`,
          maxWidth: `${leftPanelWidth}px`
        }}>
          {/* Left Panel - List */}
          <div 
            className={`${
              isMobile && maximizedSection === 'left' 
                ? 'bg-gray-800 w-full flex flex-col h-full' 
                : 'bg-gray-800 border-r border-gray-700 overflow-y-auto'
            } transition-all duration-300 ${
              maximizedSection === 'left' ? 'w-full h-full' : 
              maximizedSection !== 'none' ? 'w-0 opacity-0' : ''
            }`}
            style={{ 
              width: maximizedSection === 'none' ? `${leftPanelWidth}px` : undefined,
              height: isMobile && maximizedSection === 'left' ? '100vh' : undefined
            }}
          >
            {/* Left Panel Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                {isMobile && maximizedSection === 'left' && (
                  <button
                    onClick={() => setMaximizedSection('none')}
                    className="p-1 hover:bg-gray-600 rounded transition-colors"
                    title="Back to dashboard"
                  >
                    <X size={16} className="text-gray-300" />
                  </button>
                )}
                <h2 className="font-semibold text-white">
                  {selectedNode ? 'Node Details' : 
                   isMobile && maximizedSection === 'left' ? `Choose ${formatName(activeTab === 'n8n' ? 'n8n Workflows' : activeTab)}` :
                   formatName(activeTab === 'n8n' ? 'n8n Workflows' : activeTab)}
                </h2>
              </div>
              <div className="flex gap-2">
                {!isMobile && (
                  <button
                    onClick={() => setMaximizedSection(maximizedSection === 'left' ? 'none' : 'left')}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    {maximizedSection === 'left' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                )}
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
              <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 flex-shrink-0">
                  <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-white"
                  />
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div 
                    className="flex-1 overflow-y-auto px-4 pb-4"
                    style={{ 
                      WebkitOverflowScrolling: 'touch',
                      height: isMobile && maximizedSection === 'left' ? 'calc(100vh - 200px)' : 
                             isMobile ? 'calc(50vh - 100px)' : 'auto',
                      minHeight: isMobile ? '300px' : 'auto'
                    }}
                  >
                    <div className="space-y-2">
                    {filtered.map((item) => (
                      <div
                        key={getItemId(item)}
                        onClick={() => {
                          setSelectedItem(item);
                          if (isMobile) {
                            // In mobile, close the left panel after selection
                            setMaximizedSection('none');
                          }
                        }}
                        className={`p-3 rounded cursor-pointer transition-colors ${
                          selectedItem && getItemId(selectedItem) === getItemId(item)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {activeTab === 'flows' ? (
                            <Network size={16} className="text-green-400" />
                          ) : activeTab === 'agents' ? (
                            <Bot size={16} className="text-purple-400" />
                          ) : (
                            <Zap size={16} className="text-orange-400" />
                          )}
                          <span className="font-medium text-sm flex-1">{formatName(String(item?.name || ''))}</span>
                          
                          {/* Link button for n8n workflows */}
                          {activeTab === 'n8n' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent selecting the item
                                console.log('Clicked workflow item:', item);
                                console.log('URL field:', item?.url);
                                console.log('n8n_response:', item?.n8n_response);
                                console.log('workflow_json:', item?.workflow_json);
                                
                                if (item?.url) {
                                  console.log('Opening URL:', item.url);
                                  window.open(item.url, '_blank', 'noopener,noreferrer');
                                } else {
                                  console.log('No URL available for workflow:', item);
                                  alert('No n8n URL configured for this workflow. Check console for details.');
                                }
                              }}
                              className="p-1 rounded hover:bg-gray-600 transition-colors"
                              title={item?.url ? "Open in n8n" : "No n8n URL available"}
                            >
                              <ExternalLink size={14} className={item?.url ? "text-gray-300 hover:text-white" : "text-gray-500"} />
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{String(item?.description || '')}</p>
                      </div>
                    ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resize Handle */}
          {maximizedSection === 'none' && !isMobile && (
            <div
              className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-gray-600 hover:bg-gray-500 transition-colors"
              onMouseDown={handleMouseDown('left')}
            />
          )}
        </div>


        {/* Center - Graph View - 70% width when n8n is shown */}
        <div className={`${
          isMobile ? (maximizedSection === 'chat' || maximizedSection === 'left' ? 'hidden' : 'flex-1 order-1') :
          maximizedSection === 'left' || maximizedSection === 'chat' ? 'hidden' :
          maximizedSection === 'graph' ? 'flex-1' : 'flex-1'
        } bg-gray-900 flex flex-col relative ${isMobile ? 'pt-2' : ''}`}
        style={isMobile ? (maximizedSection === 'graph' ? { height: '90vh' } : { height: '60vh' }) : {}}>
          


          
          <div className="flex-1 w-full relative">
            {/* Desktop maximize button - top right corner */}
            {!isMobile && (
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                  onClick={() => setMaximizedSection(maximizedSection === 'graph' ? 'none' : 'graph')}
                  className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-lg transition-colors shadow-lg"
                  title={maximizedSection === 'graph' ? 'Restore' : 'Maximize Graph'}
                >
                  {maximizedSection === 'graph' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            )}
            
            {/* Mobile maximize button - smaller, different position */}
            {isMobile && (
              <button
                onClick={() => setMaximizedSection(maximizedSection === 'graph' ? 'none' : 'graph')}
                className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full transition-all duration-200 flex items-center justify-center bg-gray-700/80 hover:bg-gray-600/90 shadow-lg"
                title={maximizedSection === 'graph' ? 'Minimize graph' : 'Maximize graph'}
              >
                {maximizedSection === 'graph' ? <Minimize2 size={12} className="text-gray-300" /> : <Maximize2 size={12} className="text-gray-300" />}
              </button>
            )}
            
            <GraphPanel
              ref={graphRef}
              selectedItem={selectedItem}
              selectedNode={selectedNode}
              onNodeSelect={(node) => setSelectedNode(node)}
              maximizedSection={maximizedSection}
              onMaximizeToggle={() => setMaximizedSection(maximizedSection === 'graph' ? 'none' : 'graph')}
            />
          </div>
          
          {/* Mobile Vertical Resize Handle */}
          {isMobile && (
            <div className="h-1 w-full bg-gray-600 hover:bg-gray-500 cursor-row-resize transition-colors" />
          )}
        </div>

        {/* Right Sidebar - Chat */}
        <div className={`${
          isMobile ? (maximizedSection === 'chat' || maximizedSection === 'graph' ? 'hidden' : 'order-2 border-t') :
          (maximizedSection === 'left' || maximizedSection === 'graph') ? 'hidden' : 
          maximizedSection === 'chat' ? 'flex-1' : ''
        } ${isMobile ? 'border-gray-700' : 'border-l border-gray-700'} flex flex-col bg-white/5 backdrop-blur-sm relative ${
          isMobile ? 'w-full' : ''
        }`}
        style={maximizedSection === 'chat' && !isMobile ? {} : 
          isMobile ? 
            (maximizedSection === 'chat' ? 
              { height: orientation === 'landscape' ? '50vh' : '70vh' } : 
              { height: '20vh' }
            ) : { 
            width: `${chatPanelWidth}px`,
            minWidth: `${chatPanelWidth}px`,
            maxWidth: `${chatPanelWidth}px`
          }}>
          {/* Chat Header - Hidden on mobile */}
          {!isMobile && (
            <div className={`${isMobile ? 'p-3' : 'p-4'} border-b border-white/10 flex-shrink-0`}>
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
                  onClick={() => createNewChat()}
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
          )}

          {/* Messages */}
          <div 
            className={`flex-1 overflow-y-auto space-y-4 ${
              isMobile ? 'p-2' : 'p-4'
            } ${isMobile && orientation === 'landscape' ? 'max-h-96' : ''}`}
            style={{ 
              WebkitOverflowScrolling: 'touch',
              paddingBottom: isMobile && maximizedSection === 'chat' ? '100px' : '20px',
              height: isMobile && maximizedSection === 'chat' ? '90vh' : 'auto'
            }}
          >
            {messages.map((message) => (
              <div
                key={String(message.id || Math.random())}
                className={`flex gap-2 md:gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'assistant' && (
                  <div className={`bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isMobile ? 'w-6 h-6' : 'w-8 h-8'
                  }`}>
                    <Bot size={isMobile ? 12 : 16} className="text-white" />
                  </div>
                )}
                
                <div
                  className={`px-3 md:px-4 py-2 md:py-3 rounded-2xl text-xs md:text-sm shadow-lg ${
                    isMobile ? 'max-w-[85%]' : 'max-w-lg'
                  } ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-gray-100 border border-white/20'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <div className="whitespace-pre-wrap break-words">
                    <div className={`prose ${message.sender === 'user' ? 'prose-invert' : 'prose-gray'} max-w-none`}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({children}) => <p className="mb-2 last:mb-0 leading-normal">{children}</p>,
                          strong: ({children}) => <strong className="font-bold text-white bg-blue-500/20 px-1 py-0.5 rounded">{children}</strong>,
                          em: ({children}) => <em className="text-gray-300 italic">{children}</em>,
                          code: ({children}) => <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono text-green-400">{children}</code>,
                          pre: ({children}) => <pre className="bg-gray-800 p-2 rounded text-xs overflow-x-auto my-1">{children}</pre>,
                          ul: ({children}) => <ul className="list-disc list-inside space-y-1 ml-2 mb-2">{children}</ul>,
                          ol: ({children}) => <ol className="list-decimal list-inside space-y-1 ml-2 mb-2">{children}</ol>,
                          li: ({children}) => <li className="text-gray-200">{children}</li>,
                          h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                          h2: ({children}) => <h2 className="text-base font-bold mb-1 text-blue-400">{children}</h2>,
                          h3: ({children}) => <h3 className="text-sm font-semibold mb-1 text-purple-400">{children}</h3>,
                          h4: ({children}) => <h4 className="text-sm font-semibold mb-1 text-gray-300">{children}</h4>,
                          blockquote: ({children}) => <blockquote className="border-l-2 border-blue-500 pl-2 italic text-gray-300 my-1">{children}</blockquote>,
                          hr: () => <hr className="border-gray-600 my-2" />,
                          a: ({children, href}) => <a href={href} className="text-blue-400 hover:text-blue-300 underline">{children}</a>,
                          table: ({children}) => <table className="w-full border-collapse border border-gray-600 my-2">{children}</table>,
                          th: ({children}) => <th className="border border-gray-600 p-1 bg-gray-800 font-semibold text-left text-xs">{children}</th>,
                          td: ({children}) => <td className="border border-gray-600 p-1 text-xs">{children}</td>,
                        }}
                      >
                        {message.sender === 'assistant' ? formatAIMessage(String(message.text || '')) : String(message.text || '')}
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
                  <div className={`bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isMobile ? 'w-6 h-6' : 'w-8 h-8'
                  }`}>
                    <User size={isMobile ? 12 : 16} className="text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Mobile Chat Controls - Always visible on mobile */}
          {isMobile && (
            <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
              {/* New Chat Button */}
              <button
                onClick={() => createNewChat()}
                className="w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center bg-blue-600/90 hover:bg-blue-700/95 shadow-lg border-2 border-blue-400/20"
                title="Start new chat"
              >
                <Plus size={16} className="text-white" />
              </button>
              
              {/* Maximize/Minimize Button */}
              <button
                onClick={() => setMaximizedSection(maximizedSection === 'chat' ? 'none' : 'chat')}
                className="w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center bg-gray-700/90 hover:bg-gray-600/95 shadow-lg border-2 border-gray-500/20"
                title={maximizedSection === 'chat' ? 'Minimize chat' : 'Maximize chat'}
              >
                {maximizedSection === 'chat' ? <Minimize2 size={16} className="text-white" /> : <Maximize2 size={16} className="text-white" />}
              </button>
            </div>
          )}


          {/* Resize Handle */}
          {maximizedSection === 'none' && !isMobile && (
            <div
              className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-gray-600 hover:bg-gray-500 transition-colors"
              onMouseDown={handleMouseDown('right')}
            />
          )}
        </div>

        {/* Mobile Chat Section - Only visible when chat is maximized */}
        {isMobile && maximizedSection === 'chat' && (
          <div className="fixed inset-0 z-40 bg-gray-900 flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh' }}>
            {/* Header with controls */}
            <div className="flex-shrink-0 flex items-center justify-between p-4 bg-gray-800/90 border-b border-gray-700" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}>
              <h3 className="text-white font-semibold">Chat</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => createNewChat()}
                  className="w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center bg-blue-600/90 hover:bg-blue-700/95 shadow-lg"
                  title="Start new chat"
                >
                  <Plus size={14} className="text-white" />
                </button>
                <button
                  onClick={() => setMaximizedSection('none')}
                  className="w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center bg-gray-700/90 hover:bg-gray-600/95 shadow-lg"
                  title="Minimize chat"
                >
                  <Minimize2 size={14} className="text-white" />
                </button>
              </div>
            </div>
            
            {/* Messages - Flexible height with proper scrolling */}
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
              style={{ 
                WebkitOverflowScrolling: 'touch',
                paddingBottom: '8px'
              }}
            >
              {messages.map((message) => (
                <div
                  key={String(message.id || Math.random())}
                  className={`flex gap-2 md:gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'assistant' && (
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <Bot size={12} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ml-auto'
                      : 'bg-gray-800/80 text-gray-100 border border-gray-700'
                  }`}>
                    <div className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                  {message.sender === 'user' && (
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0 w-6 h-6">
                      <User size={12} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {isStreaming && (
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 w-6 h-6">
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="bg-gray-800/80 text-gray-100 border border-gray-700 p-3 rounded-2xl">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            
            {/* Chat Input - Fixed at bottom */}
            <div className="flex-shrink-0">
              <ChatInput
                onSendMessage={sendMessage}
                isStreaming={isStreaming}
                disabled={!currentChat}
                placeholder={currentChat ? "Type your message..." : "Create a chat to start messaging"}
                isChatMaximized={true}
              />
            </div>
            
            {/* Mobile Chat Controls - Also show when maximized */}
            <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2">
              {/* New Chat Button */}
              <button
                onClick={() => createNewChat()}
                className="w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center bg-blue-600/90 hover:bg-blue-700/95 shadow-lg border-2 border-blue-400/20"
                title="Start new chat"
              >
                <Plus size={16} className="text-white" />
              </button>
              
              {/* Maximize/Minimize Button */}
              <button
                onClick={() => setMaximizedSection('none')}
                className="w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center bg-gray-700/90 hover:bg-gray-600/95 shadow-lg border-2 border-gray-500/20"
                title="Minimize chat"
              >
                <Minimize2 size={16} className="text-white" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keys Manager Modal */}
      {showKeysManager && (
        <KeysManager onClose={() => setShowKeysManager(false)} />
      )}

      {/* Persistent Chat Input - Only visible when chat is not maximized on mobile */}
      {!(isMobile && maximizedSection === 'chat') && (
        <ChatInput
          onSendMessage={sendMessage}
          isStreaming={isStreaming}
          disabled={!user?.sub}
          placeholder={isMobile ? "Ask me..." : "Ask me anything..."}
        />
      )}
    </div>
    </>
  );
};

export default Dashboard; 