import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDecisionTree } from './useDecisionTree';
import type { DecisionTreeConfig } from '../types/decisionTree';

vi.mock('../lib/supabase', () => ({
  fetchSessions: vi.fn().mockResolvedValue(null),
  insertSession: vi.fn().mockResolvedValue(true),
  deleteAllSessions: vi.fn().mockResolvedValue(true),
}));

const miniTree: DecisionTreeConfig = {
  name: 'Test Tree',
  description: 'A minimal tree for testing',
  rootNodeId: 'q1',
  nodes: {
    q1: {
      id: 'q1',
      question: 'First question?',
      category: 'Cat A',
      options: [
        { label: 'Yes', value: 'yes', nextNodeId: 'q2' },
        { label: 'No', value: 'no', nextNodeId: 'result_bad' },
      ],
    },
    q2: {
      id: 'q2',
      question: 'Second question?',
      category: 'Cat B',
      options: [
        { label: 'Good', value: 'good', nextNodeId: 'result_good' },
        { label: 'Bad', value: 'bad', nextNodeId: 'result_bad' },
      ],
    },
  },
  results: {
    result_good: {
      id: 'result_good',
      type: 'go',
      title: 'All good',
      message: 'Proceed',
      suggestions: ['Do it'],
    },
    result_bad: {
      id: 'result_bad',
      type: 'no-go',
      title: 'Stop',
      message: 'Do not proceed',
      suggestions: ['Wait'],
    },
  },
};

describe('useDecisionTree', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts at the root node', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));
    expect(result.current.currentNodeId).toBe('q1');
    expect(result.current.currentNode?.question).toBe('First question?');
    expect(result.current.decisions).toHaveLength(0);
    expect(result.current.result).toBeNull();
  });

  it('navigates to next node on option select', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));

    expect(result.current.currentNodeId).toBe('q2');
    expect(result.current.decisions).toHaveLength(1);
    expect(result.current.decisions[0].answer).toBe('Yes');
    expect(result.current.decisions[0].category).toBe('Cat A');
  });

  it('reaches a result when terminal option is selected', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));
    act(() => result.current.selectOption('good'));

    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.type).toBe('go');
    expect(result.current.result?.title).toBe('All good');
    expect(result.current.decisions).toHaveLength(2);
  });

  it('reaches no-go result on direct rejection', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('no'));

    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.type).toBe('no-go');
  });

  it('goBack returns to previous node', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));
    expect(result.current.currentNodeId).toBe('q2');

    act(() => result.current.goBack());
    expect(result.current.currentNodeId).toBe('q1');
    expect(result.current.decisions).toHaveLength(0);
  });

  it('goBack from result returns to last question', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));
    act(() => result.current.selectOption('good'));
    expect(result.current.result).not.toBeNull();

    act(() => result.current.goBack());
    expect(result.current.result).toBeNull();
    expect(result.current.currentNodeId).toBe('q2');
  });

  it('goBack does nothing at root', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.goBack());
    expect(result.current.currentNodeId).toBe('q1');
    expect(result.current.decisions).toHaveLength(0);
  });

  it('reset returns to initial state', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));
    act(() => result.current.selectOption('good'));

    act(() => result.current.reset());
    expect(result.current.currentNodeId).toBe('q1');
    expect(result.current.decisions).toHaveLength(0);
    expect(result.current.result).toBeNull();
  });

  it('saves completed session to history', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));
    act(() => result.current.selectOption('good'));

    expect(result.current.history).toHaveLength(1);
    expect(result.current.history[0].result?.type).toBe('go');
  });

  it('clearHistory empties history', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('yes'));
    act(() => result.current.selectOption('good'));
    expect(result.current.history).toHaveLength(1);

    act(() => result.current.clearHistory());
    expect(result.current.history).toHaveLength(0);
  });

  it('calculates progress correctly', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    expect(result.current.progress).toBe(0);

    act(() => result.current.selectOption('yes'));
    expect(result.current.progress).toBe(10); // 1/10 * 100

    act(() => result.current.selectOption('good'));
    expect(result.current.progress).toBe(20); // 2/10 * 100
  });

  it('ignores invalid option values', () => {
    const { result } = renderHook(() => useDecisionTree(miniTree));

    act(() => result.current.selectOption('nonexistent'));

    expect(result.current.currentNodeId).toBe('q1');
    expect(result.current.decisions).toHaveLength(0);
  });
});
