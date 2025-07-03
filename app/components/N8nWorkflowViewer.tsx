'use client';

import React, { useRef, useMemo, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { X, Play, Settings, Download, Eye, EyeOff, RefreshCw, Zap, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface N8nWorkflowViewerProps {
  workflow: any;
  onClose: () => void;
}

interface N8nWorkflowViewerRef {
  fitView: () => void;
}

// Internal component that has access to ReactFlow instance
const N8nWorkflowContent = forwardRef<N8nWorkflowViewerRef, N8nWorkflowViewerProps>(({ workflow, onClose }, ref) => {
  const { fitView } = useReactFlow();
  
  // Expose fitView to parent component
  useImperativeHandle(ref, () => ({
    fitView
  }));

  // Extract n8n workflow data
  const workflowData = useMemo(() => {
    if (workflow?.workflow_json) return workflow.workflow_json;
    if (workflow?.n8n_response) return workflow.n8n_response;
    if (workflow?.n8n_workflows) return workflow.n8n_workflows;
    return null;
  }, [workflow]);

  const n8nNodes = workflowData?.nodes || [];
  const n8nConnections = workflowData?.connections || {};

  // Convert n8n nodes to React Flow nodes
  const reactFlowNodes: Node[] = useMemo(() => {
    return n8nNodes.map((node: any, index: number) => {
      const position = node.position || [200 + index * 300, 200];
      
      return {
        id: node.name || `node-${index}`,
        type: 'default',
        position: { x: position[0], y: position[1] },
        data: {
          label: (
            <div className="p-2 bg-white rounded-lg shadow-lg border-2 border-gray-300 min-w-[180px]">
              {/* Node Header */}
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
                <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded" />
                </div>
                <span className="text-xs font-semibold text-gray-700 truncate">
                  {node.type?.replace('n8n-nodes-base.', '') || 'Node'}
                </span>
              </div>
              
              {/* Node Body */}
              <div>
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
            </div>
          )
        },
        style: {
          background: 'transparent',
          border: 'none',
        }
      };
    });
  }, [n8nNodes]);

  // Convert n8n connections to React Flow edges
  const reactFlowEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    Object.entries(n8nConnections).forEach(([sourceNodeName, nodeConnections]: [string, any]) => {
      if (!nodeConnections.main) return;
      
      nodeConnections.main.forEach((connectionGroup: any[], groupIndex: number) => {
        connectionGroup.forEach((connection: any, connIndex: number) => {
          edges.push({
            id: `${sourceNodeName}-${connection.node}-${groupIndex}-${connIndex}`,
            source: sourceNodeName,
            target: connection.node,
            type: 'smoothstep',
            style: {
              stroke: '#64748b',
              strokeWidth: 2,
            },
            markerEnd: {
              type: 'arrowclosed',
              color: '#64748b',
            },
          });
        });
      });
    });
    
    return edges;
  }, [n8nConnections]);

  const [nodes, setNodes, onNodesChange] = useNodesState(reactFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(reactFlowEdges);

  // Update nodes and edges when workflow data changes
  useEffect(() => {
    setNodes(reactFlowNodes);
    setEdges(reactFlowEdges);
  }, [reactFlowNodes, reactFlowEdges, setNodes, setEdges]);

  // Handle empty workflow
  if (!n8nNodes.length) {
    return (
      <div className="h-full w-full bg-gray-900 flex items-center justify-center">
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
    <div className="h-full w-full bg-gray-900 relative">
      <style jsx>{`
        .react-flow__controls {
          background: #374151 !important;
          border: 1px solid #6B7280 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3) !important;
        }
        .react-flow__controls-button {
          background: #4B5563 !important;
          border: 1px solid #6B7280 !important;
          color: #F9FAFB !important;
          width: 24px !important;
          height: 24px !important;
        }
        .react-flow__controls-button:hover {
          background: #6B7280 !important;
          border-color: #9CA3AF !important;
        }
        .react-flow__controls-button svg {
          fill: #F9FAFB !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        style={{ background: '#111827' }}
        className="bg-gray-900"
      >
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <Background color="#4B5563" gap={20} />
      </ReactFlow>
    </div>
  );
});

// Main component wrapper
const N8nWorkflowViewer = forwardRef<N8nWorkflowViewerRef, N8nWorkflowViewerProps>(({ workflow, onClose }, ref) => {
  return (
    <ReactFlowProvider>
      <N8nWorkflowContent workflow={workflow} onClose={onClose} ref={ref} />
    </ReactFlowProvider>
  );
});

N8nWorkflowViewer.displayName = 'N8nWorkflowViewer';
N8nWorkflowContent.displayName = 'N8nWorkflowContent';

export default N8nWorkflowViewer;