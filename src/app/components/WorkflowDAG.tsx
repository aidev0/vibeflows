// /components/WorkflowDAG.tsx
'use client';

import React, { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel, // Panel is used for the maximize button in some layouts, but we'll use a fixed header
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,      // << CRITICAL: Ensure Handle is imported
  Node as RFNode,
  Edge as RFEdge,
} from 'reactflow';
import 'reactflow/dist/style.css'; // Base React Flow styles
import dagre from 'dagre'; // For automatic layout
import { Node as ChatNodeType } from '@/models/Chat'; // Your input step type
import { Maximize2, Minimize2, LogOut, UserCircle2 } from 'lucide-react'; // Added more icons
import { useUser } from '@auth0/nextjs-auth0/client'; // For user info in header

interface WorkflowDAGProps {
  steps: ChatNodeType[];
  onClose?: () => void; // Optional: If you want a close button for maximized view
}

const NODE_WIDTH = 280; // Increased for better readability
const NODE_HEIGHT = 120; // Increased for better readability

// 1. Define the stylish custom node with Handles
const nodeTypes = {
  stylishDagreNode: ({ data, id, sourcePosition, targetPosition }: {
    data: { label: string; description?: string, icon?: React.ElementType };
    id: string;
    sourcePosition?: Position;
    targetPosition?: Position;
  }) => {
    const IconComponent = data.icon;
    return (
      <div style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: 'linear-gradient(145deg, #2c3e50 0%, #34495e 100%)',
        borderRadius: '16px',
        padding: '16px 20px',
        color: '#ecf0f1',
        textAlign: 'left',
        boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
        border: '1px solid #4a627a',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
      }}>
        <Handle
          type="target"
          position={targetPosition || Position.Left}
          id={`target-${id}`}
          style={{ background: '#7f8c8d', width: 12, height: 12, borderRadius: 4, border: '1px solid #bdc3c7' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          {IconComponent && <IconComponent style={{ marginRight: '12px', width: '24px', height: '24px', color: '#3498db' }} />}
          <div style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#ffffff', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            letterSpacing: '0.5px'
          }}>
            {data.label}
          </div>
        </div>
        {data.description && (
          <div style={{ 
            fontSize: '14px', 
            color: '#bdc3c7', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
            letterSpacing: '0.3px'
          }}>
            {data.description}
          </div>
        )}
        <Handle
          type="source"
          position={sourcePosition || Position.Right}
          id={`source-${id}`}
          style={{ background: '#7f8c8d', width: 12, height: 12, borderRadius: 4, border: '1px solid #bdc3c7' }}
        />
      </div>
    );
  }
};

// 2. Dagre layout function
const getLayoutedElements = (nodes: RFNode[], edges: RFEdge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UL',
    nodesep: 150,
    ranksep: 150,
    marginx: 50,
    marginy: 50,
    acyclicer: 'greedy',
    ranker: 'network-simplex'
  });

  // Calculate grid layout
  const nodesPerRow = 3;
  const horizontalSpacing = 150;
  const verticalSpacing = 150;

  nodes.forEach((node, index) => {
    const row = Math.floor(index / nodesPerRow);
    const col = index % nodesPerRow;
    
    node.position = {
      x: col * (NODE_WIDTH + horizontalSpacing),
      y: row * (NODE_HEIGHT + verticalSpacing)
    };
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Apply layout
  dagre.layout(dagreGraph);

  // Update node positions
  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: node.position.x,
      y: node.position.y
    };
    node.sourcePosition = Position.Right;
    node.targetPosition = Position.Left;
    node.type = 'stylishDagreNode';
  });

  return { 
    nodes,
    edges: edges.map(edge => ({
      ...edge,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#7f8c8d', strokeWidth: 2.5 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#7f8c8d', width: 20, height: 20 },
    }))
  };
};

const WorkflowDAG: React.FC<WorkflowDAGProps> = ({ steps, onClose }) => {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode[]>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);
  const [maximized, setMaximized] = useState(false);
  const { user, isLoading: isUserLoading } = useUser();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Add window resize handler
  useEffect(() => {
    const updateDimensions = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDimensions({
        width: maximized ? width : Math.min(width * 0.8, 1200),
        height: maximized ? height : Math.min(height * 0.8, 800)
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [maximized]);

  useEffect(() => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[WorkflowDAG-Stylish ${timestamp}] useEffect. Input steps (Count: ${steps?.length})`);
    if (steps) {
        console.log(`[WorkflowDAG-Stylish ${timestamp}] Raw input steps:`, JSON.parse(JSON.stringify(steps)));
    }

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      console.log(`[WorkflowDAG-Stylish ${timestamp}] No steps or invalid steps array. Clearing nodes/edges.`);
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    const newFlowNodes: RFNode[] = [];
    const newFlowEdges: RFEdge[] = [];
    const allocatedIds = new Set<string>();
    const indexToActualIdMap = new Map<number, string>();

    steps.forEach((step, index) => {
      if (!step) {
        console.warn(`[WorkflowDAG-Stylish ${timestamp}] Step at index ${index} is undefined or null. Skipping.`);
        return;
      }

      let originalId = step?.id;
      let label = step?.data?.label;
      const description = step?.data?.description;
      const icon = step?.data?.icon;
      let hasValidOriginalId = true;

      if (!originalId || typeof originalId !== 'string' || !originalId.trim()) {
        originalId = `generated-node-${index}-${Date.now()}`;
        hasValidOriginalId = false;
        if (!label) label = `Unnamed Step ${index + 1}`;
        console.warn(`[WorkflowDAG-Stylish ${timestamp}] Step @ index ${index} invalid/missing ID ('${step?.id}'). Generated: '${originalId}'. Label: '${label}'`);
      } else if (!label || typeof label !== 'string' || !label.trim()) {
        label = `Node (ID: ${originalId})`;
        console.warn(`[WorkflowDAG-Stylish ${timestamp}] Missing label for step ID '${originalId}'. Using default.`);
      }

      let finalNodeId = originalId;
      let suffix = 1;
      while (allocatedIds.has(finalNodeId)) {
        finalNodeId = `${originalId}_u${suffix++}`;
      }
      allocatedIds.add(finalNodeId);
      indexToActualIdMap.set(index, finalNodeId);

      if (finalNodeId !== originalId && hasValidOriginalId) {
          console.warn(`[WorkflowDAG-Stylish ${timestamp}] Original ID '${originalId}' (Label: '${label}') was uniquified to '${finalNodeId}'.`);
      }

      newFlowNodes.push({
        id: finalNodeId,
        type: 'stylishDagreNode',
        data: { label, description, icon },
        position: { x: 0, y: 0 },
      });
    });

    if (newFlowNodes.length > 1) {
      for (let i = 0; i < steps.length - 1; i++) {
        const sourceActualId = indexToActualIdMap.get(i);
        const targetActualId = indexToActualIdMap.get(i + 1);

        if (sourceActualId && targetActualId) {
          newFlowEdges.push({
            id: `e-${sourceActualId}-${targetActualId}`,
            source: sourceActualId,
            target: targetActualId,
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#7f8c8d', strokeWidth: 2.5 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#7f8c8d', width: 20, height: 20 },
          });
        } else {
            console.warn(`[WorkflowDAG-Stylish ${timestamp}] Could not create edge between original step index ${i} and ${i+1} due to missing mapped IDs.`);
        }
      }
    }
    
    console.log(`[WorkflowDAG-Stylish ${timestamp}] Nodes prepared for Dagre (Count: ${newFlowNodes.length}):`, JSON.parse(JSON.stringify(newFlowNodes.map(n=>({id:n.id, label:n.data.label})))));
    console.log(`[WorkflowDAG-Stylish ${timestamp}] Edges prepared for Dagre (Count: ${newFlowEdges.length}):`, JSON.parse(JSON.stringify(newFlowEdges.map(e=>({id:e.id,s:e.source,t:e.target})))));

    if (newFlowNodes.length > 0) {
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newFlowNodes, newFlowEdges);
        console.log(`[WorkflowDAG-Stylish ${timestamp}] Layouted nodes (Count: ${layoutedNodes.length}):`, JSON.parse(JSON.stringify(layoutedNodes.map(n => ({id:n.id, label:n.data.label, x:n.position.x, y:n.position.y, type:n.type})))));
        setRfNodes(layoutedNodes);
        setRfEdges(layoutedEdges);
    } else {
        setRfNodes([]);
        setRfEdges([]);
    }

  }, [steps, setRfNodes, setRfEdges]);

  const toggleMaximize = () => {
    setMaximized(!maximized);
    // Trigger a resize event to update dimensions
    window.dispatchEvent(new Event('resize'));
  };

  // Safely get the label for the header
  const getHeaderLabel = () => {
    if (steps && Array.isArray(steps) && steps.length > 0 && steps[0]?.data?.label) {
      return steps[0].data.label;
    }
    return 'Overview';
  };

  return (
    <div 
      className={`w-full h-full bg-gray-900 rounded-lg transition-all duration-300 ease-in-out ${
        maximized ? 'fixed inset-0 z-[100]' : 'relative'
      }`}
      style={{
        width: maximized ? '100vw' : dimensions.width,
        height: maximized ? '100vh' : dimensions.height,
        padding: maximized ? '20px' : '16px',
        marginTop: maximized ? '0' : '16px', // Remove margin when maximized
        position: maximized ? 'fixed' : 'relative',
        top: maximized ? 0 : 'auto',
        left: maximized ? 0 : 'auto',
        right: maximized ? 0 : 'auto',
        bottom: maximized ? 0 : 'auto'
      }}
    >
      <div className="absolute top-4 right-4 z-[101] flex gap-2">
        <button
          onClick={toggleMaximize}
          className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white shadow-lg"
          title={maximized ? "Minimize" : "Maximize"}
        >
          {maximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-white shadow-lg"
            title="Close"
          >
            <LogOut size={20} />
          </button>
        )}
      </div>
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#4a627a" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowDAG;
