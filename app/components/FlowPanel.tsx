import React, { useState } from 'react';
import { GitBranch, Search, Plus } from 'lucide-react';
import { Flow } from '@/lib/api';

interface FlowsPanelProps {
  flows: Flow[];
  loading: boolean;
  onItemSelect: (flow: Flow) => void;
  selectedItem: Flow | any | null;
}

const FlowsPanel: React.FC<FlowsPanelProps> = ({ flows, loading, onItemSelect, selectedItem }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flow.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getId = (flow: Flow): string => {
    if (!flow._id) return `flow-${Date.now()}`;
    return typeof flow._id === 'string' ? flow._id : (flow._id.$oid || `flow-${Date.now()}`);
  };

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitBranch className="text-green-400" size={20} />
            <h3 className="font-semibold">Flows</h3>
          </div>
          <button className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors">
            <Plus size={12} />
            New
          </button>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search flows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-green-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-xs">Loading...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFlows.map((flow) => (
              <div
                key={getId(flow)}
                onClick={() => onItemSelect(flow)}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  selectedItem && getId(selectedItem) === getId(flow)
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-gray-700 border-gray-600 hover:border-green-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <GitBranch size={14} className="text-green-400" />
                  <h4 className="font-medium text-sm truncate">{flow.name}</h4>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-2">{flow.description}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{flow.nodes?.length || 0} nodes</span>
                  <span>{flow.edges?.length || 0} edges</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredFlows.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <GitBranch size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">No flows found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowsPanel;