export interface Node {
  id?: string;
  type?: string;
  label?: string;
  description?: string;
  integrations?: string[];
  data?: {
    label: string;
    description?: string;
    integrations?: string[];
    [key: string]: any;
  };
  position?: {
    x: number;
    y: number;
  };
}

export interface Message {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type: 'simple_text' | 'json' | 'workflow_plan';
  json?: any;
  nodeList?: {
    label: string;
    description: string;
    integrations: string[];
  }[];
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  type: 'chat';
  createdAt: Date;
  updatedAt: Date;
} 