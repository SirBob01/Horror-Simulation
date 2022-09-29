import { Vec2D } from 'dynamojs-engine';

/**
 * Heap datastructure implementation
 *
 * poptop()  -- O(logn)
 * insert()  -- O(logn)
 */
class Heap<T> {
  private values: T[];
  private comparator: (a: T, b: T) => boolean;

  /**
   * Create a new heap with a comparator function
   *
   * @param comparator
   */
  constructor(comparator: (a: T, b: T) => boolean) {
    this.values = [];
    this.comparator = comparator;
  }

  /**
   * Sift-up an element through the heap
   *
   * @param i
   */
  siftup(i: number) {
    let parent = Math.floor((i - 1) / 2);
    while (
      parent >= 0 &&
      this.comparator(this.values[i], this.values[parent])
    ) {
      const b = this.values[i];
      this.values[i] = this.values[parent];
      this.values[parent] = b;

      i = parent;
      parent = Math.floor((i - 1) / 2);
    }
  }

  /**
   * Heapify the array
   */
  heapify() {
    for (let i = 1; i < this.values.length; i++) {
      this.siftup(i);
    }
  }

  /**
   * Pop the head of the heap, maintaining the heap invariant
   */
  poptop() {
    const res = this.values.shift();
    this.heapify();
    return res;
  }

  /**
   * Insert an item into the heap, maintaining the heap invariant
   *
   * @param val
   */
  insert(val: T) {
    this.values.push(val);
    this.siftup(this.values.length - 1);
  }

  /**
   * Get the size of the heap
   */
  size() {
    return this.values.length;
  }

  /**
   * Return the first item in the heap satisfying the equality test fn
   *
   * @param fn Equality test
   */
  find(fn: (val: T) => boolean) {
    return this.values.find(fn);
  }
}

/**
 * Euclidean distance heuristic
 *
 * @param a Start position
 * @param b End position
 */
function heuristic(a: Vec2D, b: Vec2D) {
  return a.sub(b).length();
}

/**
 * Get neighboring points
 *
 * @param p Point
 */
function getNeighbors(p: Vec2D) {
  return [
    new Vec2D(p.x - 1, p.y),
    new Vec2D(p.x + 1, p.y),
    new Vec2D(p.x, p.y - 1),
    new Vec2D(p.x, p.y + 1),

    new Vec2D(p.x - 1, p.y - 1),
    new Vec2D(p.x - 1, p.y + 1),
    new Vec2D(p.x + 1, p.y - 1),
    new Vec2D(p.x + 1, p.y + 1),
  ];
}

/**
 * Reconstruct path
 *
 * @param {Map<string, string>} from
 * @param last
 */
function reconstructPath(from: Map<string, string>, last: string) {
  const path = [];
  let current: string | undefined = last;
  while (current) {
    path.unshift(Vec2D.fromString(current));
    current = from.get(current);
  }
  return path;
}

/**
 * Test if a node is within the bounds of the navigation mesh
 *
 * @param navmesh
 * @param node
 */
function inBounds(navmesh: number[][], node: Vec2D) {
  if (
    node.x < 0 ||
    node.x >= navmesh[0].length ||
    node.y < 0 ||
    node.y >= navmesh.length
  ) {
    return false;
  }
  return true;
}

/**
 * Implementation of the A* algorithm
 *
 * @param navmesh
 * @param startNode
 * @param goalNode
 */
function shortestPath(navmesh: number[][], startNode: Vec2D, goalNode: Vec2D) {
  // Round off the values
  const start = new Vec2D(Math.round(startNode.x), Math.round(startNode.y));
  const goal = new Vec2D(Math.round(goalNode.x), Math.round(goalNode.y));
  const gScores = new Map<string, number>();
  const fScores = new Map<string, number>();

  gScores.set(start.toString(), 0);
  fScores.set(start.toString(), heuristic(start, goal));

  const from = new Map<string, string>();
  const explore = new Heap<Vec2D>((a, b) => {
    const aF = fScores.get(a.toString());
    const bF = fScores.get(b.toString());
    if (aF === undefined || bF === undefined) {
      return false;
    }
    return aF < bF;
  });
  explore.insert(start);

  while (explore.size() > 0) {
    // Get the most promising node so far
    const current = explore.poptop();
    if (current === undefined) {
      continue;
    }

    const currentStr = current.toString();
    const g = gScores.get(current.toString());
    if (g === undefined) {
      continue;
    }

    // Goal test
    if (current.equals(goal)) {
      return reconstructPath(from, currentStr);
    }

    // Expand children
    for (const adj of getNeighbors(current)) {
      if (!inBounds(navmesh, adj)) {
        continue;
      }
      if (navmesh[adj.y][adj.x]) {
        continue;
      }

      // Update costs
      const adjStr = adj.toString();
      const newAdjG = g + heuristic(current, adj);
      const oldAdjG = gScores.get(adjStr);
      if (oldAdjG === undefined || newAdjG < oldAdjG) {
        from.set(adjStr, currentStr);
        gScores.set(adjStr, newAdjG);
        fScores.set(adjStr, newAdjG + heuristic(adj, goal));

        // Add node to the open set
        const match = explore.find((val) => val.equals(adj));
        if (match === undefined) {
          explore.insert(adj);
        }
      }
    }
  }
  return [];
}

export { shortestPath };
