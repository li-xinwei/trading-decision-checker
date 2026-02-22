import { describe, it, expect } from 'vitest';
import { tradingDecisionTree } from './tradingTree';

describe('tradingDecisionTree V3 data integrity', () => {
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

  it('every result has suggestions or execution plan', () => {
    for (const result of Object.values(results)) {
      const hasSuggestions = result.suggestions.length > 0;
      const hasExecutionPlan = !!result.executionPlan;
      expect(
        hasSuggestions || hasExecutionPlan,
        `Result "${result.id}" has neither suggestions nor execution plan`
      ).toBe(true);
    }
  });

  it('has at least one go, one caution, and one no-go result', () => {
    const types = Object.values(results).map((r) => r.type);
    expect(types).toContain('go');
    expect(types).toContain('caution');
    expect(types).toContain('no-go');
  });

  it('root node is barbed wire filter with 2 options', () => {
    const root = nodes[rootNodeId];
    expect(root.options.length).toBe(2);
  });

  it('barbed wire YES reaches NO-GO', () => {
    const root = nodes[rootNodeId];
    const option = root.options.find((o) => o.value === 'yes');
    expect(results[option!.nextNodeId!]).toBeDefined();
    expect(results[option!.nextNodeId!].type).toBe('no-go');
  });

  it('setup selection has 7 options', () => {
    expect(nodes['choose_setup'].options.length).toBe(7);
  });

  it('pullback shallow path reaches GO', () => {
    const path = ['no', 'pullback', 'yes', 'twopush', 'yes', 'yes', 'shallow', 'long'];
    let currentId = rootNodeId;
    for (const value of path) {
      const node = nodes[currentId];
      expect(node, `Expected node "${currentId}" to exist`).toBeDefined();
      const option = node.options.find((o) => o.value === value);
      expect(option, `No option "${value}" in node "${currentId}"`).toBeDefined();
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('go');
  });

  it('MTR reversal path reaches GO', () => {
    const path = ['no', 'mtr', 'yes', 'yes', 'spike_channel', 'long'];
    let currentId = rootNodeId;
    for (const value of path) {
      const node = nodes[currentId];
      const option = node.options.find((o) => o.value === value);
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('go');
  });

  it('no trend reaches NO-GO', () => {
    const path = ['no', 'pullback', 'no'];
    let currentId = rootNodeId;
    for (const value of path) {
      const node = nodes[currentId];
      const option = node.options.find((o) => o.value === value);
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('no-go');
  });

  it('struct reversal full path reaches GO', () => {
    const path = ['no', 'struct_reversal', 'yes', 'yes', 'yes', 'long'];
    let currentId = rootNodeId;
    for (const value of path) {
      const node = nodes[currentId];
      const option = node.options.find((o) => o.value === value);
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('go');
  });

  it('range fade BF path reaches GO', () => {
    const path = ['no', 'range_fade', 'yes', 'range', 'yes', 'bf', 'long'];
    let currentId = rootNodeId;
    for (const value of path) {
      const node = nodes[currentId];
      const option = node.options.find((o) => o.value === value);
      currentId = option!.nextNodeId!;
    }
    expect(results[currentId]).toBeDefined();
    expect(results[currentId].type).toBe('go');
  });
});
