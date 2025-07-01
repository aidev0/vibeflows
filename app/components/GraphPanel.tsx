'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Network, Zap, GitBranch, Bot, Circle, Layers, Sparkles } from 'lucide-react';

interface GraphPanelProps {
  selectedItem: any;
  selectedNode: any;
  onNodeSelect: (node: any) => void;
}

const GraphPanel: React.FC<GraphPanelProps> = ({ selectedItem, selectedNode, onNodeSelect }) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const nodes = selectedItem?.nodes || selectedItem?.functions || [];
  const edges = selectedItem?.edges || [];

  const { positionedNodes, containerDimensions } = useMemo(() => {
    if (nodes.length === 0) return { positionedNodes: [], containerDimensions: { width: 1200, height: 800 } };

    // Create a proper flow layout based on connections
    const containerWidth = 1200;
    const containerHeight = 800;
    const nodeWidth = 200;
    const nodeHeight = 100;
    
    // Analyze the flow structure
    const nodeConnections = new Map();
    const incomingCount = new Map();
    const outgoingCount = new Map();
    
    // Initialize connection counts
    nodes.forEach((node: any) => {
      const nodeId = String(node.id);
      nodeConnections.set(nodeId, { incoming: [], outgoing: [] });
      incomingCount.set(nodeId, 0);
      outgoingCount.set(nodeId, 0);
    });
    
    // Count connections
    edges.forEach((edge: any) => {
      const sourceId = String(edge.source);
      const targetId = String(edge.target);
      
      if (nodeConnections.has(sourceId) && nodeConnections.has(targetId)) {
        nodeConnections.get(sourceId).outgoing.push(targetId);
        nodeConnections.get(targetId).incoming.push(sourceId);
        outgoingCount.set(sourceId, outgoingCount.get(sourceId) + 1);
        incomingCount.set(targetId, incomingCount.get(targetId) + 1);
      }
    });
    
    // Organize nodes into flow layers (left to right)
    const layers: string[][] = [];
    const visited = new Set();
    const nodeLayer = new Map();
    
    // Find starting nodes (no incoming connections)
    const startNodes = nodes.filter((node: any) => incomingCount.get(String(node.id)) === 0);
    
    if (startNodes.length === 0) {
      // If no clear start, use first node
      startNodes.push(nodes[0]);
    }
    
    // BFS to organize layers
    let currentLayer = startNodes.map((node: any) => String(node.id));
    let layerIndex = 0;
    
    while (currentLayer.length > 0) {
      layers[layerIndex] = currentLayer;
      currentLayer.forEach((nodeId: string) => {
        visited.add(nodeId);
        nodeLayer.set(nodeId, layerIndex);
      });
      
      const nextLayer = new Set();
      currentLayer.forEach((nodeId: string) => {
        const connections = nodeConnections.get(nodeId);
        if (connections) {
          connections.outgoing.forEach((targetId: string) => {
            if (!visited.has(targetId)) {
              nextLayer.add(targetId);
            }
          });
        }
      });
      
      currentLayer = Array.from(nextLayer);
      layerIndex++;
    }
    
    // Add any remaining unvisited nodes to the last layer
    const unvisited = nodes.filter((node: any) => !visited.has(String(node.id)));
    if (unvisited.length > 0) {
      layers[layerIndex] = unvisited.map((node: any) => String(node.id));
      unvisited.forEach((node: any) => nodeLayer.set(String(node.id), layerIndex));
    }
    
    // Calculate positions
    const totalLayers = layers.length;
    const layerWidth = (containerWidth - 100) / Math.max(1, totalLayers - 1);
    
    const positioned = nodes.map((node: any) => {
      const nodeId = String(node.id);
      const layer = nodeLayer.get(nodeId) || 0;
      const layerNodes = layers[layer] || [];
      const indexInLayer = layerNodes.indexOf(nodeId);
      
      const x = totalLayers === 1 ? 
        (containerWidth - nodeWidth) / 2 : 
        50 + (layer * layerWidth);
        
      const layerHeight = layerNodes.length > 1 ? 
        (containerHeight - 200) / (layerNodes.length - 1) : 
        0;
        
      const y = layerNodes.length === 1 ? 
        (containerHeight - nodeHeight) / 2 :
        100 + (indexInLayer * layerHeight);
      
      return {
        ...node,
        position: { x, y },
        dimensions: { width: nodeWidth, height: nodeHeight },
        layer,
        indexInLayer
      };
    });

    return { 
      positionedNodes: positioned, 
      containerDimensions: { width: containerWidth, height: containerHeight }
    };
  }, [nodes, edges]);

  const getNodeColors = (type: string) => {
    switch (type) {
      case 'agent':
        return {
          bg: 'from-purple-500/30 via-pink-500/20 to-purple-600/30',
          border: 'border-purple-400/60',
          icon: 'from-purple-400 to-pink-400',
          badge: 'bg-purple-500/40 text-purple-100',
          glow: 'shadow-purple-500/25'
        };
      case 'flow':
        return {
          bg: 'from-emerald-500/30 via-green-500/20 to-teal-600/30',
          border: 'border-emerald-400/60',
          icon: 'from-emerald-400 to-teal-400',
          badge: 'bg-emerald-500/40 text-emerald-100',
          glow: 'shadow-emerald-500/25'
        };
      default:
        return {
          bg: 'from-blue-500/30 via-cyan-500/20 to-indigo-600/30',
          border: 'border-blue-400/60',
          icon: 'from-blue-400 to-cyan-400',
          badge: 'bg-blue-500/40 text-blue-100',
          glow: 'shadow-blue-500/25'
        };
    }
  };

  if (!selectedItem) {
    return (
      <div className="h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 30% 20%, rgba(120,119,198,0.3), transparent 70%)'
          }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(circle at 70% 80%, rgba(168,85,247,0.4), transparent 70%)'
          }} />
        </div>
        
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl" />
              <div className="relative p-8 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 max-w-md mx-auto">
                <div className="relative mb-6">
                  <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-lg opacity-75" />
                  <Network size={64} className="relative mx-auto text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Select a Flow or Agent
                </h3>
                <p className="text-gray-300 leading-relaxed mb-6">
                  Choose from the side panels to visualize your workflow graph and see how components connect together.
                </p>
                <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Zap size={16} className="text-yellow-400" />
                    <span>Ready to visualize</span>
                  </div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-400" />
                    <span>Interactive graphs</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (nodes.length === 0) {
    return (
      <div className="h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center rounded-lg">
        <div className="text-center text-gray-400">
          <div className="p-8 bg-slate-800/50 backdrop-blur-sm rounded-3xl border border-white/10 mb-4">
            <Circle size={48} className="mx-auto mb-3 opacity-50" />
          </div>
          <p className="text-sm">No nodes available in this {selectedItem.nodes ? 'flow' : 'agent'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 25% 25%, rgba(99,102,241,0.15), transparent 50%)'
        }} />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 75% 75%, rgba(168,85,247,0.15), transparent 50%)'
        }} />
      </div>

      <div className="relative z-10 w-full h-full p-6">
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>
          <defs>
            <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="edgeGradientHover" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="1" />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EC4899" stopOpacity="1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,10 L12,5 z" fill="url(#edgeGradient)" />
            </marker>
            <marker
              id="arrowheadHover"
              markerWidth="14"
              markerHeight="12"
              refX="12"
              refY="6"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,12 L14,6 z" fill="url(#edgeGradientHover)" />
            </marker>
          </defs>
          
          {edges.map((edge: any, idx: number) => {
            const sourceNode = positionedNodes.find((n: any) => String(n?.id) === String(edge?.source));
            const targetNode = positionedNodes.find((n: any) => String(n?.id) === String(edge?.target));
            
            if (!sourceNode || !targetNode) return null;
            
            const startX = sourceNode.position.x + sourceNode.dimensions.width;
            const startY = sourceNode.position.y + sourceNode.dimensions.height / 2;
            const endX = targetNode.position.x;
            const endY = targetNode.position.y + targetNode.dimensions.height / 2;
            
            const midX = (startX + endX) / 2;
            const controlX1 = startX + (midX - startX) * 0.6;
            const controlX2 = endX - (endX - midX) * 0.6;
            
            const isConnectedToSelected = 
              selectedNode && (
                String(selectedNode.id) === String(edge.source) || 
                String(selectedNode.id) === String(edge.target)
              );
            
            return (
              <g key={`edge-${idx}`} className="transition-all duration-300">
                {/* Background path for glow effect */}
                <path
                  d={`M ${startX} ${startY} C ${controlX1} ${startY} ${controlX2} ${endY} ${endX} ${endY}`}
                  stroke={isConnectedToSelected ? "url(#edgeGradientHover)" : "url(#edgeGradient)"}
                  strokeWidth={isConnectedToSelected ? "4" : "3"}
                  fill="none"
                  markerEnd={isConnectedToSelected ? "url(#arrowheadHover)" : "url(#arrowhead)"}
                  filter={isConnectedToSelected ? "url(#strongGlow)" : "url(#glow)"}
                  className="opacity-90"
                />
                
                {/* Main path */}
                <path
                  d={`M ${startX} ${startY} C ${controlX1} ${startY} ${controlX2} ${endY} ${endX} ${endY}`}
                  stroke={isConnectedToSelected ? "url(#edgeGradientHover)" : "url(#edgeGradient)"}
                  strokeWidth={isConnectedToSelected ? "3" : "2"}
                  fill="none"
                  markerEnd={isConnectedToSelected ? "url(#arrowheadHover)" : "url(#arrowhead)"}
                  className="opacity-100"
                />
                
                {edge.label && (
                  <g>
                    <rect
                      x={midX - 30}
                      y={((startY + endY) / 2) - 10}
                      width="60"
                      height="20"
                      rx="10"
                      fill="rgba(30, 41, 59, 0.95)"
                      stroke="rgba(148, 163, 184, 0.4)"
                      strokeWidth="1"
                      filter="url(#glow)"
                    />
                    <text
                      x={midX}
                      y={((startY + endY) / 2) + 4}
                      textAnchor="middle"
                      className="text-xs font-medium fill-white"
                    >
                      {String(edge.label)}
                    </text>
                  </g>
                )}
                
                {/* Animated flow indicators */}
                {isConnectedToSelected && (
                  <circle r="3" fill="url(#edgeGradientHover)" className="opacity-80">
                    <animateMotion
                      dur="2s"
                      repeatCount="indefinite"
                      path={`M ${startX} ${startY} C ${controlX1} ${startY} ${controlX2} ${endY} ${endX} ${endY}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        <div className="relative z-10 w-full h-full">
          {positionedNodes.map((node: any, index: number) => {
            const isSelected = selectedNode?.id === node?.id;
            const isHovered = hoveredNode === node?.id;
            const nodeType = String(node?.type || 'function');
            const nodeName = String(node?.name || 'Unnamed Node');
            const nodeDescription = String(node?.description || '');
            const nodeLanguage = node?.language ? String(node.language) : '';
            const nodeId = String(node?.id || `node-${index}`);
            
            const colors = getNodeColors(nodeType);
            
            return (
              <div
                key={nodeId}
                className={`absolute rounded-2xl border cursor-pointer transition-all duration-500 ease-out backdrop-blur-xl transform hover:scale-105 ${
                  isSelected 
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} scale-110 shadow-2xl ${colors.glow} z-20 ring-2 ring-white/20` 
                    : isHovered
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} scale-105 shadow-xl ${colors.glow} z-10`
                    : `bg-gradient-to-br from-slate-800/70 to-slate-700/70 border-slate-600/40 shadow-lg hover:shadow-xl z-0 hover:border-slate-500/60`
                }`}
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                  width: `${node.dimensions.width}px`,
                  height: `${node.dimensions.height}px`,
                }}
                onClick={() => onNodeSelect(node)}
                onMouseEnter={() => setHoveredNode(nodeId)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Elegant gradient overlay */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 via-transparent to-black/20 pointer-events-none" />
                
                {/* Main content */}
                <div className="relative p-4 h-full flex flex-col">
                  {/* Header with icon and title */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${colors.icon} shadow-lg flex-shrink-0`}>
                      {nodeType === 'agent' ? <Bot size={16} className="text-white" /> : 
                       nodeType === 'flow' ? <GitBranch size={16} className="text-white" /> :
                       <Layers size={16} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-white truncate leading-tight">{nodeName}</h4>
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${colors.badge} mt-1`}>
                        {nodeType}
                      </span>
                    </div>
                  </div>
                  
                  {/* Description */}
                  {nodeDescription && (
                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-2 flex-1">
                      {nodeDescription}
                    </p>
                  )}
                  
                  {/* Footer with language tag */}
                  {nodeLanguage && (
                    <div className="mt-2 pt-2 border-t border-white/10">
                      <span className="text-xs bg-slate-700/60 text-gray-300 px-2 py-1 rounded-lg border border-slate-600/40 font-mono">
                        {nodeLanguage.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection glow effect */}
                {isSelected && (
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-400/30 to-purple-400/30 -z-10 blur-sm animate-pulse" />
                )}
                
                {/* Hover glow effect */}
                {isHovered && !isSelected && (
                  <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-sm" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GraphPanel;