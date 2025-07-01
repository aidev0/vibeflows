'use client';

import React, { useState } from 'react';
import { Play, Code, Settings, Plus, Search, Zap, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { FlowNode, AgentNode, Flow, Agent } from '@/lib/api';

interface FunctionPanelProps {
  selectedNode: FlowNode | AgentNode | null;
  selectedItem: Flow | Agent | null;
}

interface FunctionExecution {
  id: string;
  functionName: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  duration?: number;
  result?: any;
  error?: string;
}

const FunctionPanel: React.FC<FunctionPanelProps> = ({ selectedNode, selectedItem }) => {
  const [activeTab, setActiveTab] = useState<'functions' | 'executions'>('functions');
  const [searchTerm, setSearchTerm] = useState('');
  const [executions, setExecutions] = useState<FunctionExecution[]>([
    {
      id: '1',
      functionName: 'get_available_models',
      status: 'completed',
      startTime: new Date(Date.now() - 300000),
      duration: 1200,
      result: { models: ['gpt-4', 'claude-3'] }
    },
    {
      id: '2',
      functionName: 'select_optimal_model',
      status: 'running',
      startTime: new Date(Date.now() - 30000)
    },
    {
      id: '3',
      functionName: 'generate_agent_spec',
      status: 'failed',
      startTime: new Date(Date.now() - 600000),
      duration: 5000,
      error: 'API rate limit exceeded'
    }
  ]);

  // Get functions from selected item or node
  const getFunctions = () => {
    if (selectedNode && 'function_code' in selectedNode) {
      // Agent node with function
      return [{
        id: selectedNode.id,
        name: selectedNode.name,
        description: selectedNode.description,
        code: selectedNode.function_code,
        language: selectedNode.language,
        packages: selectedNode.required_packages || [],
        integrations: selectedNode.uses_integrations || []
      }];
    }
    
    if (selectedItem && 'nodes' in selectedItem) {
      // Get all functions from agent nodes
      return (selectedItem.nodes || [])
        .filter((node: any) => 'function' in node || node.type === 'function')
        .map((node: any) => ({
          id: node.id,
          name: node.name,
          description: node.description,
          code: node.function_code,
          language: node.language,
          packages: node.required_packages || [],
          integrations: node.uses_integrations || []
        }));
    }
    
    return [];
  };

  const functions = getFunctions().filter(func =>
    func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    func.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const executeFunction = async (functionName: string) => {
    const newExecution: FunctionExecution = {
      id: Date.now().toString(),
      functionName,
      status: 'running',
      startTime: new Date()
    };

    setExecutions(prev => [newExecution, ...prev]);

    // Simulate execution
    setTimeout(() => {
      setExecutions(prev => 
        prev.map(exec => 
          exec.id === newExecution.id 
            ? { 
                ...exec, 
                status: 'completed', 
                duration: Math.random() * 3000 + 500,
                result: { message: `${functionName} executed successfully`, data: { output: 'sample_result' } }
              }
            : exec
        )
      );
    }, 2000 + Math.random() * 3000);
  };

  if (!selectedNode && !selectedItem) {
    return (
      <div className="h-full bg-gray-800 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <Code size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-xs">Select an item to view functions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-800 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Code className="text-blue-400" size={16} />
            <h3 className="font-semibold text-sm">Functions</h3>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors">
            <Plus size={10} />
            New
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => setActiveTab('functions')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'functions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Functions ({functions.length})
          </button>
          <button
            onClick={() => setActiveTab('executions')}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              activeTab === 'executions'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Executions ({executions.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'functions' && (
          <div className="p-4 space-y-3">
            {functions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Code size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No functions available</p>
              </div>
            ) : (
              functions.map((func) => (
                <div key={func.id} className="bg-gray-700 border border-gray-600 rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Code size={12} className="text-blue-400 mt-0.5" />
                      <h4 className="font-medium text-xs">{func.name}</h4>
                    </div>
                    <button
                      onClick={() => executeFunction(func.name)}
                      className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
                    >
                      <Play size={10} />
                      Run
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-400 mb-2 line-clamp-2">{func.description}</p>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-600 text-gray-300 px-1.5 py-0.5 rounded">
                      {func.language}
                    </span>
                    {func.packages.length > 0 && (
                      <span className="text-xs text-gray-400">
                        +{func.packages.length} packages
                      </span>
                    )}
                  </div>

                  {func.integrations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {func.integrations.slice(0, 2).map((integration: string, idx: number) => (
                        <span key={idx} className="text-xs bg-orange-500/20 text-orange-300 px-1 py-0.5 rounded">
                          {integration}
                        </span>
                      ))}
                      {func.integrations.length > 2 && (
                        <span className="text-xs text-gray-400">
                          +{func.integrations.length - 2} more
                        </span>
                      )}
                    </div>
                  )}

                  {func.code && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                        View Code
                      </summary>
                      <pre className="text-xs bg-gray-900 p-2 rounded mt-1 overflow-auto max-h-20 border border-gray-600">
                        <code className="text-green-300">{func.code}</code>
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="p-4 space-y-2">
            {executions.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <Clock size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">No executions yet</p>
              </div>
            ) : (
              executions.map((execution) => (
                <div key={execution.id} className="bg-gray-700 border border-gray-600 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        execution.status === 'running' ? 'bg-blue-400 animate-pulse' :
                        execution.status === 'completed' ? 'bg-green-400' :
                        'bg-red-400'
                      }`} />
                      <span className="text-xs font-medium">{execution.functionName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {execution.status === 'running' && <Clock size={10} className="text-blue-400" />}
                      {execution.status === 'completed' && <CheckCircle size={10} className="text-green-400" />}
                      {execution.status === 'failed' && <AlertCircle size={10} className="text-red-400" />}
                      <span className={`text-xs capitalize ${
                        execution.status === 'running' ? 'text-blue-400' :
                        execution.status === 'completed' ? 'text-green-400' :
                        'text-red-400'
                      }`}>
                        {execution.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 mb-2">
                    Started: {execution.startTime.toLocaleTimeString()}
                    {execution.duration && (
                      <span className="ml-2">Duration: {execution.duration}ms</span>
                    )}
                  </div>

                  {execution.result && (
                    <details className="mb-2">
                      <summary className="text-xs text-green-400 cursor-pointer hover:text-green-300">
                        View Result
                      </summary>
                      <pre className="text-xs bg-gray-900 p-2 rounded mt-1 overflow-auto max-h-16 border border-gray-600">
                        <code className="text-green-300">{JSON.stringify(execution.result, null, 2)}</code>
                      </pre>
                    </details>
                  )}

                  {execution.error && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                      {execution.error}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-xs flex items-center justify-center gap-2 transition-colors">
            <Zap size={12} />
            Execute All
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-xs flex items-center gap-2 transition-colors">
            <Settings size={12} />
            Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default FunctionPanel;