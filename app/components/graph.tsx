import React, { useMemo, forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { GitBranch, Bot, Circle, Network } from 'lucide-react';
import dagre from 'dagre';

interface Node {
  id: string;
  name: string;
  type: string;
  description?: string;
  language?: string;
  position?: { x: number; y: number };
}

interface Edge {
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
  name: string;
  description: string;
}

interface GraphProps {
  data: GraphData;
  selectedNode?: any;
  onNodeClick: (node: Node) => void;
  className?: string;
}

const Graph = forwardRef<{ fitView: () => void }, GraphProps>(({ 
  data, 
  selectedNode, 
  onNodeClick, 
  className 
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const [draggedNodePositions, setDraggedNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragStartNodePos, setDragStartNodePos] = useState({ x: 0, y: 0 });

  // Helper function to format names
  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const { nodesWithPositions, edges } = useMemo(() => {
    const nodes = data?.nodes || [];
    const edgesList = data?.edges || [];
    
    // Create a new directed graph for layout
    const graph = new dagre.graphlib.Graph();
    graph.setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: 'TB',
      nodesep: 120,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
    });

    // Add nodes to the graph with fixed sizes
    nodes.forEach((node) => {
      if (node?.id) {
        graph.setNode(String(node.id), { 
          width: 280, 
          height: 120,
          label: String(node.name || 'Unknown') 
        });
      }
    });

    // Add edges to the graph
    edgesList.forEach((edge) => {
      if (edge?.source && edge?.target && graph.hasNode(String(edge.source)) && graph.hasNode(String(edge.target))) {
        graph.setEdge(String(edge.source), String(edge.target));
      }
    });

    // Handle isolated nodes with grid layout if no edges exist
    if (edgesList.length === 0 && nodes.length > 0) {
      // For isolated nodes, use a grid layout instead of forcing connections
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacing = 350; // Horizontal spacing
      const verticalSpacing = 200; // Vertical spacing
      
      nodes.forEach((node, index) => {
        if (node?.id) {
          const col = index % cols;
          const row = Math.floor(index / cols);
          const x = col * spacing + spacing / 2;
          const y = row * verticalSpacing + verticalSpacing / 2;
          
          // Set manual positions for isolated nodes
          graph.node(String(node.id)).x = x;
          graph.node(String(node.id)).y = y;
        }
      });
    } else {
      // Calculate layout normally for connected graphs
      dagre.layout(graph);
    }

    // Create positioned nodes
    const positioned = nodes.map((node) => {
      if (!node?.id) return null;
      const graphNode = graph.node(String(node.id));
      return {
        ...node,
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
  }, [data]);

  useImperativeHandle(ref, () => ({
    fitView: () => {
      if (!containerRef.current || !nodesWithPositions.length) return;
      
      // Calculate bounds of all nodes
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      nodesWithPositions.forEach(node => {
        if (node && node.position) {
          const nodeX = Number(node.position.x || 0);
          const nodeY = Number(node.position.y || 0);
          minX = Math.min(minX, nodeX);
          minY = Math.min(minY, nodeY);
          maxX = Math.max(maxX, nodeX + 280); // node width
          maxY = Math.max(maxY, nodeY + 120); // node height
        }
      });
      
      // Add padding
      const padding = 100;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      // Calculate the center of all nodes
      const graphCenterX = (minX + maxX) / 2;
      const graphCenterY = (minY + maxY) / 2;
      
      // Get container dimensions
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;
      
      // Calculate the offset needed to center the graph
      // Account for the existing 32px padding in the graph-background
      const newPanX = containerCenterX - graphCenterX - 32;
      const newPanY = containerCenterY - graphCenterY - 32;
      
      // Set the new pan offset to center the graph
      setPanOffset({
        x: newPanX,
        y: newPanY
      });
      
      console.log('Graph fitted and centered');
    }
  }));

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest('.graph-background')) {
      setIsPanning(true);
      setPanStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const newOffset = {
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      };
      setPanOffset(newOffset);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Prevent text selection while panning
  useEffect(() => {
    if (isPanning) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isPanning]);

  // Get node colors based on type (from GraphPanel.tsx)
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

  // Node-specific mouse handlers
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string, currentPosition: { x: number; y: number }) => {
    e.stopPropagation();
    setIsDraggingNode(nodeId);
    setDragStart({ x: e.clientX, y: e.clientY });
    
    // Store the starting position for this drag operation
    const currentDraggedPos = draggedNodePositions[nodeId] || currentPosition;
    setDragStartNodePos(currentDraggedPos);
    
    // Initialize position if not already dragged
    if (!draggedNodePositions[nodeId]) {
      setDraggedNodePositions(prev => ({
        ...prev,
        [nodeId]: currentPosition
      }));
    }
  };

  if (!data) {
    return (
      <div className={`w-full h-full bg-gray-900 relative overflow-auto ${className || ''}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Circle size={48} className="mx-auto mb-3 opacity-50" />
            <div className="text-lg mb-2">No data available</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`w-full h-full bg-gray-900 relative overflow-hidden ${className || ''} ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {!nodesWithPositions || nodesWithPositions.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-400 max-w-md">
            <div className="flex justify-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl border border-purple-400/30">
                <Bot size={32} className="text-purple-400" />
              </div>
              <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl border border-green-400/30">
                <Network size={32} className="text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Select an Agent or Flow</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              Choose an agent or flow from the sidebar to visualize its structure and explore the connections between nodes.
            </p>
            <div className="mt-4 text-xs text-gray-500">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>Agents</span>
                <div className="w-2 h-2 bg-green-400 rounded-full ml-4"></div>
                <span>Flows</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div 
          className="graph-background relative w-full h-full" 
          style={{ 
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            padding: '32px'
          }}
        >
          {/* SVG for edges */}
          <svg 
            className="absolute pointer-events-none z-0"
            style={{
              left: '-500px',
              top: '-500px',
              width: 'calc(100% + 1000px)',
              height: 'calc(100% + 1000px)'
            }}
          >
            {edges && edges.map((edge, idx) => {
              if (!edge?.source || !edge?.target) return null;
              
              const sourceNode = nodesWithPositions.find(n => n?.id === edge.source);
              const targetNode = nodesWithPositions.find(n => n?.id === edge.target);
              
              if (!sourceNode || !targetNode || !sourceNode.position || !targetNode.position) return null;
              
              // Use normal node positions
              const startX = Number(sourceNode.position.x || 0) + 140 + 32 + 500;
              const startY = Number(sourceNode.position.y || 0) + 120 + 32 + 500;
              const endX = Number(targetNode.position.x || 0) + 140 + 32 + 500;
              const endY = Number(targetNode.position.y || 0) + 32 + 500;
              
              const midX = (startX + endX) / 2;
              const midY = (startY + endY) / 2;
              
              const isConnectedToSelected = 
                selectedNode && (
                  String(selectedNode.id) === String(edge.source) || 
                  String(selectedNode.id) === String(edge.target)
                );
              
              return (
                <g key={`edge-${String(edge.source)}-${String(edge.target)}-${idx}`}>
                  {/* Clean single path */}
                  <path
                    d={`M ${startX} ${startY} Q ${midX} ${midY - 30} ${endX} ${endY}`}
                    stroke={isConnectedToSelected ? "#60A5FA" : "#64748B"}
                    strokeWidth={isConnectedToSelected ? "2.5" : "1.5"}
                    fill="none"
                    markerEnd="url(#arrowhead)"
                    className="transition-all duration-200"
                    style={{
                      filter: isConnectedToSelected ? 'drop-shadow(0px 0px 4px rgba(96, 165, 250, 0.4))' : 'none'
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
                              y={midY - 40}
                              width={textWidth}
                              height="20"
                              rx="10"
                              fill="rgba(15, 23, 42, 0.9)"
                              stroke="rgba(100, 116, 139, 0.3)"
                              strokeWidth="1"
                            />
                            <text
                              x={midX}
                              y={midY - 26}
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
                  
                  {/* Clean animated flow indicator when selected */}
                  {isConnectedToSelected && (
                    <circle r="2.5" fill="#60A5FA" className="opacity-90">
                      <animateMotion
                        dur="1.5s"
                        repeatCount="indefinite"
                        path={`M ${startX} ${startY} Q ${midX} ${midY - 30} ${endX} ${endY}`}
                      />
                    </circle>
                  )}
                </g>
          );
        })}
            
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
      </svg>
      
          {/* Nodes */}
          <div className="relative z-10">
            {nodesWithPositions.map((node) => {
              if (!node || !node.position || !node.id) return null;
              
              const isSelected = selectedNode?.id === node.id;
              const nodeType = String(node.type || 'function');
              const nodeName = formatName(String(node.name || 'Unnamed Node'));
              const nodeDescription = String(node.description || '');
              const nodeLanguage = node.language ? String(node.language) : '';
              
              // Ensure position values are numbers
              const positionX = Number(node.position.x || 0);
              const positionY = Number(node.position.y || 0);
              
              // Use normal position
              const finalPosition = { x: positionX, y: positionY };
              
              return (
                <div
                  key={String(node.id)}
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
                    left: `${finalPosition.x}px`, 
                    top: `${finalPosition.y}px`, 
                    width: '280px', 
                    height: '120px' 
                  }}
                  onClick={() => onNodeClick(node)}
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
            })}
          </div>
        </div>
      )}
    </div>
  );
});

Graph.displayName = 'Graph';

export default Graph; 