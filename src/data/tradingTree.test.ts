import { describe, it, expect } from 'vitest';
import { tradingDecisionTree } from './tradingTree';

describe('tradingDecisionTree data integrity', () => {
  const { nodes, results, rootNodeId } = tradingDecisionTree;

  it('has a valid root node', () => {
    expect(nodes[rootNodeId]).toBeDefined();
  });

  it('every node id matches its key', () => {
    for (const [key, node] of Object.entries(nodes)) {
      expect(node.id).toBe(key);
    }
  });

  it('every result id matches its key', () => {
    for (const [key, result] of Object.entries(results)) {
      expect(result.id).toBe(key);
    }
  });

  it('every node has at least one option', () => {
    for (const node of Object.values(nodes)) {
      expect(node.options.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('every option points to a valid node or result', () => {
    for (const node of Object.values(nodes)) {
      for (const option of node.options) {
        if (option.nextNodeId === null) continue;
        const targetExists =
          option.nextNodeId in nodes || option.nextNodeId in results;
        expect(
          targetExists,
          `Node "${node.id}" option "${option.value}" points to unknown target "${option.nextNodeId}"`
        ).toBe(true);
      }
    }
  });

  it('has no orphan nodes (every non-root node is reachable)', () => {
    const reachable = new Set<string>();
    const queue = [rootNodeId];
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      const node = nodes[id];
      if (!node) continue;
      for (const opt of node.options) {
        if (opt.nextNodeId && opt.nextNodeId in nodes) {
          queue.push(opt.nextNodeId);
        }
      }
    }
    for (const nodeId of Object.keys(nodes)) {
      expect(
        reachable.has(nodeId),
        `Node "${nodeId}" is not reachable from root`
      ).toBe(true);
    }
  });

  it('every result is reachable from the tree', () => {
    const reachableResults = new Set<string>();
    for (const node of Object.values(nodes)) {
      for (const opt of node.options) {
        if (opt.nextNodeId && opt.nextNodeId in results) {
          reachableResults.add(opt.nextNodeId);
        }
      }
    }
    for (const resultId of Object.keys(results)) {
      expect(
        reachableResults.has(resultId),
        `Result "${resultId}" is never referenced by any node`
      ).toBe(true);
    }
  });

  it('every result has a valid type', () => {
    const validTypes = ['go', 'caution', 'no-go'];
    for (const result of Object.values(results)) {
      expect(validTypes).toContain(result.type);
    }
  });

  it('every result has at least one suggestion', () => {
    for (const result of Object.values(results)) {
      expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('has at least one go, one caution, and one no-go result', () => {
    const types = Object.values(results).map((r) => r.type);
    expect(types).toContain('go');
    expect(types).toContain('caution');
    expect(types).toContain('no-go');
  });

  it('happy path reaches a GO result', () => {
    const happyPath = [
      'long', 'yes', 'yes', 'yes', 'yes', 'yes', '3+', 'yes', 'clear', 'calm', 'yes',
    ];
    let currentId = rootNodeId;
    for (const value of happyPath) {
      const node = nodes[currentId];
      expect(node, `Expected node "${currentId}" to exist`).toBeDefined();
      const option = node.options.find((o) => o.value === value);
      expect(option, `No option "${value}" in node "${currentId}"`).toBeDefined();
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('go');
  });

  it('counter-trend rejection reaches a NO-GO result', () => {
    let currentId = rootNodeId;
    const path = ['long', 'no', 'no'];
    for (const value of path) {
      const node = nodes[currentId];
      const option = node.options.find((o) => o.value === value);
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('no-go');
  });
});
