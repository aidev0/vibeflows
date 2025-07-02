'use client';

import React from 'react';
import { Settings, Play, Bot, GitBranch, Circle } from 'lucide-react';
import { FlowNode, AgentNode } from '@/lib/api';

interface NodeDetailsProps {
  selectedNode: FlowNode | AgentNode | null;
}

const NodeDetails: React.FC<NodeDetailsProps> = ({ selectedNode }) => {
  if (!selectedNode) {
    return (
      <div className="flex items-center justify-center text-gray-500 h-full">
        <div className="text-center">
          <Settings size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a node to view details</p>
        </div>
      </div>
    );
  }

  const isFlowNode = 'type' in selectedNode;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          {isFlowNode ? (
            (selectedNode as FlowNode).type === 'agent' ? 
            <Bot size={20} className="text-purple-400" /> : 
            <GitBranch size={20} className="text-green-400" />
          ) : (
            <Circle size={20} className="text-blue-400" />
          )}
          <h2 className="text-xl font-bold">{selectedNode.name}</h2>
        </div>
        <p className="text-gray-400 mb-4">{selectedNode.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 rounded text-sm font-medium bg-gray-500/20 text-gray-300">
            {selectedNode.language?.toUpperCase()}
          </span>
          {isFlowNode && (selectedNode as FlowNode).type && (
            <span className={`px-3 py-1 rounded text-sm font-medium ${
              (selectedNode as FlowNode).type === 'agent' ? 'bg-purple-500/20 text-purple-300' : 'bg-green-500/20 text-green-300'
            }`}>
              {(selectedNode as FlowNode).type?.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {selectedNode.input_schema && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">INPUT SCHEMA</h3>
          <pre className="text-green-400 bg-gray-900 p-3 rounded text-xs border border-gray-600 overflow-auto max-h-32">
            {JSON.stringify(selectedNode.input_schema, null, 2)}
          </pre>
        </div>
      )}

      {selectedNode.output_schema && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">OUTPUT SCHEMA</h3>
          <pre className="text-blue-400 bg-gray-900 p-3 rounded text-xs border border-gray-600 overflow-auto max-h-32">
            {JSON.stringify(selectedNode.output_schema, null, 2)}
          </pre>
        </div>
      )}

      {selectedNode.required_packages && selectedNode.required_packages.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">REQUIRED PACKAGES</h3>
          <div className="flex flex-wrap gap-2">
            {selectedNode.required_packages.map((pkg, idx) => (
              <span key={idx} className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                {pkg}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">ACTIONS</h3>
        <div className="space-y-2">
          <button className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors">
            <Play size={14} />
            Execute {isFlowNode ? (selectedNode as FlowNode).type : 'Function'}
          </button>
          <button className="w-full bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded text-sm flex items-center gap-2 transition-colors">
            <Settings size={14} />
            Edit Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeDetails;