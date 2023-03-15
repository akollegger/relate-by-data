import { range } from '@effect/data/ReadonlyArray';
import * as equivalence from '@effect/data/typeclass/Equivalence';
import * as Equal from '@effect/data/Equal';

import * as RoseTree from './rose-tree';

describe('RoseTree', () => {
  it('make()', () => {
    const tree = RoseTree.make('a');
    expect(tree).toBeDefined();
    expect(RoseTree.extract(tree)).toBe('a');
  });
  it('of() is make without children', () => {
    const tree = RoseTree.of('a');
    const madeTree = RoseTree.make('a');
    const equalTrees = RoseTree.getEquivalence(equivalence.string);

    expect(tree).toBeDefined();
    expect(RoseTree.extract(tree)).toBe('a');
    expect(equalTrees(tree, madeTree)).toBeTruthy();
  });
  it('unfold()', () => {
    const f = (n: number) =>
      [`${n}`, n > 1 ? range(1, n - 1) : []] as [string, number[]];
    const tree = RoseTree.unfoldRoseTree<string, number>(5, f);
    console.log(RoseTree.drawRoseTree(tree));
    expect(tree).toBeDefined();
  });
  it('toPairs()', () => {
    const f = (n: number) =>
      [`${n}`, n > 1 ? range(1, n - 1) : []] as [string, number[]];
    const tree = RoseTree.unfoldRoseTree<string, number>(5, f);
    const pairs = RoseTree.toPairs(tree);
    pairs.forEach(pair => console.log(`(${RoseTree.extract(pair[0])})-->(${RoseTree.extract(pair[1])})`))
    // console.log(RoseTree.drawRoseTree(tree));
    expect(tree).toBeDefined();
  });
  it('toPaths()', () => {
    const f = (n: number) =>
      [`${n}`, n > 1 ? range(1, n - 1) : []] as [string, number[]];
    const tree = RoseTree.unfoldRoseTree<string, number>(5, f);
    const treePaths = RoseTree.toPaths(tree);
    treePaths.forEach(treePath => console.log(treePath))
    expect(tree).toBeDefined();
  });

});
