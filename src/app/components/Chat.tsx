'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@auth0/nextjs-auth0/client';
import { Message } from '@/models/Chat';
import { Send, Bot, User, Layout, Menu, Trash2 } from 'lucide-react';
import WorkflowDAG from './WorkflowDAG';
import mermaid from 'mermaid';
import ReactFlow, { 
  ReactFlowProvider, 
  Controls, 
  Background, 
  ReactFlowInstance,
  Node,
  Edge,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Initialize mermaid with proper configuration
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'dark',
    securityLevel: 'loose',
    themeVariables: {
      darkMode: true,
      background: '#1f2937',
      primaryColor: '#4f46e5',
      primaryTextColor: '#ffffff',
      primaryBorderColor: '#4f46e5',
      lineColor: '#4f46e5',
      secondaryColor: '#4f46e5',
      tertiaryColor: '#4f46e5',
    }
  });
}

interface ChatProps {
  chatId: string | null;
  onChatIdChange: (id: string) => void;
  systemMessage: string;
  welcomeMessage: string;
  chatType: 'workflow' | 'support';
  allChats: { id: string; title: string; created_at: string; messageCount: number }[];
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

// MermaidDiagram component
function MermaidDiagram({ diagramText }: { diagramText: string }) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderDiagram = async () => {
      try {
        setError(null);
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // Clean up the diagram text
        const cleanText = diagramText.trim().replace(/\r\n/g, '\n');
        console.log('Rendering diagram:', cleanText);
        
        const { svg } = await mermaid.render(id, cleanText);
        setSvg(svg);
      } catch (error) {
        console.error('Error rendering mermaid diagram:', error);
        setError(error instanceof Error ? error.message : 'Failed to render diagram');
      }
    };

    renderDiagram();
  }, [diagramText]);

  if (error) {
    return <div className="text-red-500 p-2">{error}</div>;
  }

  return (
    <div 
      className="w-full min-h-[400px] flex items-center justify-center"
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
}

// WorkflowFlow component for visualizing workflows
const WorkflowFlow = ({ nodeList }: { nodeList: any[] }) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  useEffect(() => {
    if (nodeList && nodeList.length > 0) {
      // Transform nodes for React Flow
      const transformedNodes: Node[] = nodeList.map((node, index) => ({
        id: node.id || `node-${index}`,
        type: 'default',
        position: { x: index * 250, y: 0 },
        data: { 
          label: node.label || 'Unnamed Node',
          description: node.description || ''
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      }));

      // Create edges between nodes
      const edges: Edge[] = nodeList.slice(1).map((_, index) => ({
        id: `edge-${index}`,
        source: transformedNodes[index].id,
        target: transformedNodes[index + 1].id,
        type: 'smoothstep',
        animated: true
      }));

      setNodes(transformedNodes);
      setEdges(edges);

      // Fit view after nodes are set
      setTimeout(() => {
        if (reactFlowInstance) {
          reactFlowInstance.fitView({ padding: 0.2 });
        }
      }, 100);
    }
  }, [nodeList, reactFlowInstance]);

  return (
    <div className="w-full h-[400px] bg-gray-900 rounded-lg overflow-hidden">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onInit={setReactFlowInstance}
          fitView
          className="bg-gray-900"
        >
          <Background />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [showDAG, setShowDAG] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);

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

  // Add effect to render mermaid diagrams
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const renderMermaidDiagrams = async () => {
      try {
        setMermaidError(null);
        // Reset mermaid to clear any previous renders
        mermaid.contentLoaded();
        
        // Find all mermaid diagrams and render them
        const mermaidElements = document.querySelectorAll('.mermaid');
        mermaidElements.forEach(async (element) => {
          try {
            const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
            element.setAttribute('data-processed', 'false');
            element.id = id;
            
            // Clean up the diagram text
            let diagramText = element.textContent || '';
            // Remove any leading/trailing whitespace and normalize line endings
            diagramText = diagramText.trim().replace(/\r\n/g, '\n');
            
            // Debug log
            console.log('Diagram text:', diagramText);
            
            // Ensure the diagram type is properly specified
            if (!diagramText.startsWith('flowchart') && 
                !diagramText.startsWith('graph') && 
                !diagramText.startsWith('sequenceDiagram')) {
              throw new Error('Invalid diagram type. Must start with flowchart, graph, or sequenceDiagram');
            }
            
            const { svg } = await mermaid.render(id, diagramText);
            element.innerHTML = svg;
          } catch (error) {
            console.error('Error rendering mermaid diagram:', error);
            setMermaidError(error instanceof Error ? error.message : 'Failed to render diagram');
            element.innerHTML = `<div class="text-red-500 p-2">Failed to render diagram: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
          }
        });
      } catch (error) {
        console.error('Error in mermaid rendering:', error);
        setMermaidError(error instanceof Error ? error.message : 'Failed to initialize mermaid');
      }
    };

    // Small delay to ensure DOM is ready
    setTimeout(renderMermaidDiagrams, 100);
  }, [messages]);

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || !chatId || !user?.sub) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      chatId: chatId as string,
      text,
      sender: 'user',
      timestamp: new Date(),
      type: 'simple_text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      // Save user message to database
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message: userMessage,
          chatType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save message');
      }

      // Reload messages after saving
      const messagesResponse = await fetch(`/api/chat?chatId=${chatId}&userId=${user.sub}`);
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json();
        setMessages(messagesData.messages || []);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (!user?.sub) return;
    
    try {
      setDeletingChatId(chatIdToDelete);
      await onDeleteChat(chatIdToDelete);
      // Clear messages if we deleted the current chat
      if (chatIdToDelete === chatId) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    } finally {
      setDeletingChatId(null);
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
    <div className="flex h-full">
      {/* Chat History Menu */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${showChatList ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-white text-lg font-semibold">Chat History</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/chat/create', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      title: 'New Chat',
                      type: 'workflow'
                    }),
                  });

                  if (!response.ok) {
                    throw new Error('Failed to create chat');
                  }

                  const data = await response.json();
                  if (data?.chatId) {
                    // Create welcome message
                    const welcomeMessage = {
                      chatId: data.chatId,
                      message: {
                        id: `ai-${Date.now()}`,
                        chatId: data.chatId,
                        text: `Hi ${user?.name || 'there'}, how can I help you?`,
                        sender: 'ai',
                        timestamp: new Date(),
                        type: 'simple_text'
                      }
                    };

                    // Save welcome message to database
                    const messageResponse = await fetch('/api/chat', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(welcomeMessage),
                    });

                    if (!messageResponse.ok) {
                      console.error('Failed to send welcome message');
                    }

                    onChatIdChange(data.chatId);
                  }
                } catch (error) {
                  console.error('Error creating chat:', error);
                }
              }}
              className="w-full mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
            <div className="space-y-2">
              {allChats
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-700 rounded cursor-pointer"
                    onClick={() => onChatIdChange(chat.id)}
                  >
                    <span className="text-white truncate">{chat.title}</span>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className={`text-gray-400 hover:text-red-500 ${deletingChatId === chat.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={deletingChatId === chat.id}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className={`flex flex-col h-full relative transition-all duration-300 ease-in-out ${showChatList ? 'ml-64' : 'ml-0'} ${showDAG ? 'w-1/3' : 'w-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <button
            onClick={() => setShowChatList(!showChatList)}
            className="text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
          {messages
            .filter(msg => ['user', 'ai', 'assistant', 'system'].includes(msg.sender))
            .map((msg) => {
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

            // Convert timestamp to Date if it's a string
            const timestamp = typeof msg.timestamp === 'string' 
              ? new Date(msg.timestamp).getTime() 
              : msg.timestamp.getTime();

            return (
              <div
                key={`${msg.id}-${timestamp}`}
                className={`flex ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                } mb-4`}
              >
                <div
                  className={`p-3 md:p-4 rounded-xl shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-700 text-gray-200 rounded-bl-none'
                  } ${msg.type === 'mermaid' || msg.type === 'workflow_plan' ? 'w-full max-w-full' : 'max-w-[33vw]'}`}
                >
                  {/* Message sender icon */}
                  <div className="flex items-center gap-2 mb-2">
                    {msg.sender === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                    <span className="text-xs opacity-70">
                      {msg.sender === 'user' ? 'You' : 'AI Assistant'}
                    </span>
                  </div>

                  {/* 1. Always show text content first */}
                  <p className="text-sm md:text-base whitespace-pre-wrap break-words mb-4">{msg.text}</p>

                  {/* 2. Show Mermaid diagram if type is mermaid */}
                  {msg.type === 'mermaid' && (msg as any).mermaid && (
                    <div className="w-full overflow-x-auto bg-gray-800 rounded-lg p-2 mb-4">
                      <MermaidDiagram diagramText={(msg as any).mermaid} />
                    </div>
                  )}

                  {/* 3. Show table if JSON exists */}
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

                  {/* 4. Show workflow if type is workflow_plan */}
                  {msg.type === 'workflow_plan' && msg.nodeList && msg.nodeList.length > 0 && (
                    <div className="w-full bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-4">Workflow Visualization:</div>
                      <WorkflowFlow nodeList={msg.nodeList} />
                    </div>
                  )}

                  <div className="text-xs opacity-70 mt-1">
                    {new Date(msg.timestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      hour12: true
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Section - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-gray-700 p-4 bg-gray-900" style={{ left: showChatList ? '16rem' : '0', right: showDAG ? '66.666667%' : '0' }}>
          <div className="flex items-center space-x-2 bg-gray-700 rounded-xl p-2 w-full">
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
    </div>
  );
} 