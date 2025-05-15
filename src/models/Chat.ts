export interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    [key: string]: any;
  };
  position: {
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
  nodeList?: any[];
  type: 'workflow_plan' | 'simple_text' | 'json';
  systemMessage?: string;
  json?: any;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  type: 'workflow' | 'support';
  createdAt: Date;
  updatedAt: Date;
} 