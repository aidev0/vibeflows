import React, { useState } from 'react';
import { Bot, Search, Plus, Cpu } from 'lucide-react';
import { Agent } from '@/lib/api';

interface AgentsPanelProps {
  agents: Agent[];
  loading: boolean;
  onItemSelect: (agent: Agent) => void;
  selectedItem: Agent | any | null;
}

const AgentsPanel: React.FC<AgentsPanelProps> = ({ agents, loading, onItemSelect, selectedItem }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agent.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getId = (agent: Agent): string => {
    if (!agent._id) return `agent-${Date.now()}`;
    return typeof agent._id === 'string' ? agent._id : (agent._id.$oid || `agent-${Date.now()}`);
  };

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Bot className="text-white" size={16} />
            </div>
            <h3 className="font-semibold text-white">Agents</h3>
          </div>
          <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-3 py-2 rounded-lg text-xs flex items-center gap-1 transition-all duration-200 shadow-lg hover:shadow-purple-500/25">
            <Plus size={12} />
            New
          </button>
        </div>
        
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm placeholder-gray-400"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">
            <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm">Loading agents...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAgents.map((agent) => (
              <div
                key={getId(agent)}
                onClick={() => onItemSelect(agent)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedItem && getId(selectedItem) === getId(agent)
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500 shadow-purple-500/25'
                    : 'bg-white/10 border-white/20 hover:border-purple-500/50 hover:bg-white/15'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                    <Cpu size={14} className="text-white" />
                  </div>
                  <h4 className="font-medium text-sm truncate text-white">{agent.name}</h4>
                </div>
                <p className="text-xs text-gray-300 line-clamp-2 mb-3 leading-relaxed">{agent.description}</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="bg-white/10 px-2 py-1 rounded-full">{agent.nodes?.length || 0} functions</span>
                  <span className="bg-white/10 px-2 py-1 rounded-full">{agent.edges?.length || 0} edges</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredAgents.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="p-4 bg-white/5 rounded-xl mb-4">
              <Bot size={32} className="mx-auto mb-2 opacity-50" />
            </div>
            <p className="text-sm text-gray-400">No agents found</p>
            <p className="text-xs text-gray-500 mt-1">Create your first agent to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPanel;