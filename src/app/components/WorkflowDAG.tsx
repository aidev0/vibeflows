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

const NODE_WIDTH = 230; // Adjusted for a bit more content
const NODE_HEIGHT = 90; // Adjusted

// 1. Define the stylish custom node with Handles
const nodeTypes = {
  stylishDagreNode: ({ data, id, sourcePosition, targetPosition }: {
    data: { label: string; description?: string, icon?: React.ElementType }; // Allow an icon prop
    id: string;
    sourcePosition?: Position;
    targetPosition?: Position;
  }) => {
    const IconComponent = data.icon;
    return (
      <div style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        background: 'linear-gradient(145deg, #2c3e50 0%, #34495e 100%)', // Darker, sophisticated gradient
        borderRadius: '12px',
        padding: '12px 15px',
        color: '#ecf0f1', // Light gray/off-white text
        textAlign: 'left', // Align text to the left for a more standard card feel
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        boxSizing: 'border-box',
        border: '1px solid #4a627a' // Subtle border
      }}>
        <Handle
          type="target"
          position={targetPosition || Position.Left}
          id={`target-${id}`}
          style={{ background: '#7f8c8d', width: 10, height: 10, borderRadius: 3, border: '1px solid #bdc3c7' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          {IconComponent && <IconComponent style={{ marginRight: '8px', width: '20px', height: '20px', color: '#3498db' /* A highlight color */ }} />}
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {data.label}
          </div>
        </div>
        {data.description && (
          <div style={{ fontSize: '12px', color: '#bdc3c7', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {data.description}
          </div>
        )}
        <Handle
          type="source"
          position={sourcePosition || Position.Right}
          id={`source-${id}`}
          style={{ background: '#7f8c8d', width: 10, height: 10, borderRadius: 3, border: '1px solid #bdc3c7' }}
        />
      </div>
    );
  }
};

// 2. Dagre layout function
function getLayoutedElements(nodes: RFNode[], edges: RFEdge[], direction = 'LR') { // LR for Left-to-Right
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 60, // Separation between nodes in the same rank
    ranksep: 90,  // Separation between ranks
    marginx: 20,
    marginy: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  try {
    dagre.layout(dagreGraph);
  } catch (e) {
    console.error("[DagreLayout] Error during layout:", e);
    // Return nodes with initial positions if layout fails to prevent crashes
    return {
      nodes: nodes.map(node => ({ ...node, position: { x: Math.random() * 50, y: Math.random() * 50 } })),
      edges,
    };
  }

  return {
    nodes: nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      if (!nodeWithPosition) {
        console.error(`[DagreLayout] Node ID ${node.id} not found in Dagre graph after layout.`);
        return { ...node, position: { x: 0, y: 0 } }; // Fallback
      }
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - NODE_WIDTH / 2,
          y: nodeWithPosition.y - NODE_HEIGHT / 2,
        },
        // Important: Set source/target positions for custom nodes if layout is not 'TB'
        sourcePosition: direction === 'LR' ? Position.Right : Position.Bottom,
        targetPosition: direction === 'LR' ? Position.Left : Position.Top,
        type: 'stylishDagreNode', // Ensure type is re-applied
      };
    }),
    edges, // Dagre doesn't modify edge objects directly for points in this setup
  };
}


const WorkflowDAG: React.FC<WorkflowDAGProps> = ({ steps, onClose }) => {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<RFNode[]>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<RFEdge[]>([]);
  const [maximized, setMaximized] = useState(false); // For the maximize toggle
  const { user, isLoading: isUserLoading } = useUser();

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
        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newFlowNodes, newFlowEdges, 'LR');
        console.log(`[WorkflowDAG-Stylish ${timestamp}] Layouted nodes (Count: ${layoutedNodes.length}):`, JSON.parse(JSON.stringify(layoutedNodes.map(n => ({id:n.id, label:n.data.label, x:n.position.x, y:n.position.y, type:n.type})))));
        setRfNodes(layoutedNodes);
        setRfEdges(layoutedEdges);
    } else {
        setRfNodes([]);
        setRfEdges([]);
    }

  }, [steps, setRfNodes, setRfEdges]);

  const toggleMaximize = () => setMaximized(!maximized);

  // Safely get the label for the header
  const getHeaderLabel = () => {
    if (steps && Array.isArray(steps) && steps.length > 0 && steps[0]?.data?.label) {
      return steps[0].data.label;
    }
    return 'Overview';
  };

  return (
    <div className="w-full h-full bg-gray-900 rounded-lg">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-right"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#4a627a" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export default WorkflowDAG;
