// API Types
export interface FlowNode {
  id: string;
  name: string;
  description?: string;
  type: 'function' | 'condition' | 'action' | 'agent' | 'flow';
  input_schema?: any;
  output_schema?: any;
  function_code?: string;
  required_packages?: string[];
  position?: { x: number; y: number };
  language?: string;
  uses_integrations?: string[];
  integrations?: string[];
}

export interface AgentNode {
  id: string;
  name: string;
  description?: string;
  type: 'agent' | 'function' | 'condition' | 'action' | 'flow';
  input_schema?: any;
  output_schema?: any;
  function_code?: string;
  required_packages?: string[];
  position?: { x: number; y: number };
  language?: string;
  uses_integrations?: string[];
  integrations?: string[];
}

export interface Flow {
  _id?: { $oid?: string } | string;
  name: string;
  description?: string;
  nodes: FlowNode[];
  edges?: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  created_at?: Date;
  updated_at?: Date;
  input_schema?: any;
  output_schema?: any;
}

export interface Agent {
  _id?: { $oid?: string } | string;
  name: string;
  description?: string;
  functions: AgentNode[];
  nodes?: AgentNode[];
  edges?: Array<{
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
  created_at?: Date;
  updated_at?: Date;
  input_schema?: any;
  output_schema?: any;
}

// Mock API Client
class APIClient {
  private baseURL = '/api';

  async getFlows(): Promise<Flow[]> {
    // Mock data for now
    return [
      {
        _id: '1',
        name: 'Sample Flow',
        description: 'A sample flow for demonstration',
        nodes: [
          {
            id: 'node1',
            name: 'Start Node',
            description: 'Initial node',
            type: 'function',
            position: { x: 100, y: 100 }
          }
        ],
        edges: []
      }
    ];
  }

  async getAgents(): Promise<Agent[]> {
    // Mock data for now
    return [
      {
        _id: '1',
        name: 'Sample Agent',
        description: 'A sample agent for demonstration',
        functions: [
          {
            id: 'func1',
            name: 'Sample Function',
            description: 'A sample function',
            type: 'agent',
            position: { x: 100, y: 100 }
          }
        ]
      }
    ];
  }

  async createFlow(flow: Omit<Flow, '_id'>): Promise<Flow> {
    // Mock implementation
    return { ...flow, _id: Date.now().toString() };
  }

  async createAgent(agent: Omit<Agent, '_id'>): Promise<Agent> {
    // Mock implementation
    return { ...agent, _id: Date.now().toString() };
  }

  async updateFlow(id: string, flow: Partial<Flow>): Promise<Flow> {
    // Mock implementation
    return { ...flow, _id: id } as Flow;
  }

  async updateAgent(id: string, agent: Partial<Agent>): Promise<Agent> {
    // Mock implementation
    return { ...agent, _id: id } as Agent;
  }

  async deleteFlow(id: string): Promise<void> {
    // Mock implementation
    // Flow deletion logic would go here
  }

  async deleteAgent(id: string): Promise<void> {
    // Mock implementation
    // Agent deletion logic would go here
  }
}

export const apiClient = new APIClient(); 