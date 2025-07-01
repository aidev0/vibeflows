import { Flow, Agent, FlowNode, AgentNode } from './api';

// Helper function to safely get ID from Flow or Agent
export function getItemId(item: Flow | Agent): string {
  if (!item._id) return '';
  return typeof item._id === 'string' ? item._id : item._id.$oid || '';
}

// Helper function to check if description matches search
export function matchesSearch(item: { name: string; description?: string }, searchTerm: string): boolean {
  if (!searchTerm) return true;
  const search = searchTerm.toLowerCase();
  return item.name.toLowerCase().includes(search) || 
         (item.description?.toLowerCase().includes(search) ?? false);
}

// Helper function to get nodes from Flow or Agent
export function getNodes(item: Flow | Agent): (FlowNode | AgentNode)[] {
  if ('nodes' in item && item.nodes) return item.nodes;
  if ('functions' in item && item.functions) return item.functions;
  return [];
}

// Helper function to get edges from Flow or Agent
export function getEdges(item: Flow | Agent): Array<{source: string; target: string; sourceHandle?: string; targetHandle?: string}> {
  return item.edges || [];
}

// Helper function to check if item is a Flow
export function isFlow(item: Flow | Agent): item is Flow {
  return 'nodes' in item;
}

// Helper function to check if item is an Agent
export function isAgent(item: Flow | Agent): item is Agent {
  return 'functions' in item;
} 