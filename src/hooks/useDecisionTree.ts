import { useState, useCallback, useEffect } from 'react';
import type {
  DecisionTreeConfig,
  DecisionRecord,
  CheckSession,
  ResultNode,
} from '../types/decisionTree';
import {
  fetchSessions,
  insertSession,
  deleteAllSessions,
} from '../lib/supabase';

const STORAGE_KEY = 'trading_check_history';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadLocalHistory(): CheckSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistory(sessions: CheckSession[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function useDecisionTree(config: DecisionTreeConfig) {
  const [currentNodeId, setCurrentNodeId] = useState<string>(config.rootNodeId);
  const [decisions, setDecisions] = useState<DecisionRecord[]>([]);
  const [result, setResult] = useState<ResultNode | null>(null);
  const [history, setHistory] = useState<CheckSession[]>(loadLocalHistory);
  const [sessionId] = useState<string>(generateId);
  const [sessionStart] = useState<number>(Date.now);
  const [pair, setPair] = useState<string>('');

  // Load history from Supabase on mount, fall back to localStorage
  useEffect(() => {
    fetchSessions().then((remote) => {
      if (remote) {
        setHistory(remote);
        saveLocalHistory(remote);
      }
    });
  }, []);

  const currentNode = config.nodes[currentNodeId] || null;
  const totalSteps = Object.keys(config.nodes).length;
  const currentStep = decisions.length + 1;

  const progress = Math.min((decisions.length / 10) * 100, 95);

  const selectOption = useCallback(
    (optionValue: string) => {
      const node = config.nodes[currentNodeId];
      if (!node) return;

      const option = node.options.find((o) => o.value === optionValue);
      if (!option) return;

      const record: DecisionRecord = {
        nodeId: node.id,
        question: node.question,
        answer: option.label,
        category: node.category,
        timestamp: Date.now(),
      };

      const newDecisions = [...decisions, record];
      setDecisions(newDecisions);

      if (option.nextNodeId && config.nodes[option.nextNodeId]) {
        setCurrentNodeId(option.nextNodeId);
      } else if (option.nextNodeId && config.results[option.nextNodeId]) {
        const resultNode = config.results[option.nextNodeId];
        setResult(resultNode);

        const session: CheckSession = {
          id: sessionId,
          startTime: sessionStart,
          endTime: Date.now(),
          decisions: newDecisions,
          result: resultNode,
          tradeDirection: newDecisions[0]?.answer,
          pair: pair || undefined,
        };

        const newHistory = [session, ...history].slice(0, 50);
        setHistory(newHistory);
        saveLocalHistory(newHistory);
        insertSession(session);
      }
    },
    [currentNodeId, config, decisions, history, sessionId, sessionStart, pair]
  );

  const goBack = useCallback(() => {
    if (decisions.length === 0) return;

    if (result) {
      setResult(null);
      const lastDecision = decisions[decisions.length - 1];
      setCurrentNodeId(lastDecision.nodeId);
      setDecisions(decisions.slice(0, -1));
    } else {
      const prevDecisions = decisions.slice(0, -1);
      setDecisions(prevDecisions);
      if (prevDecisions.length === 0) {
        setCurrentNodeId(config.rootNodeId);
      } else {
        const lastDecision = decisions[decisions.length - 1];
        setCurrentNodeId(lastDecision.nodeId);
      }
    }
  }, [decisions, result, config.rootNodeId]);

  const reset = useCallback(() => {
    setCurrentNodeId(config.rootNodeId);
    setDecisions([]);
    setResult(null);
    setPair('');
  }, [config.rootNodeId]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveLocalHistory([]);
    deleteAllSessions();
  }, []);

  return {
    currentNode,
    currentNodeId,
    decisions,
    result,
    history,
    progress,
    totalSteps,
    currentStep,
    pair,
    setPair,
    selectOption,
    goBack,
    reset,
    clearHistory,
  };
}
