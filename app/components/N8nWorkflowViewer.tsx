'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { X, Play, Settings, Download, Eye, EyeOff } from 'lucide-react';

interface N8nWorkflowViewerProps {
  workflow: any;
  onClose: () => void;
}

const N8nWorkflowViewer: React.FC<N8nWorkflowViewerProps> = ({ workflow, onClose }) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [credentials, setCredentials] = useState<any[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  // Extract n8n workflow data
  const workflowData = useMemo(() => {
    if (workflow?.workflow_json) return workflow.workflow_json;
    if (workflow?.n8n_response) return workflow.n8n_response;
    if (workflow?.n8n_workflows) return workflow.n8n_workflows;
    return null;
  }, [workflow]);

  const nodes = workflowData?.nodes || [];
  const connections = workflowData?.connections || {};

  // Fetch credentials when component mounts
  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/credentials');
      if (response.ok) {
        const data = await response.json();
        setCredentials(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  // Filter credentials relevant to n8n
  const n8nCredentials = useMemo(() => {
    return credentials.filter(cred => 
      cred.key_name?.toLowerCase().includes('n8n') ||
      cred.key_name?.toLowerCase().includes('gmail') ||
      cred.key_name?.toLowerCase().includes('google') ||
      cred.key_name?.toLowerCase().includes('openai') ||
      cred.key_name?.toLowerCase().includes('gemini') ||
      nodes.some((node: any) => 
        node.type?.toLowerCase().includes(cred.key_name?.toLowerCase().split('_')[0]) ||
        node.name?.toLowerCase().includes(cred.key_name?.toLowerCase().split('_')[0])
      )
    );
  }, [credentials, nodes]);

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskKey = (value: string | any) => {
    if (!value) return '••••••••';
    
    // Convert objects to string
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (stringValue.length <= 8) return '*'.repeat(stringValue.length);
    return stringValue.slice(0, 4) + '*'.repeat(stringValue.length - 8) + stringValue.slice(-4);
  };

  // Render n8n workflow nodes
  const renderWorkflow = () => {
    if (!nodes.length) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <svg width="64" height="64" viewBox="0 0 64 64" className="text-orange-500 mx-auto mb-4">
              <path d="M32 0L0 32l32 32 32-32L32 0z" fill="currentColor"/>
            </svg>
            <h3 className="text-white font-semibold mb-2">No Workflow Data</h3>
            <p className="text-gray-400">This workflow doesn't contain node data</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full h-full overflow-auto bg-gray-900">
        {/* n8n Workflow Canvas */}
        <div className="relative min-w-full min-h-full p-8">
          {/* Render Nodes */}
          {nodes.map((node: any, index: number) => {
            const position = node.position || [200 + index * 300, 200];
            const [x, y] = position;
            
            return (
              <div
                key={node.id || index}
                className="absolute bg-white rounded-lg shadow-lg border-2 border-gray-300 min-w-[180px] max-w-[240px]"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {/* Node Header */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 truncate">
                      {node.type?.replace('n8n-nodes-base.', '') || 'Node'}
                    </span>
                  </div>
                </div>
                
                {/* Node Body */}
                <div className="p-3">
                  <h4 className="font-semibold text-sm text-gray-800 mb-1 leading-tight">
                    {node.name || 'Unnamed Node'}
                  </h4>
                  
                  {/* Node Details */}
                  {node.parameters && Object.keys(node.parameters).length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs text-gray-600">
                        {Object.entries(node.parameters).slice(0, 2).map(([key, value]: [string, any]) => (
                          <div key={key} className="truncate">
                            <span className="font-medium">{key}:</span> {
                              typeof value === 'string' ? value.slice(0, 20) : String(value).slice(0, 20)
                            }{String(value).length > 20 ? '...' : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Connection Points */}
                <div className="absolute -right-2 top-1/2 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1/2" />
                <div className="absolute -left-2 top-1/2 w-4 h-4 bg-green-500 rounded-full transform -translate-y-1/2" />
              </div>
            );
          })}
          
          {/* Render Connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
            </defs>
            
            {Object.entries(connections).map(([sourceNodeName, nodeConnections]: [string, any]) => {
              const sourceNode = nodes.find((n: any) => n.name === sourceNodeName);
              if (!sourceNode || !nodeConnections.main) return null;
              
              return nodeConnections.main.map((connectionGroup: any[], groupIndex: number) => 
                connectionGroup.map((connection: any, connIndex: number) => {
                  const targetNode = nodes.find((n: any) => n.name === connection.node);
                  if (!targetNode) return null;
                  
                  const sourcePos = sourceNode.position || [200, 200];
                  const targetPos = targetNode.position || [500, 200];
                  
                  const startX = sourcePos[0] + 90;
                  const startY = sourcePos[1];
                  const endX = targetPos[0] - 90;
                  const endY = targetPos[1];
                  
                  const midX = (startX + endX) / 2;
                  
                  return (
                    <path
                      key={`${sourceNodeName}-${connection.node}-${groupIndex}-${connIndex}`}
                      d={`M ${startX} ${startY} Q ${midX} ${startY} ${midX} ${(startY + endY) / 2} Q ${midX} ${endY} ${endX} ${endY}`}
                      stroke="#64748b"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#arrowhead)"
                    />
                  );
                })
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-gray-900 relative">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="24" height="24" viewBox="0 0 24 24" className="text-orange-500">
            <path d="M12 0L0 12l12 12 12-12L12 0z" fill="currentColor"/>
          </svg>
          <h2 className="text-lg font-semibold text-white">n8n Workflow</h2>
          <span className="text-sm text-gray-400">
            {workflowData?.name || workflow?.name || 'Unnamed Workflow'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Workflow Controls */}
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Execute Workflow">
            <Play size={16} className="text-green-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Workflow Settings">
            <Settings size={16} className="text-gray-400" />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Export Workflow">
            <Download size={16} className="text-blue-400" />
          </button>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors ml-2"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Workflow Canvas */}
      <div ref={canvasRef} className="flex-1 relative overflow-y-auto">
        {renderWorkflow()}
        
        {/* Credentials Section at Bottom */}
        {(n8nCredentials.length > 0 || credentials.length > 0) && (
          <div className="mt-8 p-6 bg-gray-800/50 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-4">Workflow Credentials</h3>
            
            {/* Workflow-Relevant Credentials */}
            {n8nCredentials.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Related Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {n8nCredentials.map((cred) => (
                    <div key={cred._id} className="bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-semibold text-white">{cred.key_name}</h5>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          cred.key_type === 'api_key' ? 'bg-blue-500/20 text-blue-300' :
                          cred.key_type === 'oauth_token' ? 'bg-green-500/20 text-green-300' :
                          cred.key_type === 'url' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {cred.key_type}
                        </span>
                      </div>
                      
                      <div className="flex items-start gap-2 mb-2 min-w-0">
                        <code className="bg-gray-800 px-2 py-1 rounded text-xs font-mono text-gray-300 flex-1 min-w-0 overflow-hidden break-all whitespace-pre-wrap max-h-20 overflow-y-auto">
                          {(() => {
                            const value = cred.key_value || cred.value;
                            if (!value) return 'No value';
                            
                            if (visibleKeys.has(cred._id || '')) {
                              return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                            } else {
                              return maskKey(value);
                            }
                          })()}
                        </code>
                        <button
                          onClick={() => toggleKeyVisibility(cred._id || '')}
                          className="p-1 hover:bg-gray-600 rounded transition-colors flex-shrink-0"
                        >
                          {visibleKeys.has(cred._id || '') ? 
                            <EyeOff size={12} className="text-gray-400" /> : 
                            <Eye size={12} className="text-gray-400" />
                          }
                        </button>
                      </div>
                      
                      {cred.description && (
                        <p className="text-xs text-gray-400">{cred.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All User Credentials */}
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">All Available Credentials ({credentials.length})</h4>
              {credentials.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-400 text-sm">No credentials found</p>
                  <p className="text-gray-500 text-xs mt-1">Add API keys in Keys manager</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {credentials.map((cred) => (
                    <div key={cred._id} className="bg-gray-750 rounded-lg p-3 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="text-sm font-medium text-white truncate">{cred.key_name}</h6>
                        <div className="flex items-center gap-1">
                          <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                            cred.key_type === 'api_key' ? 'bg-blue-500/20 text-blue-300' :
                            cred.key_type === 'oauth_token' ? 'bg-green-500/20 text-green-300' :
                            cred.key_type === 'url' ? 'bg-purple-500/20 text-purple-300' :
                            cred.key_type === 'connection_string' ? 'bg-yellow-500/20 text-yellow-300' :
                            cred.key_type === 'service_account_json' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {cred.key_type}
                          </span>
                          <button
                            onClick={() => toggleKeyVisibility(cred._id || '')}
                            className="p-0.5 hover:bg-gray-600 rounded transition-colors"
                          >
                            {visibleKeys.has(cred._id || '') ? 
                              <EyeOff size={10} className="text-gray-400" /> : 
                              <Eye size={10} className="text-gray-400" />
                            }
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-1">
                        <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono text-gray-300 block w-full overflow-hidden break-all whitespace-pre-wrap max-h-16 overflow-y-auto">
                          {(() => {
                            const value = cred.key_value || cred.value;
                            if (!value) return 'No value';
                            
                            if (visibleKeys.has(cred._id || '')) {
                              return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
                            } else {
                              return maskKey(value);
                            }
                          })()}
                        </code>
                      </div>
                      
                      {cred.description && (
                        <p className="text-xs text-gray-500 truncate">{cred.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <span>Nodes: {nodes.length}</span>
          <span>Connections: {Object.keys(connections).length}</span>
          <span className="text-green-400">● Active</span>
        </div>
        <div>
          n8n Workflow Viewer
        </div>
      </div>
    </div>
  );
};

export default N8nWorkflowViewer;