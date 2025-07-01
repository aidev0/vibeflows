import React from 'react';
import { Settings, Play, Bot, GitBranch, Circle, Info } from 'lucide-react';
import { FlowNode, AgentNode, Flow, Agent } from '@/lib/api';

interface DetailsPanelProps {
  selectedNode: FlowNode | AgentNode | null;
  selectedItem: Flow | Agent | null;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedNode, selectedItem }) => {
  if (!selectedNode && !selectedItem) {
    return (
      <div className="h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Info size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">Select a node or item for details</p>
        </div>
      </div>
    );
  }

  if (selectedNode) {
    const isFlowNode = 'type' in selectedNode;

    return (
      <div className="h-full bg-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            {isFlowNode ? (
              (selectedNode as FlowNode).type === 'agent' ? 
              <Bot size={16} className="text-purple-400" /> : 
              <GitBranch size={16} className="text-green-400" />
            ) : (
              <Circle size={16} className="text-blue-400" />
            )}
            <h3 className="font-semibold text-sm">{selectedNode.name}</h3>
          </div>
          <p className="text-xs text-gray-400">{selectedNode.description}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedNode.language && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">LANGUAGE</h4>
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                {selectedNode.language.toUpperCase()}
              </span>
            </div>
          )}

          {selectedNode.input_schema && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">INPUT SCHEMA</h4>
              <pre className="text-green-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-24">
                {JSON.stringify(selectedNode.input_schema, null, 2)}
              </pre>
            </div>
          )}

          {selectedNode.output_schema && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">OUTPUT SCHEMA</h4>
              <pre className="text-blue-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-24">
                {JSON.stringify(selectedNode.output_schema, null, 2)}
              </pre>
            </div>
          )}

          {selectedNode.required_packages && selectedNode.required_packages.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-400 mb-1">PACKAGES</h4>
              <div className="flex flex-wrap gap-1">
                {selectedNode.required_packages.map((pkg, idx) => (
                  <span key={idx} className="text-xs bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded">
                    {pkg}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">ACTIONS</h4>
            <div className="space-y-2">
              <button className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
                <Play size={12} />
                Execute
              </button>
              <button className="w-full bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
                <Settings size={12} />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

// Show item details if no node selected
 return (
   <div className="h-full bg-gray-800 flex flex-col">
     <div className="p-4 border-b border-gray-700">
       <div className="flex items-center gap-2 mb-2">
         {selectedItem && 'nodes' in selectedItem && selectedItem.nodes?.some((n: any) => 'type' in n) ? (
           <GitBranch size={16} className="text-green-400" />
         ) : (
           <Bot size={16} className="text-purple-400" />
         )}
         <h3 className="font-semibold text-sm">{selectedItem?.name}</h3>
       </div>
       <p className="text-xs text-gray-400">{selectedItem?.description}</p>
     </div>

     <div className="flex-1 overflow-y-auto p-4 space-y-4">
       <div>
         <h4 className="text-xs font-semibold text-gray-400 mb-2">OVERVIEW</h4>
         <div className="grid grid-cols-2 gap-3 text-xs">
           <div className="bg-gray-700 p-2 rounded">
             <div className="text-gray-400">Nodes</div>
             <div className="font-semibold">{selectedItem?.nodes?.length || 0}</div>
           </div>
           <div className="bg-gray-700 p-2 rounded">
             <div className="text-gray-400">Connections</div>
             <div className="font-semibold">{selectedItem?.edges?.length || 0}</div>
           </div>
         </div>
       </div>

       {selectedItem?.input_schema && (
         <div>
           <h4 className="text-xs font-semibold text-gray-400 mb-1">INPUT SCHEMA</h4>
           <pre className="text-green-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-24">
             {JSON.stringify(selectedItem.input_schema, null, 2)}
           </pre>
         </div>
       )}

       {selectedItem?.output_schema && (
         <div>
           <h4 className="text-xs font-semibold text-gray-400 mb-1">OUTPUT SCHEMA</h4>
           <pre className="text-blue-400 bg-gray-900 p-2 rounded text-xs border border-gray-600 overflow-auto max-h-24">
             {JSON.stringify(selectedItem.output_schema, null, 2)}
           </pre>
         </div>
       )}

       <div className="pt-2">
         <h4 className="text-xs font-semibold text-gray-400 mb-2">ACTIONS</h4>
         <div className="space-y-2">
           <button className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
             <Play size={12} />Run {selectedItem && 'nodes' in selectedItem && selectedItem.nodes?.some((n: any) => 'type' in n) ? 'Flow' : 'Agent'}
           </button>
           <button className="w-full bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
             <Settings size={12} />
             Configure
           </button>
         </div>
       </div>
     </div>
   </div>
 );
};

export default DetailsPanel;