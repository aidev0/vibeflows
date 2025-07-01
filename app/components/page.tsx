// File: app/dashboard/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { Bot, GitBranch, Search, ArrowLeft } from 'lucide-react';

const API = {
  getFlows: () => fetch('/api/flows').then(res => res.json()),
  getAgents: () => fetch('/api/agents').then(res => res.json()),
};

const getNodeIcon = (type: string) => type === 'agent' ? <Bot size={16} /> : <GitBranch size={16} />;

const Dashboard = () => {
  const [tab, setTab] = useState<'flows' | 'agents'>('flows');
  const [flows, setFlows] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = tab === 'flows' ? await API.getFlows() : await API.getAgents();
        tab === 'flows' ? setFlows(data) : setAgents(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab]);

  const list = tab === 'flows' ? flows : agents;
  const filtered = list.filter((i) =>
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-gray-900 text-white font-sans flex flex-col">
      <header className="bg-gray-800 px-6 py-4 flex justify-between items-center border-b border-gray-700">
        <h1 className="text-2xl font-bold">VibeFlows</h1>
        <div className="flex gap-2">
          {['flows', 'agents'].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t as any); setSelectedItem(null); setSelectedNode(null); }}
              className={`px-4 py-2 rounded-lg ${tab === t ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-sm`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-gray-700 p-4 flex flex-col">
          {!selectedItem ? (
            <>
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={`Search ${tab}`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded pl-10 pr-4 py-2 text-sm"
                />
              </div>
              <div className="overflow-y-auto flex-1 space-y-3">
                {loading ? <p className="text-center text-gray-400">Loading...</p> : (
                  filtered.map((item) => (
                    <div
                      key={item._id?.$oid || item._id}
                      onClick={() => setSelectedItem(item)}
                      className="cursor-pointer border border-gray-700 p-3 rounded hover:border-blue-500"
                    >
                      <div className="flex gap-2 items-center font-semibold mb-1">
                        {tab === 'flows' ? <GitBranch size={16} /> : <Bot size={16} />}
                        {item.name}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{item.description}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <div>
              <button onClick={() => { setSelectedItem(null); setSelectedNode(null); }} className="text-blue-400 text-sm flex items-center gap-2 mb-4">
                <ArrowLeft size={16} /> Back
              </button>
              <h2 className="text-lg font-bold mb-1">{selectedItem.name}</h2>
              <p className="text-sm text-gray-400">{selectedItem.description}</p>
            </div>
          )}
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {selectedItem ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(selectedItem.nodes || selectedItem.functions || []).map((node: any) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-blue-500"
                >
                  <div className="flex items-center gap-2 font-semibold mb-2">
                    {getNodeIcon(node.type)}
                    <span>{node.name}</span>
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{node.type}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-3">{node.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 flex items-center justify-center h-full">
              <p>Select a {tab.slice(0, -1)} to visualize</p>
            </div>
          )}
        </main>

        {selectedNode && (
          <aside className="w-80 border-l border-gray-700 bg-gray-800 p-4 overflow-y-auto">
            <h3 className="text-lg font-bold mb-1">{selectedNode.name}</h3>
            <p className="text-sm text-gray-400 mb-3">{selectedNode.description}</p>
            {selectedNode.input_schema && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Input Schema</h4>
                <pre className="bg-gray-900 p-2 rounded text-xs border border-gray-600 text-green-400">
                  {JSON.stringify(selectedNode.input_schema, null, 2)}
                </pre>
              </div>
            )}
            {selectedNode.output_schema && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Output Schema</h4>
                <pre className="bg-gray-900 p-2 rounded text-xs border border-gray-600 text-blue-400">
                  {JSON.stringify(selectedNode.output_schema, null, 2)}
                </pre>
              </div>
            )}
            {selectedNode.function_code && (
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-1">Function Code</h4>
                <pre className="bg-gray-900 p-2 rounded text-xs border border-gray-600 text-yellow-400">
                  {selectedNode.function_code}
                </pre>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
