import React, { useState } from 'react';
import { GitBranch, Search, Plus, FolderOpen } from 'lucide-react';
import { Flow } from '@/lib/api';

interface FlowsPanelProps {
  flows: Flow[];
  loading: boolean;
  onItemSelect: (flow: Flow) => void;
  selectedItem: Flow | any | null;
  collapsed?: boolean;
}

const FlowsPanel: React.FC<FlowsPanelProps> = ({ 
  flows, 
  loading, 
  onItemSelect, 
  selectedItem, 
  collapsed = false 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFlows = flows.filter(flow =>
    flow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (flow.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getId = (flow: Flow): string => {
    if (!flow._id) return `flow-${Date.now()}`;
    return typeof flow._id === 'string' ? flow._id : (flow._id.$oid || `flow-${Date.now()}`);
  };

  if (collapsed) {
    return (
      <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm">
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center justify-center">
            <GitBranch className="text-green-400" size={20} />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-400">
            <FolderOpen size={24} className="mx-auto mb-2" />
            <p className="text-xs">Flows</p>
            <p className="text-xs mt-1">{flows.length}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
              <GitBranch className="text-white" size={16} />
            </div>
            <h3 className="font-semibold text-white">Flows</h3>
          </div>
          <button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-all duration-200 shadow-lg hover:shadow-green-500/25">
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
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 backdrop-blur-sm placeholder-gray-400"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm">Loading flows...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFlows.map((flow) => (
              <div
                key={getId(flow)}
                onClick={() => onItemSelect(flow)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedItem && getId(selectedItem) === getId(flow)
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500 shadow-green-500/25'
                    : 'bg-white/10 border-white/20 hover:border-green-500/50 hover:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                    <GitBranch size={14} className="text-white" />
                  </div>
                  <h4 className="font-medium text-sm truncate text-white">{flow.name}</h4>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2 mb-3 leading-relaxed">{flow.description}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="bg-white/10 px-2 py-1 rounded-full">{flow.nodes?.length || 0} nodes</span>
                  <span className="bg-white/10 px-2 py-1 rounded-full">{flow.edges?.length || 0} edges</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredFlows.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="p-4 bg-white/5 rounded-xl mb-4">
              <GitBranch size={32} className="mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-sm text-gray-400">No flows found</p>
            <p className="text-xs text-gray-500 mt-1">Create your first flow to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowsPanel;