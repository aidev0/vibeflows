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
  MarkerType,
  Handle,
  Position,
} from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

interface N8nWorkflowViewerProps {
  workflow: any;
  onClose: () => void;
}

interface N8nWorkflowViewerRef {
  fitView: () => void;
}

// Custom Desktop Node Component (with left/right handles)
const DesktopN8nNode = ({ data }: any) => {
  const { node } = data;
  
  return (
    <div className="relative">
      {/* Input handle - left side */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: '#64748b',
          width: '8px',
          height: '8px',
          border: '2px solid white',
        }}
      />
      
      {/* Node content */}
      <div className="p-6 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-400/50 text-orange-100 rounded-2xl border-2 shadow-xl hover:shadow-2xl backdrop-blur-sm transition-all duration-300 min-w-[240px] max-w-[280px]">
        <div className="mb-3">
          <span className="text-sm font-semibold text-orange-100 block mb-2">
            {node.type?.replace('n8n-nodes-base.', '') || 'Node'}
          </span>
          <h4 className="font-bold text-lg text-white break-words leading-tight">
            {node.name || 'Unnamed Node'}
          </h4>
        </div>
      </div>
      
      {/* Output handle - right side */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: '#64748b',
          width: '8px',
          height: '8px',
          border: '2px solid white',
        }}
      />
    </div>
  );
};

const nodeTypes = {
  desktopN8n: DesktopN8nNode,
};

// Internal component that has access to ReactFlow instance
const N8nWorkflowContent = forwardRef<N8nWorkflowViewerRef, N8nWorkflowViewerProps>(({ workflow, onClose }, ref) => {
  const { fitView } = useReactFlow();
  const [isMobile, setIsMobile] = useState(false);
  
  // Device detection
  useEffect(() => {
    const detectDevice = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    detectDevice();
    window.addEventListener('resize', detectDevice);
    return () => window.removeEventListener('resize', detectDevice);
  }, []);
  
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
    if (isMobile) {
      // Mobile: Use default nodes with top/bottom handles and proper layout
      if (n8nNodes.length === 0) return [];
      
      // Create dagre graph for mobile layout (top-bottom)
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: 'TB', // Top-Bottom for mobile
        nodesep: 80,
        ranksep: 150,
        marginx: 40,
        marginy: 40,
      });

      // Add nodes to dagre
      n8nNodes.forEach((node: any, index: number) => {
        const nodeId = node.name || `node-${index}`;
        dagreGraph.setNode(nodeId, { 
          width: 260, 
          height: 120 
        });
      });

      // Add edges to dagre based on n8n connections
      Object.entries(n8nConnections).forEach(([sourceNodeName, nodeConnections]: [string, any]) => {
        if (!nodeConnections.main) return;
        
        nodeConnections.main.forEach((connectionGroup: any[]) => {
          connectionGroup.forEach((connection: any) => {
            if (dagreGraph.hasNode(sourceNodeName) && dagreGraph.hasNode(connection.node)) {
              dagreGraph.setEdge(sourceNodeName, connection.node);
            }
          });
        });
      });

      // Calculate layout
      dagre.layout(dagreGraph);

      return n8nNodes.map((node: any, index: number) => {
        const nodeId = node.name || `node-${index}`;
        const dagreNode = dagreGraph.node(nodeId);
        
        return {
          id: nodeId,
          type: 'default',
          position: dagreNode ? {
            x: dagreNode.x - dagreNode.width / 2,
            y: dagreNode.y - dagreNode.height / 2,
          } : { x: 200, y: 200 + index * 150 },
          data: {
            label: (
              <div className="p-6 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-orange-400/50 text-orange-100 rounded-2xl border-2 shadow-xl hover:shadow-2xl backdrop-blur-sm transition-all duration-300 min-w-[240px] max-w-[280px]">
                <div className="mb-2">
                  <span className="text-sm font-semibold text-orange-100 block mb-2">
                    {node.type?.replace('n8n-nodes-base.', '') || 'Node'}
                  </span>
                  <h4 className="font-bold text-base text-white break-words leading-tight">
                    {node.name || 'Unnamed Node'}
                  </h4>
                </div>
              </div>
            )
          },
          style: {
            background: 'transparent',
            border: 'none',
            padding: 0
          }
        };
      });
    } else {
      // Desktop: Use Dagre layout with custom nodes (left-to-right)
      if (n8nNodes.length === 0) return [];
      
      // Create dagre graph for layout calculation
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      dagreGraph.setGraph({
        rankdir: 'LR', // Left-Right for desktop
        nodesep: 120,
        ranksep: 200,
        marginx: 40,
        marginy: 40,
      });

      // Add nodes to dagre
      n8nNodes.forEach((node: any, index: number) => {
        const nodeId = node.name || `node-${index}`;
        dagreGraph.setNode(nodeId, { 
          width: 260, 
          height: 140 
        });
      });

      // Add edges to dagre based on n8n connections
      Object.entries(n8nConnections).forEach(([sourceNodeName, nodeConnections]: [string, any]) => {
        if (!nodeConnections.main) return;
        
        nodeConnections.main.forEach((connectionGroup: any[]) => {
          connectionGroup.forEach((connection: any) => {
            if (dagreGraph.hasNode(sourceNodeName) && dagreGraph.hasNode(connection.node)) {
              dagreGraph.setEdge(sourceNodeName, connection.node);
            }
          });
        });
      });

      // Calculate layout
      dagre.layout(dagreGraph);

      // Create React Flow nodes with calculated positions
      return n8nNodes.map((node: any, index: number) => {
        const nodeId = node.name || `node-${index}`;
        const dagreNode = dagreGraph.node(nodeId);
        
        return {
          id: nodeId,
          type: 'desktopN8n',
          position: dagreNode ? {
            x: dagreNode.x - dagreNode.width / 2,
            y: dagreNode.y - dagreNode.height / 2,
          } : { x: 200 + index * 300, y: 200 },
          data: {
            node
          }
        };
      });
    }
  }, [n8nNodes, n8nConnections, isMobile]);

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
              strokeWidth: 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
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
          <Zap size={64} className="text-orange-500 mx-auto mb-4" />
          <h3 className="text-white font-semibold mb-2">No Workflow Data</h3>
          <p className="text-gray-400">This workflow doesn't contain node data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 relative">
      <style jsx global>{`
        .react-flow__controls {
          background: #1F2937 !important;
          border: 2px solid #374151 !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
          padding: 4px !important;
        }
        .react-flow__controls .react-flow__controls-button {
          background: #374151 !important;
          border: 1px solid #4B5563 !important;
          color: #E5E7EB !important;
          width: 28px !important;
          height: 28px !important;
          margin: 2px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }
        .react-flow__controls .react-flow__controls-button:hover {
          background: #4B5563 !important;
          border-color: #6B7280 !important;
          color: #F9FAFB !important;
          transform: scale(1.05) !important;
        }
        .react-flow__controls .react-flow__controls-button svg {
          fill: #E5E7EB !important;
          width: 14px !important;
          height: 14px !important;
        }
        .react-flow__controls .react-flow__controls-button:hover svg {
          fill: #F9FAFB !important;
        }
        
        /* More specific selectors to override defaults */
        .react-flow__controls button {
          background: #374151 !important;
          border: 1px solid #4B5563 !important;
          color: #E5E7EB !important;
        }
        .react-flow__controls button:hover {
          background: #4B5563 !important;
          border-color: #6B7280 !important;
        }
        .react-flow__controls button svg {
          fill: #E5E7EB !important;
        }
        .react-flow__controls button:hover svg {
          fill: #F9FAFB !important;
        }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={!isMobile ? nodeTypes : undefined}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        style={{ background: '#111827' }}
        className="bg-gray-900"
      >
        <Controls 
          showZoom={true}
          showFitView={true}
          showInteractive={true}
          className="!bg-gray-800 !border-gray-600"
          style={{
            background: '#374151',
            border: '2px solid #4B5563',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            padding: '4px'
          }}
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