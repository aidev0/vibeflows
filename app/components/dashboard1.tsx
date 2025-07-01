// File: src/app/dashboard.tsx

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Network, Bot, Play, Settings, Search, Plus, Circle, Code, Maximize2, Minimize2, Maximize, Send, MessageCircle, FunctionSquare } from 'lucide-react';
import { apiClient } from '@/lib/api';
import Graph from './graph';
import Editor from '@monaco-editor/react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState<'flows' | 'agents'>('flows');
  const [flows, setFlows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [maximizedSection, setMaximizedSection] = useState<'none' | 'left' | 'graph' | 'chat'>('none');
  const [maximizedEditor, setMaximizedEditor] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{id: string, text: string, sender: 'user' | 'bot', timestamp: Date}>>([]);
  const [chatInput, setChatInput] = useState('');
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Default 320px (was w-80)
  const [chatPanelWidth, setChatPanelWidth] = useState(320); // Default 320px (was w-80)
  const [isDragging, setIsDragging] = useState<'left' | 'right' | null>(null);
  const graphRef = useRef<{ fitView: () => void }>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Helper function to format names: remove underscores and capitalize each word
  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = activeTab === 'flows' ? await apiClient.getFlows() : await apiClient.getAgents();
        activeTab === 'flows' ? setFlows(data) : setAgents(data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const items = activeTab === 'flows' ? flows : agents;
  const filtered = items.filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  const sendMessage = () => {
    if (chatInput.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: chatInput,
        sender: 'user' as const,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, newMessage]);
      setChatInput('');
      
      // Simulate bot response
      setTimeout(() => {
        const botMessage = {
          id: (Date.now() + 1).toString(),
          text: "I understand you're working with flows and agents. How can I help you?",
          sender: 'bot' as const,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      }, 1000);
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
      const newWidth = Math.max(200, Math.min(600, e.clientX)); // Min 200px, max 600px
      setLeftPanelWidth(newWidth);
    } else if (isDragging === 'right') {
      const newWidth = Math.max(200, Math.min(600, containerWidth - e.clientX)); // Min 200px, max 600px
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
      <header className="bg-gray-800 px-6 py-4 flex justify-start items-center border-b border-gray-700">
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
              {/* Icon */}
              {t === 'flows' ? (
                <Network size={18} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'
                }`} />
              ) : (
                <Bot size={18} className={`transition-transform duration-300 ${
                  activeTab === t ? 'text-white' : 'text-purple-400 group-hover:text-purple-300'
                }`} />
              )}
              
              {/* Text */}
              <span className="relative z-10">
                {formatName(t.charAt(0).toUpperCase() + t.slice(1))}
              </span>
              
              {/* Active indicator */}
              {activeTab === t && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${
                  t === 'flows' ? 'bg-emerald-300/40' : 'bg-purple-300/40'
                }`}></div>
              )}
              
              {/* Hover glow effect */}
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                t === 'flows' 
                  ? 'bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent'
                  : 'bg-gradient-to-r from-transparent via-purple-400/10 to-transparent'
              }`}></div>
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className={`${
          maximizedSection === 'graph' || maximizedSection === 'chat' ? 'hidden' : 
          maximizedSection === 'left' ? 'flex-1' : ''
        } border-r border-gray-700 flex flex-col relative`}
        style={maximizedSection === 'left' ? {} : { 
          width: `${leftPanelWidth}px`,
          minWidth: `${leftPanelWidth}px`,
          maxWidth: `${leftPanelWidth}px`
        }}>
          {/* Left Panel Maximize Button */}
          <button
            onClick={() => setMaximizedSection(maximizedSection === 'left' ? 'none' : 'left')}
            className="absolute top-4 right-4 z-20 p-1 text-gray-400 hover:text-white transition-colors"
            title={maximizedSection === 'left' ? 'Restore' : 'Maximize Panel'}
          >
            {maximizedSection === 'left' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 pt-12">
            {/* Content container with max-width when maximized */}
            <div className={`${maximizedSection === 'left' ? 'max-w-4xl mx-auto' : ''}`}>
              {!selectedItem ? (
                <>
                  <div className="mb-4 relative">
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-600 rounded pl-10 pr-4 py-2 text-sm"
                    />
                  </div>
                  {loading ? (
                    <p className="text-center text-gray-400">Loading...</p>
                  ) : (
                    <div className="space-y-3">
                      {filtered.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedNode(null);
                          }}
                          className="cursor-pointer border border-gray-700 p-3 rounded hover:border-blue-500"
                        >
                          <div className="flex items-center gap-2 font-semibold mb-1">
                            {activeTab === 'flows' ? <Network size={16} /> : <Bot size={16} />}
                            {formatName(item.name)}
                          </div>
                          <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : selectedNode ? (
                /* Node Detail View - Now in Left Panel */
                <div className="space-y-4">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="text-blue-400 text-sm mb-4"
                  >
                    ← Back to {formatName(selectedItem.name)}
                  </button>
                  
                  <div>
                    <h3 className="text-lg font-bold mb-1">{formatName(selectedNode.name)}</h3>
                    <p className="text-sm text-gray-400 mb-3">{selectedNode.description}</p>
                    
                    {/* Run Button - Dynamic based on node type */}
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium transition-colors mb-3 mt-6"
                      title={`Run ${selectedNode.type === 'flow' ? 'Flow' : selectedNode.type === 'agent' ? 'Agent' : 'Function'}`}
                    >
                      <Play size={16} />
                      Run {selectedNode.type === 'flow' ? 'Flow' : selectedNode.type === 'agent' ? 'Agent' : 'Function'}
                    </button>
                    
                    {/* Node Type and Language */}
                    <div className="flex gap-2 mb-3">
                    </div>
                  </div>
                  
                  {selectedNode.input_schema && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Input Schema</h4>
                      <div className="border border-gray-600 rounded overflow-hidden">
                        <Editor
                          height="200px"
                          defaultLanguage="json"
                          value={JSON.stringify(selectedNode.input_schema, null, 2)}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 11,
                            lineNumbers: 'on',
                            folding: true,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedNode.output_schema && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Output Schema</h4>
                      <div className="border border-gray-600 rounded overflow-hidden">
                        <Editor
                          height="200px"
                          defaultLanguage="json"
                          value={JSON.stringify(selectedNode.output_schema, null, 2)}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 11,
                            lineNumbers: 'on',
                            folding: true,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedNode.system && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">System</h4>
                      <div className="border border-gray-600 rounded overflow-hidden">
                        <Editor
                          height="200px"
                          defaultLanguage="markdown"
                          value={typeof selectedNode.system === 'string' ? selectedNode.system : JSON.stringify(selectedNode.system, null, 2)}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: false },
                            fontSize: 11,
                            lineNumbers: 'on',
                            folding: true,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {selectedNode.function_code && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">
                        Function
                      </h4>
                      <div className="border border-gray-600 rounded overflow-hidden">
                        <Editor
                          height={maximizedSection === 'left' ? '600px' : '400px'}
                          defaultLanguage={selectedNode.language || 'javascript'}
                          value={selectedNode.function_code}
                          theme="vs-dark"
                          options={{
                            readOnly: true,
                            minimap: { enabled: true },
                            fontSize: maximizedSection === 'left' ? 12 : 11,
                            lineNumbers: 'on',
                            folding: true,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Function Metadata */}
                  {(selectedNode.required_packages || selectedNode.execution_time || selectedNode.memory_usage) && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Function Metadata</h4>
                      <div className="space-y-1 text-xs text-gray-400">
                        {selectedNode.required_packages && selectedNode.required_packages.length > 0 && (
                          <div>
                            <span className="font-medium">Dependencies:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedNode.required_packages.map((pkg: string, index: number) => (
                                <span key={index} className="bg-orange-600/20 text-orange-300 px-2 py-0.5 rounded">
                                  {pkg}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedNode.execution_time && (
                          <div className="flex justify-between">
                            <span>Avg Execution Time:</span>
                            <span>{selectedNode.execution_time}ms</span>
                          </div>
                        )}
                        {selectedNode.memory_usage && (
                          <div className="flex justify-between">
                            <span>Memory Usage:</span>
                            <span>{selectedNode.memory_usage}MB</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Flow/Agent Overview with Nodes List */
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSelectedItem(null);
                      setSelectedNode(null);
                    }}
                    className="text-blue-400 text-sm mb-4"
                  >
                    ← Back
                  </button>
                  
                  {/* Basic Info */}
                  <div>
                    <h2 className="text-lg font-bold mb-2">{formatName(selectedItem.name)}</h2>
                    <p className="text-sm text-gray-400 mb-3">{selectedItem.description}</p>
                    
                    {/* Run Button - Separate Row */}
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-3 text-white font-medium rounded-lg transition-colors bg-green-600 hover:bg-green-700 mb-3 mt-6"
                      title={`Run ${activeTab === 'flows' ? 'Flow' : 'Agent'}`}
                    >
                      <Play size={16} />
                      Run {activeTab === 'flows' ? 'Flow' : 'Agent'}
                    </button>
                    
                    {/* Type and Status */}
                    <div className="flex gap-2 mb-3">
                      {selectedItem.status && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          selectedItem.status === 'active' 
                            ? 'bg-green-600/20 text-green-300' 
                            : 'bg-gray-600/20 text-gray-300'
                        }`}>
                          {selectedItem.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nodes/Functions List */}
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-white">
                        {activeTab === 'flows' ? 'Nodes' : 'Functions'}
                      </h3>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">
                        {(selectedItem.nodes || selectedItem.functions || []).length}
                      </span>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(selectedItem.nodes || selectedItem.functions || []).map((node: any, index: number) => (
                        <div
                          key={node.id || index}
                          onClick={() => setSelectedNode(node)}
                          className={`
                            cursor-pointer border-2 rounded-lg p-3 transition-all duration-200
                            ${selectedNode?.id === node.id 
                              ? 'border-yellow-400 bg-yellow-400/10' 
                              : 'border-gray-600 bg-gray-700/50 hover:border-blue-500 hover:bg-blue-500/10'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            {node.type === 'agent' && <Bot size={16} className="text-blue-400" />}
                            {node.type === 'flow' && <Network size={16} className="text-green-400" />}
                            
                            <span className="font-semibold text-white text-sm truncate">
                              {formatName(node.name || `${node.type || 'Function'} ${index + 1}`)}
                            </span>
                          </div>

                          {node.description && (
                            <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                              {node.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1 mt-2">
                            {node.language && (
                              <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">
                                {node.language}
                              </span>
                            )}
                            {node.function_code && (
                              <span className="text-xs bg-yellow-600/20 text-yellow-300 px-2 py-0.5 rounded">
                                Code
                              </span>
                            )}
                          </div>

                          {/* Quick Stats */}
                          {(node.execution_time || node.memory_usage || node.success_rate) && (
                            <div className="flex gap-3 mt-2 text-xs text-gray-400">
                              {node.execution_time && (
                                <span>⚡ {node.execution_time}ms</span>
                              )}
                              {node.memory_usage && (
                                <span>💾 {node.memory_usage}MB</span>
                              )}
                              {node.success_rate && (
                                <span className="text-green-400">✓ {node.success_rate}%</span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {(selectedItem.nodes || selectedItem.functions || []).length === 0 && (
                      <div className="text-center text-gray-500 py-8">
                        <Code size={32} className="mx-auto mb-2 opacity-50" />
                        <p>No {activeTab === 'flows' ? 'nodes' : 'functions'} found</p>
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-600">
                      <p className="text-xs text-gray-400 text-center">
                        Click on any {activeTab === 'flows' ? 'node' : 'function'} card above to view detailed code and schemas
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  {(selectedItem.created_at || selectedItem.updated_at || selectedItem.version) && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Metadata</h4>
                      <div className="space-y-1 text-xs text-gray-400">
                        {selectedItem.version && (
                          <div className="flex justify-between">
                            <span>Version:</span>
                            <span>{selectedItem.version}</span>
                          </div>
                        )}
                        {selectedItem.created_at && (
                          <div className="flex justify-between">
                            <span>Created:</span>
                            <span>{new Date(selectedItem.created_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        {selectedItem.updated_at && (
                          <div className="flex justify-between">
                            <span>Updated:</span>
                            <span>{new Date(selectedItem.updated_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Dependencies */}
                  {selectedItem.dependencies && selectedItem.dependencies.length > 0 && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Dependencies</h4>
                      <div className="space-y-1">
                        {selectedItem.dependencies.map((dep: string, index: number) => (
                          <div key={index} className="text-xs bg-orange-600/20 text-orange-300 px-2 py-1 rounded">
                            {dep}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {selectedItem.tags && selectedItem.tags.length > 0 && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedItem.tags.map((tag: string, index: number) => (
                          <span key={index} className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Statistics */}
                  {(selectedItem.execution_count || selectedItem.success_rate || selectedItem.avg_duration) && (
                    <div className="border-t border-gray-700 pt-3">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2">Statistics</h4>
                      <div className="space-y-1 text-xs text-gray-400">
                        {selectedItem.execution_count && (
                          <div className="flex justify-between">
                            <span>Executions:</span>
                            <span>{selectedItem.execution_count}</span>
                          </div>
                        )}
                        {selectedItem.success_rate && (
                          <div className="flex justify-between">
                            <span>Success Rate:</span>
                            <span className="text-green-400">{selectedItem.success_rate}%</span>
                          </div>
                        )}
                        {selectedItem.avg_duration && (
                          <div className="flex justify-between">
                            <span>Avg Duration:</span>
                            <span>{selectedItem.avg_duration}ms</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Draggable Border */}
        {maximizedSection !== 'graph' && maximizedSection !== 'chat' && maximizedSection !== 'left' && (
          <div
            className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors relative group"
            onMouseDown={handleMouseDown('left')}
          >
            {/* Visual indicator */}
            <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-blue-500/20 transition-colors" />
          </div>
        )}

        {/* Graph View */}
        <div className={`${
          maximizedSection === 'left' || maximizedSection === 'chat' ? 'hidden' : 
          maximizedSection === 'graph' ? 'flex-1' : 'flex-1'
        } bg-gray-900 overflow-hidden relative`}>
          {/* Graph Control Buttons */}
          {selectedItem && (
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              {/* Fit Button */}
              <button
                onClick={() => graphRef.current?.fitView()}
                className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 text-white transition-colors"
                title="Fit Graph to Window"
              >
                <Maximize size={16} />
              </button>
              
              {/* Maximize Button */}
              <button
                onClick={() => setMaximizedSection(maximizedSection === 'graph' ? 'none' : 'graph')}
                className="flex items-center justify-center p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 text-white transition-colors"
                title={maximizedSection === 'graph' ? 'Restore' : 'Maximize Graph'}
              >
                {maximizedSection === 'graph' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          )}

          {!selectedItem ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a {activeTab.slice(0, -1)} to view details</p>
            </div>
          ) : (
            <div className="h-full w-full">
              <Graph
                data={{
                  nodes: selectedItem.nodes || selectedItem.functions || [],
                  edges: selectedItem.edges || [],
                  name: selectedItem.name,
                  description: selectedItem.description,
                }}
                onNodeClick={(node) => setSelectedNode(node)}
                className="h-full w-full"
                ref={graphRef}
              />
            </div>
          )}
        </div>

        {/* Right Draggable Border */}
        {maximizedSection !== 'left' && maximizedSection !== 'graph' && maximizedSection !== 'chat' && (
          <div
            className="w-1 bg-gray-700 hover:bg-blue-500 cursor-col-resize transition-colors relative group"
            onMouseDown={handleMouseDown('right')}
          >
            {/* Visual indicator */}
            <div className="absolute inset-y-0 -left-0.5 -right-0.5 group-hover:bg-blue-500/20 transition-colors" />
          </div>
        )}

        {/* Chat Section */}
        <div className={`${
          maximizedSection === 'left' || maximizedSection === 'graph' ? 'hidden' : 
          maximizedSection === 'chat' ? 'flex-1' : ''
        } border-l border-gray-700 bg-gray-900 flex flex-col relative`}
        style={maximizedSection === 'chat' ? {} : { 
          width: `${chatPanelWidth}px`,
          minWidth: `${chatPanelWidth}px`,
          maxWidth: `${chatPanelWidth}px`
        }}>
          {/* Maximize Button */}
          <button
            onClick={() => setMaximizedSection(maximizedSection === 'chat' ? 'none' : 'chat')}
            className="absolute top-4 right-4 z-20 p-1 text-gray-400 hover:text-white transition-colors"
            title={maximizedSection === 'chat' ? 'Restore' : 'Maximize Chat'}
          >
            {maximizedSection === 'chat' ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto pt-12">
            <div className={`${maximizedSection === 'chat' ? 'max-w-4xl mx-auto' : ''} h-full`}>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                    <MessageCircle size={24} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-center text-gray-400">
                    Ask me anything about your flows and agents
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-2">
                      {message.sender === 'user' ? (
                        <div className="flex justify-end">
                          <div className="max-w-[85%] bg-blue-600 text-white rounded-lg px-3 py-2">
                            <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center shrink-0 mt-1">
                            <Bot size={12} className="text-gray-400" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="bg-gray-800 rounded-lg px-3 py-2 text-gray-100">
                              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                            </div>
                            <p className="text-xs text-gray-500 px-1">
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className="border-t border-gray-700 bg-gray-800">
            <div className={`${maximizedSection === 'chat' ? 'max-w-4xl mx-auto' : ''} p-3`}>
              <div className="relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about your code..."
                  className="w-full bg-gray-700 border-0 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
              {selectedItem && (
                <p className="text-xs text-gray-500 mt-2 px-1">
                  Context: {activeTab === 'flows' ? 'Flow' : 'Agent'} "{formatName(selectedItem.name)}"
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
