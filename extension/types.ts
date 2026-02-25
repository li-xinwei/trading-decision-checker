// Standalone types for the Chrome Extension (no React dependency)
// Ported from src/types/decisionTree.ts

export interface TreeOption {
  label: string;
  nextNodeId: string | null;
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

// Message types for chrome.runtime messaging
export type ExtensionMessage =
  | { type: 'CHECK_PASSED' }
  | { type: 'CHECK_RESET' }
  | { type: 'PING' };

// ==================== CrossTrade API ====================

export interface CrossTradeConfig {
  secretKey: string;
  accountName: string;
}

export interface CrossTradePosition {
  type: string;
  account: string;
  instrument: string;
  instrumentType: string;
  marketPosition: string; // "Long" | "Short" | "Flat"
  quantity: number;
  averagePrice: number;
  marketPrice: number;
  unrealizedProfitLoss: number;
}
