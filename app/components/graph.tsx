'use client';

import React, { useMemo, forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import dagre from 'dagre';

interface GraphNode {
  id: string;
  name: string;
  type?: string;
  description?: string;
  [key: string]: any;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
  [key: string]: any;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphProps {
  data: GraphData;
  selectedNode?: GraphNode;
  onNodeClick?: (node: GraphNode) => void;
  renderNode?: (node: GraphNode & { position: { x: number; y: number } }, isSelected: boolean) => React.ReactNode;
  renderEdge?: (edge: GraphEdge, sourcePos: { x: number; y: number }, targetPos: { x: number; y: number }, isHighlighted: boolean) => React.ReactNode;
  className?: string;
  nodeWidth?: number;
  nodeHeight?: number;
  emptyState?: React.ReactNode;
}

const Graph = forwardRef<{ fitView: () => void }, GraphProps>(({
  data,
  selectedNode,
  onNodeClick,
  renderNode,
  renderEdge,
  className = '',
  nodeWidth = 200,
  nodeHeight = 80,
  emptyState
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});

  const { nodesWithPositions, edges } = useMemo(() => {
    const nodes = data?.nodes || [];
    const edgesList = data?.edges || [];
    
    // Validate nodes - only include nodes with valid IDs
    const validNodes = nodes.filter(node => node?.id || node?._id);
    
    if (validNodes.length === 0) {
      return { nodesWithPositions: [], edges: [] };
    }
    
    // Create dagre graph
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 120,
      marginx: 40,
      marginy: 40,
    });

    // Add nodes with proper validation
    validNodes.forEach((node) => {
      const nodeId = String(node?.id || node?._id);
      if (nodeId && nodeId !== 'undefined') {
        graph.setNode(nodeId, { 
          width: nodeWidth, 
          height: nodeHeight,
          label: String(node.name || nodeId) 
        });
      }
    });

    // Add edges with validation
    edgesList.forEach((edge) => {
      const sourceId = String(edge?.source || '');
      const targetId = String(edge?.target || '');
      
      if (sourceId && targetId && 
          sourceId !== 'undefined' && targetId !== 'undefined' &&
          graph.hasNode(sourceId) && graph.hasNode(targetId)) {
        graph.setEdge(sourceId, targetId);
      }
    });

    // Calculate layout
    dagre.layout(graph);

    // Position nodes
    const positioned = validNodes.map((node) => {
      const nodeId = String(node?.id || node?._id);
      if (!nodeId || nodeId === 'undefined') return null;
      
      const graphNode = graph.node(nodeId);
      return {
        ...node,
        id: nodeId, // Ensure consistent ID
        position: graphNode ? {
          x: graphNode.x - graphNode.width / 2,
          y: graphNode.y - graphNode.height / 2,
        } : { x: 0, y: 0 }
      };
    }).filter(Boolean);
    
    return {
      nodesWithPositions: positioned,
      edges: edgesList,
    };
  }, [data, nodeWidth, nodeHeight]);

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * delta))
    }));
  }, []);

  // Handle pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Fit view function
  const fitView = useCallback(() => {
    if (nodesWithPositions.length > 0 && containerRef.current) {
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Calculate bounds
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      
      nodesWithPositions.forEach(node => {
        if (node && node.position) {
          const x = Number(node.position.x || 0);
          const y = Number(node.position.y || 0);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + nodeWidth);
          maxY = Math.max(maxY, y + nodeHeight);
        }
      });
      
      // Graph dimensions
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const padding = 50;
      
      // Calculate scale to fit
      const scaleX = (containerRect.width - padding * 2) / graphWidth;
      const scaleY = (containerRect.height - padding * 2) / graphHeight;
      const scale = Math.min(scaleX, scaleY, 1);
      
      // Calculate center offset
      const scaledWidth = graphWidth * scale;
      const scaledHeight = graphHeight * scale;
      const offsetX = (containerRect.width - scaledWidth) / 2 - minX * scale;
      const offsetY = (containerRect.height - scaledHeight) / 2 - minY * scale;
      
      setTransform({ x: offsetX, y: offsetY, scale });
    }
  }, [nodesWithPositions, nodeWidth, nodeHeight]);

  // Auto-fit on initial load
  useEffect(() => {
    if (nodesWithPositions.length > 0) {
      fitView();
    }
  }, [nodesWithPositions.length > 0 ? nodesWithPositions[0]?.id : null, fitView]);

  useImperativeHandle(ref, () => ({
    fitView
  }));

  // Default empty state
  const defaultEmptyState = (
    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-lg mb-2">No data to display</div>
        <div className="text-sm">Add nodes and edges to see the graph</div>
      </div>
    </div>
  );

  if (!data || !nodesWithPositions.length) {
    return (
      <div className={`w-full h-full bg-gray-900 relative ${className}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {emptyState || defaultEmptyState}
        </div>
      </div>
    );
  }

  // Default node renderer
  const defaultRenderNode = (node: GraphNode & { position: { x: number; y: number } }, isSelected: boolean) => (
    <div
      className={`absolute rounded-lg border-2 p-3 cursor-pointer transition-all duration-200 select-none ${
        isSelected 
          ? 'bg-blue-500/30 border-blue-400 text-white shadow-lg' 
          : 'bg-gray-800/80 border-gray-600 text-gray-200 hover:bg-gray-700/80 hover:border-gray-500'
      }`}
      style={{ 
        left: `${node.position.x}px`, 
        top: `${node.position.y}px`, 
        width: `${nodeWidth}px`, 
        height: `${nodeHeight}px` 
      }}
      onClick={() => onNodeClick?.(node)}
    >
      <div className="font-semibold text-sm truncate">{node.name || node.id}</div>
      {node.description && (
        <div className="text-xs text-gray-400 mt-1 truncate">{node.description}</div>
      )}
    </div>
  );

  // Default edge renderer
  const defaultRenderEdge = (
    edge: GraphEdge, 
    sourcePos: { x: number; y: number }, 
    targetPos: { x: number; y: number }, 
    isHighlighted: boolean
  ) => {
    const startX = sourcePos.x + nodeWidth / 2;
    const startY = sourcePos.y + nodeHeight;
    const endX = targetPos.x + nodeWidth / 2;
    const endY = targetPos.y;
    
    const midY = (startY + endY) / 2;
    const controlY = midY - Math.abs(endY - startY) * 0.3;
    
    return (
      <g key={`${edge.source}-${edge.target}`}>
        <path
          d={`M ${startX} ${startY} Q ${startX} ${controlY} ${endX} ${endY}`}
          stroke={isHighlighted ? "#3B82F6" : "#64748B"}
          strokeWidth={isHighlighted ? "2" : "1.5"}
          fill="none"
          markerEnd="url(#arrowhead)"
          className="transition-all duration-200"
        />
        {edge.label && (
          <text
            x={startX}
            y={controlY}
            fill="#E2E8F0"
            fontSize="10"
            textAnchor="middle"
            className="pointer-events-none"
          >
            {edge.label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full bg-gray-900 relative overflow-hidden ${className}`}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      <div 
        className="graph-content absolute inset-0"
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {/* SVG for edges */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="8"
              refX="9"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 10 4, 0 8" fill="#64748B" />
            </marker>
          </defs>
          
          {edges.map((edge, idx) => {
            if (!edge?.source || !edge?.target) return null;
            
            const sourceNode = nodesWithPositions.find(n => n?.id === edge.source);
            const targetNode = nodesWithPositions.find(n => n?.id === edge.target);
            
            if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) return null;
            
            const isHighlighted = selectedNode && (
              String(selectedNode.id) === String(edge.source) || 
              String(selectedNode.id) === String(edge.target)
            );
            
            return renderEdge ? 
              renderEdge(edge, sourceNode.position, targetNode.position, !!isHighlighted) :
              defaultRenderEdge(edge, sourceNode.position, targetNode.position, !!isHighlighted);
          })}
        </svg>
        
        {/* Nodes */}
        <div className="relative z-10">
          {nodesWithPositions.map((node) => {
            if (!node || !node.position || !node.id) return null;
            
            const isSelected = selectedNode?.id === node.id;
            
            return (
              <React.Fragment key={String(node.id)}>
                {renderNode ? 
                  renderNode(node, isSelected) : 
                  defaultRenderNode(node, isSelected)
                }
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
});

Graph.displayName = 'Graph';

export default Graph; 