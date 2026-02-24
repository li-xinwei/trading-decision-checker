// Vanilla TypeScript decision tree engine (no React dependency).
// Ported from src/hooks/useDecisionTree.ts with observer pattern.

import type {
  DecisionTreeConfig,
  TreeNode,
  DecisionRecord,
  ResultNode,
} from './types';

export interface EngineState {
  currentNode: TreeNode | null;
  currentNodeId: string;
  decisions: DecisionRecord[];
  result: ResultNode | null;
  progress: number;
  currentStep: number;
}

export type EngineListener = (state: EngineState) => void;

export class DecisionEngine {
  private config: DecisionTreeConfig;
  private currentNodeId: string;
  private decisions: DecisionRecord[] = [];
  private result: ResultNode | null = null;
  private listeners: EngineListener[] = [];

  constructor(config: DecisionTreeConfig) {
    this.config = config;
    this.currentNodeId = config.rootNodeId;
  }

  getState(): EngineState {
    const currentNode = this.config.nodes[this.currentNodeId] ?? null;
    return {
      currentNode,
      currentNodeId: this.currentNodeId,
      decisions: [...this.decisions],
      result: this.result,
      progress: Math.min((this.decisions.length / 10) * 100, 95),
      currentStep: this.decisions.length + 1,
    };
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(): void {
    const state = this.getState();
    for (const listener of this.listeners) {
      listener(state);
    }
  }

  selectOption(optionValue: string): void {
    const node = this.config.nodes[this.currentNodeId];
    if (!node) return;

    const option = node.options.find((o) => o.value === optionValue);
    if (!option) return;

    this.decisions.push({
      nodeId: node.id,
      question: node.question,
      answer: option.label,
      category: node.category,
      timestamp: Date.now(),
    });

    if (option.nextNodeId && this.config.nodes[option.nextNodeId]) {
      // Navigate to next question node
      this.currentNodeId = option.nextNodeId;
    } else if (option.nextNodeId && this.config.results[option.nextNodeId]) {
      // Reached a result
      this.result = this.config.results[option.nextNodeId];
    }

    this.emit();
  }

  goBack(): void {
    if (this.decisions.length === 0) return;

    if (this.result) {
      // On result screen → go back to the last question
      this.result = null;
      const lastDecision = this.decisions[this.decisions.length - 1];
      this.currentNodeId = lastDecision.nodeId;
      this.decisions = this.decisions.slice(0, -1);
    } else {
      // On a question → go back to previous question
      const prevDecisions = this.decisions.slice(0, -1);
      this.decisions = prevDecisions;
      if (prevDecisions.length === 0) {
        this.currentNodeId = this.config.rootNodeId;
      } else {
        // Navigate to the node that the PREVIOUS decision led us away from
        // The previous decision's nodeId is where that question was asked
        const prevDecision = prevDecisions[prevDecisions.length - 1];
        const prevNode = this.config.nodes[prevDecision.nodeId];
        const chosenOption = prevNode?.options.find(
          (o) => o.label === prevDecision.answer
        );
        if (chosenOption?.nextNodeId && this.config.nodes[chosenOption.nextNodeId]) {
          this.currentNodeId = chosenOption.nextNodeId;
        } else {
          // Fallback: go to the node that was recorded
          this.currentNodeId = this.config.rootNodeId;
        }
      }
    }

    this.emit();
  }

  reset(): void {
    this.currentNodeId = this.config.rootNodeId;
    this.decisions = [];
    this.result = null;
    this.emit();
  }
}
