// /components/WorkflowDAG.tsx
// DEBUGGING VERSION: Simplified styles and added logging to diagnose layout issues.
'use client';

import React, { useEffect } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Node as RFNode,
  Edge as RFEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { Node as ChatNodeType } from '@/models/Chat';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useUser } from '@auth0/nextjs-auth0/client';

interface WorkflowDAGProps {
  steps: ChatNodeType[];
}

const nodeWidth = 220;
const nodeHeight = 80;

const nodeTypes = {
  dagreNode: ({ data }: { data: { label: string; description?: string } }) => (
    <div style={{
      background: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
      borderRadius: 16,
      minWidth: 200,
      maxWidth: 260,
      padding: '18px 12px',
      color: '#fff',
      fontWeight: 700,
      fontSize: 18,
      textAlign: 'center',
      userSelect: 'none',
      border: 'none',
      boxShadow: '0 4px 24px 0 rgba(49,80,180,0.18)',
      position: 'relative',
      zIndex: 2,
    }}>
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>{data.label}</div>
      {data.description && (
        <div style={{ fontSize: 15, fontWeight: 500, color: '#e0e7ff' }}>{data.description}</div>
      )}
    </div>
  ),
};

function getLayoutedElements(nodes: RFNode[], edges: RFEdge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node: RFNode) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge: RFEdge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return {
    nodes: nodes.map((node: RFNode) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWidth / 2,
          y: nodeWithPosition.y - nodeHeight / 2,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        type: 'dagreNode',
      };
    }),
    edges,
  };
}

const WorkflowDAG: React.FC<WorkflowDAGProps> = ({ steps }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [maximized, setMaximized] = React.useState(false);
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!steps || steps.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Build nodes and edges from steps
    const flowNodes = steps.map((step) => ({
      id: step.id,
      data: {
        label: step.data.label,
        description: step.data.description,
      },
      type: 'dagreNode',
      position: { x: 0, y: 0 }, // dagre will set this
    }));

    const flowEdges = steps.slice(1).map((step, i) => ({
      id: `e${steps[i].id}-${step.id}`,
      source: steps[i].id,
      target: step.id,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: '#3b82f6',
        strokeWidth: 4,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3b82f6',
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(flowNodes, flowEdges, 'LR');
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [steps, setNodes, setEdges]);

  return (
    <div className={
      maximized
        ? 'fixed inset-0 z-50 bg-black/95 w-screen h-screen transition-all'
        : 'w-full h-full bg-black transition-all'
    }>
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6 py-3 shadow-lg">
        <div className="text-2xl font-bold text-white tracking-wide">VibeFlows AI</div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <span className="text-gray-400">Loading...</span>
          ) : user ? (
            <>
              <span className="text-gray-200">Welcome, {user.name || user.email || 'User'}!</span>
              <a href="/api/auth/logout" className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition">Logout</a>
            </>
          ) : (
            <a href="/api/auth/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition">Login</a>
          )}
        </div>
      </header>
      {/* Add padding top to avoid overlap with fixed header */}
      <div className="pt-16 h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          minZoom={0.1}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          fitView
        >
          <Background variant={BackgroundVariant.Dots} />
          <Controls />
          <MiniMap nodeColor="#3b82f6" maskColor="rgba(30, 58, 138, 0.5)" />
          <Panel position="top-right" className="bg-blue-900 border border-blue-700 rounded-lg p-2 z-50">
            <button
              onClick={() => setMaximized((m) => !m)}
              className="p-2 bg-blue-700 text-white rounded-lg hover:bg-blue-600 transition-colors"
              aria-label={maximized ? 'Minimize' : 'Maximize'}
            >
              {maximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowDAG;
