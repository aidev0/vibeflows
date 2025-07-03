'use client';

import React from 'react';
import { Network, GitBranch, Bot } from 'lucide-react';
import Graph from './graph';

interface GraphPanelProps {
  selectedItem: any;
  selectedNode: any;
  onNodeSelect: (node: any) => void;
}

const GraphPanel: React.FC<GraphPanelProps> = ({ selectedItem, selectedNode, onNodeSelect }) => {
  // Helper function to format names
  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Prepare data for the generic graph component
  const graphData = {
    nodes: selectedItem?.nodes || selectedItem?.functions || [],
    edges: selectedItem?.edges || []
  };

  // Custom empty state
  const emptyState = (
    <div className="text-center">
      <div className="relative p-8 bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-white/10 max-w-md mx-auto">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full blur-lg opacity-75" />
          <Network size={64} className="relative mx-auto text-blue-400" />
        </div>
        <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Select a Flow or Agent
        </h3>
        <p className="text-gray-300 leading-relaxed mb-6">
          Choose from the side panels to visualize your workflow graph
        </p>
        <div className="flex justify-center gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span>Agents</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Flows</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>Functions</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Custom node renderer with beautiful colors
  const renderNode = (node: any, isSelected: boolean) => {
    const nodeType = String(node.type || 'function');
    const nodeName = formatName(String(node.name || 'Unnamed Node'));
    const nodeDescription = String(node.description || '');

    return (
      <div
        className={`absolute rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl select-none ${
          isSelected 
            ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400 text-white transform scale-105 shadow-blue-500/25' 
            : nodeType === 'agent'
            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-100 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400'
            : nodeType === 'flow'
            ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-100 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400'
            : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400'
        } backdrop-blur-sm`}
        style={{ 
          left: `${node.position.x}px`, 
          top: `${node.position.y}px`, 
          width: '280px', 
          height: '120px' 
        }}
        onClick={() => onNodeSelect(node)}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${
            nodeType === 'agent' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
            nodeType === 'flow' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
            'bg-gradient-to-r from-blue-500 to-cyan-500'
          }`}>
            {nodeType === 'agent' ? <Bot size={16} className="text-white" /> : 
             nodeType === 'flow' ? <GitBranch size={16} className="text-white" /> :
             <svg width="16" height="16" viewBox="0 0 16 16" className="text-white">
               <path
                 d="M8.5 2C10 2 11 3 11 4.5S10 7 8.5 7H7v1h3c0.3 0 0.5 0.2 0.5 0.5S10.3 9 10 9H7v4c0 1.5-0.8 2.5-2 3-0.3 0.1-0.6-0.1-0.6-0.4 0-0.2 0.1-0.3 0.3-0.4C5.5 14.8 6 14.2 6 13V5c0-1.7 1.3-3 3-3h2.5c0.3 0 0.5 0.2 0.5 0.5S11.8 3 11.5 3H8.5C7.7 3 7 3.7 7 4.5V6h1.5C9.3 6 10 5.3 10 4.5S9.3 3 8.5 3z"
                 fill="currentColor"
               />
             </svg>}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-white break-words leading-tight">{nodeName}</h4>
          </div>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed mb-3 break-words overflow-hidden"
           style={{
             display: '-webkit-box',
             WebkitLineClamp: 2,
             WebkitBoxOrient: 'vertical',
             lineHeight: '1.4',
             maxHeight: '2.8em'
           }}
        >{nodeDescription}</p>
      </div>
    );
  };

  // Custom edge renderer with beautiful gradients
  const renderEdge = (edge: any, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }, isHighlighted: boolean) => {
    const startX = sourcePos.x + 140; // center of wider node
    const startY = sourcePos.y + 120; // bottom of taller node
    const endX = targetPos.x + 140;   // center of wider node
    const endY = targetPos.y;         // top of node
    
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const controlY = midY - Math.abs(endY - startY) * 0.3;

    return (
      <g key={`${edge.source}-${edge.target}`}>
        <defs>
          <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker
            id="arrowheadColored"
            markerWidth="10"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
          >
            <polygon points="0 0, 10 4, 0 8" fill={isHighlighted ? "url(#edgeGradient)" : "#64748B"} />
          </marker>
        </defs>
        
        <path
          d={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
          stroke={isHighlighted ? "url(#edgeGradient)" : "#64748B"}
          strokeWidth={isHighlighted ? "2.5" : "1.5"}
          fill="none"
          markerEnd="url(#arrowheadColored)"
          className="transition-all duration-200"
          style={{
            filter: isHighlighted ? 'url(#glow)' : 'none'
          }}
        />
        
        {edge.label && (
          <g>
            {(() => {
              const labelText = formatName(String(edge.label));
              const textWidth = Math.max(60, Math.min(150, labelText.length * 7));
              const truncatedText = labelText.length > 20 ? labelText.substring(0, 17) + '...' : labelText;

              return (
                <>
                  <rect
                    x={midX - textWidth/2}
                    y={controlY - 10}
                    width={textWidth}
                    height="20"
                    rx="10"
                    fill="rgba(15, 23, 42, 0.9)"
                    stroke="rgba(100, 116, 139, 0.3)"
                    strokeWidth="1"
                  />
                  <text
                    x={midX}
                    y={controlY + 4}
                    fill="#E2E8F0"
                    fontSize="11"
                    textAnchor="middle"
                    className="pointer-events-none font-medium"
                  >
                    {truncatedText}
                  </text>
                </>
              );
            })()}
          </g>
        )}
        
        {/* Animated flow indicator when selected */}
        {isHighlighted && (
          <circle r="2.5" fill="#60A5FA" className="opacity-90">
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={`M ${startX} ${startY} Q ${midX} ${controlY} ${endX} ${endY}`}
            />
          </circle>
        )}
      </g>
    );
  };

  return (
    <div className="h-full w-full relative">
      
      {/* Graph component - only render if there's valid data */}
      {selectedItem && graphData.nodes.length > 0 && (
        <Graph
          data={graphData}
          selectedNode={selectedNode}
          onNodeClick={onNodeSelect}
          renderNode={renderNode}
          renderEdge={renderEdge}
          nodeWidth={280}
          nodeHeight={120}
          className="h-full w-full"
        />
      )}
    </div>
  );
};

export default GraphPanel;