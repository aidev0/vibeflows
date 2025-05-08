// /components/WorkflowDAG.tsx
// This component defines the actual DAG visualization with enhanced styling.
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Node as ChatNodeType } from '@/models/Chat'; // Renamed to avoid conflict
import { 
  Maximize2, Minimize2, Zap, Settings, AlertTriangle, CheckCircle, PlayCircle, 
  MessageSquare, Database, Terminal, Send, Bell, GitFork, Repeat // Added more icons
} from 'lucide-react';

interface WorkflowDAGProps {
  steps: ChatNodeType[];
}

const NODES_PER_ROW = 3; 
const H_SPACING = 400; 
const V_SPACING = 240; 

// Enhanced Custom Node Type Definition
const nodeTypes = {
  customNode: ({ data }: { data: { label: string; description?: string; type?: string; icon?: React.ReactNode } }) => {
    let gradient = 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900'; // Default
    let borderColor = 'border-slate-600';
    let textColor = 'text-slate-100';
    let descriptionColor = 'text-slate-300';
    let NodeIcon = data.icon || <Zap size={26} className="text-sky-400" />; // Default icon

    // Style nodes based on a 'type' property in their data
    switch (data.type?.toLowerCase()) {
      case 'trigger':
        gradient = 'bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-700';
        borderColor = 'border-emerald-400';
        NodeIcon = <PlayCircle size={26} className="text-emerald-100" />;
        textColor = 'text-emerald-50';
        descriptionColor = 'text-emerald-200';
        break;
      case 'action':
        gradient = 'bg-gradient-to-br from-sky-500 via-blue-600 to-sky-700';
        borderColor = 'border-sky-400';
        NodeIcon = <Settings size={26} className="text-sky-100" />;
        textColor = 'text-sky-50';
        descriptionColor = 'text-sky-200';
        break;
      case 'condition':
        gradient = 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600';
        borderColor = 'border-amber-300';
        NodeIcon = <GitFork size={26} className="text-amber-100" />;
        textColor = 'text-amber-50';
        descriptionColor = 'text-amber-200';
        break;
      case 'data_input':
      case 'input':
        gradient = 'bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700';
        borderColor = 'border-purple-400';
        NodeIcon = <Database size={26} className="text-purple-100" />;
        textColor = 'text-purple-50';
        descriptionColor = 'text-purple-200';
        break;
      case 'data_output':
      case 'output':
        gradient = 'bg-gradient-to-br from-pink-500 via-rose-600 to-pink-700';
        borderColor = 'border-pink-400';
        NodeIcon = <Send size={26} className="text-pink-100" />;
        textColor = 'text-pink-50';
        descriptionColor = 'text-pink-200';
        break;
      case 'api_call':
        gradient = 'bg-gradient-to-br from-teal-500 via-cyan-600 to-teal-700';
        borderColor = 'border-teal-400';
        NodeIcon = <Terminal size={26} className="text-teal-100" />;
        textColor = 'text-teal-50';
        descriptionColor = 'text-teal-200';
        break;
      case 'loop':
        gradient = 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600';
        borderColor = 'border-yellow-300';
        NodeIcon = <Repeat size={26} className="text-yellow-100" />;
        textColor = 'text-yellow-50';
        descriptionColor = 'text-yellow-200';
        break;
      case 'notification':
        gradient = 'bg-gradient-to-br from-indigo-500 via-violet-600 to-indigo-700';
        borderColor = 'border-indigo-400';
        NodeIcon = <Bell size={26} className="text-indigo-100" />;
        textColor = 'text-indigo-50';
        descriptionColor = 'text-indigo-200';
        break;
      case 'error':
        gradient = 'bg-gradient-to-br from-red-600 via-rose-700 to-red-800';
        borderColor = 'border-red-500';
        NodeIcon = <AlertTriangle size={26} className="text-red-100" />;
        textColor = 'text-red-50';
        descriptionColor = 'text-red-200';
        break;
      case 'success':
        gradient = 'bg-gradient-to-br from-lime-500 via-green-600 to-lime-700';
        borderColor = 'border-lime-400';
        NodeIcon = <CheckCircle size={26} className="text-lime-100" />;
        textColor = 'text-lime-50';
        descriptionColor = 'text-lime-200';
        break;
      default: // A more vibrant default
        gradient = 'bg-gradient-to-br from-gray-600 via-slate-700 to-gray-800';
        borderColor = 'border-gray-500';
        NodeIcon = <Zap size={26} className="text-gray-100" />;
        textColor = 'text-gray-50';
        descriptionColor = 'text-gray-200';
        break;
    }

    return (
      <div className={`px-6 py-5 rounded-xl shadow-2xl min-w-[300px] max-w-[380px] border-2 ${borderColor} ${gradient} transition-all duration-200 hover:shadow-indigo-500/50 hover:scale-[1.03]`}>
        <div className="flex items-center space-x-4 mb-2.5">
          {NodeIcon}
          <div className={`text-xl font-semibold tracking-tight ${textColor}`}>{data.label}</div>
        </div>
        {data.description && (
          <div className={`text-sm ${descriptionColor} mt-1 font-normal pl-[42px]`}>{data.description}</div>
        )}
      </div>
    );
  },
};


const WorkflowDAG: React.FC<WorkflowDAGProps> = ({ steps }) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [maximized, setMaximized] = useState(false);
  const [initialLayoutComplete, setInitialLayoutComplete] = useState(false); 

  const transformStepsToFlowElements = useCallback((currentSteps: ChatNodeType[]) => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    currentSteps.forEach((step, index) => {
      const row = Math.floor(index / NODES_PER_ROW);
      const col = index % NODES_PER_ROW;
      const node: Node = {
        id: step.id,
        type: 'customNode', 
        position: {
          x: col * H_SPACING,
          y: row * V_SPACING,
        },
        data: { 
          label: step.data.label,
          description: step.data.description,
          type: step.data.type, 
          icon: step.data.icon, 
        },
        draggable: true, 
      };
      flowNodes.push(node);

      if (index > 0) {
        flowEdges.push({
          id: `e${currentSteps[index - 1].id}-${step.id}`,
          source: currentSteps[index - 1].id,
          target: step.id,
          type: 'smoothstep',
          animated: true, 
          style: {
            stroke: '#0ea5e9', 
            strokeWidth: 3, 
            opacity: 0, 
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#0ea5e9', 
            width: 25, 
            height: 25,
          },
        });
      }
    });
    return { nodes: flowNodes, edges: flowEdges };
  }, []);

  // useEffect to set up and animate nodes and edges when 'steps' change
  useEffect(() => {
    setInitialLayoutComplete(false); 
    const { nodes: newNodes, edges: newEdges } = transformStepsToFlowElements(steps);
    
    setNodes(newNodes.map(n => ({ ...n, style: { opacity: 0, transform: 'scale(0.9)' } })));
    setEdges(newEdges.map(e => ({ ...e, style: { ...e.style, opacity: 0 } })));

    const animationTimer = setTimeout(() => {
        setNodes(currentNodes => currentNodes.map(n => ({ ...n, style: { opacity: 1, transform: 'scale(1)', transition: 'opacity 0.4s ease-out, transform 0.4s ease-out' } })));
        setEdges(currentEdges => currentEdges.map(e => ({ ...e, style: { ...e.style, opacity: 1, transition: 'opacity 0.4s ease-out 0.2s' } })));
        setInitialLayoutComplete(true); 
    }, 50); 

    return () => clearTimeout(animationTimer);
  }, [steps, transformStepsToFlowElements, setNodes, setEdges]);

  // useEffect to call fitView only after initial layout and animation are complete
  useEffect(() => {
    if (initialLayoutComplete && nodes.length > 0) {
      const fitViewTimer = setTimeout(() => {
        console.log("Attempting to fitView with nodes:", nodes.map(n => ({id: n.id, position: n.position}))); // Log node positions
        fitView({ padding: 0.3, duration: 800 });
      }, 150); 
      return () => clearTimeout(fitViewTimer);
    }
  }, [initialLayoutComplete, nodes, fitView]);

  return (
    <div className={
      maximized
        ? 'fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm w-screen h-screen transition-all duration-300 ease-in-out' 
        : 'w-full h-full bg-slate-900 transition-all duration-300 ease-in-out rounded-lg overflow-hidden shadow-2xl relative' 
    }>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        minZoom={0.05}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={true} 
        nodesConnectable={false}
        elementsSelectable={true} 
        className="workflow-dag-beautiful"
        connectionLineStyle={{ stroke: '#0ea5e9', strokeWidth: 2.5 }}
        snapToGrid={true}
        snapGrid={[20, 20]} 
      >
        <Background 
            variant={BackgroundVariant.Lines} 
            gap={50} 
            size={2}  
            color="#1e293b" 
            style={{backgroundColor: '#0f172a'}} 
        />
        
        <Controls className="react-flow__controls_beautiful shadow-xl">
        </Controls>
        
        <MiniMap
          className="react-flow__minimap_beautiful shadow-xl"
          nodeStrokeColor={(n) => {
            if (n.data?.type === 'error') return '#ef4444'; 
            if (n.data?.type === 'success') return '#22c55e'; 
            return '#0ea5e9'; 
          }}
          nodeColor={(n) => {
            if (n.data?.type === 'trigger') return '#10b981'; 
            if (n.data?.type === 'action') return '#0ea5e9'; 
            if (n.data?.type === 'condition') return '#f59e0b'; 
            return '#334155'; 
          }}
          nodeBorderRadius={6}
          maskColor="rgba(15, 23, 42, 0.8)" 
        />
        
        <Panel position="top-right" className="m-3 z-[101]">
          <button
            onClick={() => setMaximized((m) => !m)}
            className="p-2.5 bg-slate-700/80 backdrop-blur-sm text-slate-100 rounded-lg hover:bg-slate-600/90 transition-colors shadow-lg focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-900 focus:ring-sky-500"
            aria-label={maximized ? 'Minimize Workflow View' : 'Maximize Workflow View'}
          >
            {maximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </Panel>
      </ReactFlow>
      <style jsx global>{`
        .react-flow__controls_beautiful button {
          background-color: rgba(30, 41, 59, 0.8); 
          backdrop-filter: blur(4px);
          color: #cbd5e1; 
          border: 1px solid #475569; 
          border-radius: 0.375rem; 
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
        }
        .react-flow__controls_beautiful button:hover {
          background-color: rgba(51, 65, 85, 0.9); 
          color: #f1f5f9; 
        }
        .react-flow__minimap_beautiful {
          background-color: rgba(30, 41, 59, 0.8); 
          backdrop-filter: blur(4px);
          border-radius: 0.5rem; 
          border: 1px solid #475569; 
        }
        .workflow-dag-beautiful .react-flow__edge-path {
          filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
        }
      `}</style>
    </div>
  );
};

export default WorkflowDAG;
