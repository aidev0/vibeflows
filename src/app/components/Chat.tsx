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
import ReactMarkdown from 'react-markdown';

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

// Add useMediaQuery hook
function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Message Components
function MessageSender({ sender }: { sender: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {sender === 'user' ? (
        <User className="w-4 h-4" />
      ) : (
        <Bot className="w-4 h-4" />
      )}
      <span className="text-xs opacity-70">
        {sender === 'user' ? 'You' : 'AI Assistant'}
      </span>
    </div>
  );
}

function MessageTimestamp({ timestamp }: { timestamp: Date | string }) {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return (
    <div className="text-xs opacity-70 mt-1">
      {date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      })}
    </div>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mb-4 text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mb-3 text-white" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mb-2 text-white" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4 text-gray-200" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-4 text-gray-200" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-4 text-gray-200" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1 text-gray-200" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-gray-300" {...props} />,
          code: ({ node, ...props }) => <code className="bg-gray-800 px-1 py-0.5 rounded text-gray-200" {...props} />,
          pre: ({ node, ...props }) => <pre className="bg-gray-800 p-4 rounded-lg mb-4 overflow-x-auto" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-300 mb-4" {...props} />,
          a: ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline" {...props} />,
          hr: ({ node, ...props }) => <hr className="border-gray-700 my-4" {...props} />,
          table: ({ node, ...props }) => <table className="min-w-full divide-y divide-gray-700 mb-4" {...props} />,
          thead: ({ node, ...props }) => <thead className="bg-gray-800" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="bg-gray-900 divide-y divide-gray-700" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-gray-800" {...props} />,
          th: ({ node, ...props }) => <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-2 text-sm text-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function ChatMessage({ message, isMobile }: { message: Message; isMobile: boolean }) {
  const isJsonType = message.type?.toLowerCase().includes('json');
  const isFullWidth = isJsonType || message.type === 'mermaid' || message.type === 'workflow_plan' || isMobile;

  return (
    <div
      className={`flex ${
        message.sender === 'user' ? 'justify-end' : 'justify-start'
      } mb-4`}
    >
      <div
        className={`p-3 md:p-4 rounded-xl shadow-lg ${
          message.sender === 'user'
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-gray-700 text-gray-200 rounded-bl-none'
        } ${isFullWidth ? 'w-full max-w-full' : 'max-w-[33vw]'}`}
      >
        <MessageSender sender={message.sender} />
        
        {/* Render text content as markdown */}
        <div className="mb-4">
          <MarkdownMessage content={message.text} />
        </div>

        {message.type === 'mermaid' && (message as any).mermaid && (
          <div className="w-full overflow-x-auto bg-gray-800 rounded-lg p-2 mb-4">
            <MermaidDiagram diagramText={(message as any).mermaid} />
          </div>
        )}

        {isJsonType && message.json && (
          <JsonTable data={message.json} />
        )}

        {message.type === 'workflow_plan' && message.nodeList && message.nodeList.length > 0 && (
          <div className="w-full bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-4">Workflow Visualization:</div>
            <WorkflowFlow nodeList={message.nodeList} />
          </div>
        )}

        <MessageTimestamp timestamp={message.timestamp} />
      </div>
    </div>
  );
}

function ChatInput({ 
  inputText, 
  setInputText, 
  handleSendMessage, 
  handleKeyPress,
  showChatList,
  showDAG,
  isMobile,
  isProcessing
}: { 
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (text: string) => void;
  handleKeyPress: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  showChatList: boolean;
  showDAG: boolean;
  isMobile: boolean;
  isProcessing: boolean;
}) {
  return (
    <div className={`fixed bottom-0 border-t border-gray-700 p-4 bg-gray-900 transition-all duration-300 ease-in-out ${
      showChatList ? 'left-64' : 'left-0'
    } ${showDAG ? 'right-[66.666667%]' : 'right-0'} ${isMobile ? 'left-0 right-0' : ''}`}>
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
          disabled={!inputText.trim() || isProcessing}
          className="p-2 rounded-lg text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function ChatHistory({ 
  allChats, 
  onChatIdChange, 
  handleDeleteChat, 
  deletingChatId,
  showChatList,
  isMobile 
}: { 
  allChats: { id: string; title: string; created_at: string; messageCount: number }[];
  onChatIdChange: (id: string) => void;
  handleDeleteChat: (id: string) => void;
  deletingChatId: string | null;
  showChatList: boolean;
  isMobile: boolean;
}) {
  return (
    <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${showChatList ? 'translate-x-0' : '-translate-x-full'} ${isMobile ? 'z-50' : ''}`}>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [showDAG, setShowDAG] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Load messages only on initial mount or chat change
  useEffect(() => {
    if (!isLoading && user && chatId) {
      const loadMessages = async () => {
        try {
          const messagesResponse = await fetch(`/api/chat?chatId=${chatId}&userId=${user.sub}`);
          if (messagesResponse.ok) {
            const messagesData = await messagesResponse.json();
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
      id: `user-${Date.now()}`,
      chatId: chatId as string,
      text,
      sender: 'user',
      timestamp: new Date(),
      type: 'simple_text'
    };

    // Optimistically add user message
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsProcessing(true);

    try {
      // First save user message to database
      const saveResponse = await fetch('/api/chat', {
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

      if (!saveResponse.ok) {
        throw new Error('Failed to save message');
      }

      // Then send to AI
      const vibeResponse = await fetch('/api/chat/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          chatId,
          userId: user.sub,
          chatType
        }),
      });

      const vibeData = await vibeResponse.json();

      if (!vibeResponse.ok) {
        throw new Error(vibeData.error || 'Failed to process message with VibeFlows API');
      }

      // Save AI response to database and update UI optimistically
      if (vibeData.message) {
        const aiMessage: Message = {
          id: `ai-${Date.now()}`,
          chatId: chatId as string,
          text: vibeData.message.text,
          sender: 'ai',
          timestamp: new Date(),
          type: vibeData.message.type || 'simple_text',
          json: vibeData.message.json,
          nodeList: vibeData.message.nodeList
        };

        // Optimistically add AI message
        setMessages(prev => [...prev, aiMessage]);

        const aiSaveResponse = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chatId,
            message: aiMessage,
            chatType
          }),
        });

        if (!aiSaveResponse.ok) {
          console.error('Failed to save AI response');
          // Remove the optimistic AI message if save failed
          setMessages(prev => prev.filter(msg => msg.id !== aiMessage.id));
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user with specific message
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        chatId: chatId as string,
        text: error instanceof Error ? error.message : 'Sorry, there was an error processing your message. Please try again.',
        sender: 'system',
        timestamp: new Date(),
        type: 'error'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteChat = async (chatIdToDelete: string) => {
    if (!user?.sub) return;
    
    try {
      setDeletingChatId(chatIdToDelete);
      // Optimistically clear messages if deleting current chat
      if (chatIdToDelete === chatId) {
        setMessages([]);
      }
      await onDeleteChat(chatIdToDelete);
    } catch (error) {
      console.error('Error deleting chat:', error);
      // Reload messages only if delete failed
      if (chatIdToDelete === chatId) {
        const messagesResponse = await fetch(`/api/chat?chatId=${chatId}&userId=${user.sub}`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData.messages || []);
        }
      }
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
      <ChatHistory
        allChats={allChats}
        onChatIdChange={onChatIdChange}
        handleDeleteChat={handleDeleteChat}
        deletingChatId={deletingChatId}
        showChatList={showChatList}
        isMobile={isMobile}
      />

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
            .map((msg) => (
              <ChatMessage key={msg.id} message={msg} isMobile={isMobile} />
            ))}
          {isProcessing && (
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
              <span>Processing your message...</span>
            </div>
          )}
        </div>

        <ChatInput
          inputText={inputText}
          setInputText={setInputText}
          handleSendMessage={handleSendMessage}
          handleKeyPress={handleKeyPress}
          showChatList={showChatList}
          showDAG={showDAG}
          isMobile={isMobile}
          isProcessing={isProcessing}
        />

        {showDAG && currentWorkflow && (
          <div className={`fixed top-0 right-0 ${isMobile ? 'w-full' : 'w-2/3'} h-full z-50`}>
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