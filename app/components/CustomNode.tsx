'use client';

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Bot, GitBranch } from 'lucide-react';

interface CustomNodeData {
  label: string;
  node: {
    name: string;
    type?: string;
    description?: string;
    language?: string;
  };
  isSelected: boolean;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const nodeType = String(data.node.type || 'function');
  const nodeName = String(data.node.name || 'Unnamed Node');
  const nodeDescription = String(data.node.description || '');

  // Format name: remove underscores and capitalize
  const formatName = (name: string) => {
    if (!name) return '';
    return name
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formattedName = formatName(nodeName);

  return (
    <div
      className={`rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 shadow-xl hover:shadow-2xl select-none min-w-[280px] min-h-[120px] ${
        selected || data.isSelected
          ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-blue-400 text-white transform scale-105 shadow-blue-500/25' 
          : nodeType === 'agent'
          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50 text-purple-100 hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400'
          : nodeType === 'flow'
          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 text-green-100 hover:from-green-500/30 hover:to-emerald-500/30 hover:border-green-400'
          : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-400/50 text-blue-100 hover:from-blue-500/30 hover:to-cyan-500/30 hover:border-blue-400'
      } backdrop-blur-sm`}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gray-400" />
      
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
          <h4 className="font-semibold text-sm text-white break-words leading-tight">{formattedName}</h4>
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

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-gray-400" />
    </div>
  );
};

export default CustomNode; 