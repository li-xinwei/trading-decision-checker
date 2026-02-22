export interface TreeOption {
  label: string;
  nextNodeId: string | null; // null means terminal node
  value: string;
  icon?: string;
}

export interface TreeNode {
  id: string;
  question: string;
  description?: string;
  category: string;
  options: TreeOption[];
}

export interface ExecutionPlan {
  entry: string;
  stopLoss: string;
  takeProfit: string;
  notes?: string;
}

export interface ResultNode {
  id: string;
  type: 'go' | 'caution' | 'no-go';
  title: string;
  message: string;
  suggestions: string[];
  executionPlan?: ExecutionPlan;
}

export interface DecisionTreeConfig {
  name: string;
  description: string;
  rootNodeId: string;
  nodes: Record<string, TreeNode>;
  results: Record<string, ResultNode>;
}

export interface DecisionRecord {
  nodeId: string;
  question: string;
  answer: string;
  category: string;
  timestamp: number;
}

export interface CheckSession {
  id: string;
  startTime: number;
  endTime?: number;
  decisions: DecisionRecord[];
  result?: ResultNode;
  tradeDirection?: string;
  pair?: string;
}

export interface ContextFilter {
  id: string;
  name: string;
  description: string;
  conditions: string[];
  action: 'block' | 'warn';
  blockMessage: string;
}

export interface TradingSystemData {
  contextFilters: ContextFilter[];
  treeConfig: DecisionTreeConfig;
  tradersEquation: string;
  riskManagement: string;
  psychology: string;
}

