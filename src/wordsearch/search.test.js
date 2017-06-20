import { connectGrid, findMatches, Directions, CharNode, ArrayGrid } from './search';
import { rows, words } from './data/states';

describe('ArrayGrid', () => {
  let grid;

  beforeEach(() => {
    const nodeRows = rows.map(row =>
      row
        .split("")
        .map(khar => new CharNode(khar))
    );
    expect(nodeRows).toHaveLength(rows.length);

    grid = ArrayGrid.fromArray(nodeRows);
  });

  it('should be the correct shape', () => {
    expect(grid.rows()).toBe(rows.length);
    expect(grid.columns()).toBe(rows[0].length);
  });

  it('should have its origin at the top left', () => {
    // check four corners
    expect(grid.get(0, 0).khar).toBe('T');
    expect(grid.get(0, 32).khar).toBe('V');
    expect(grid.get(32, 0).khar).toBe('S');
    expect(grid.get(32, 32).khar).toBe('Z');
  });
});

it('should find all the words in the puzzle', () => {
  const nodeRows = rows.map(row =>
    row
      .split("")
      .map(khar => new CharNode(khar))
  );

  const grid = ArrayGrid.fromArray(nodeRows);
  const nodes = connectGrid(grid);
  expect(nodes).toHaveLength(grid.rows() * grid.columns());

  const matches = findMatches(words, nodes, new Set(Object.keys(Directions)));
  expect(Object.keys(matches)).toHaveLength(words.length);
});

