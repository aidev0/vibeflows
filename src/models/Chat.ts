export interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    description: string;
    tools: string[];
    notes: string;
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
  type: 'simple_text' | 'workflow_plan';
  json?: any;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  messageCount: number;
  lastMessageAt: string;
  user_id: string;
}

export interface Workflow {
  id: string;
  user_id: string;
  nodes: Node[];
  created_at: Date;
  message_id: string;
  chat_id: string;
} 