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
function get_neighbors(p: Vec2D) {
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
function reconstruct_path(from: Map<string, string>, last: string) {
  const path = [];
  let current: string | undefined = last;
  while (current) {
    path.unshift(Vec2D.from_string(current));
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
function in_bounds(navmesh: number[][], node: Vec2D) {
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
 * @param start_node
 * @param goal_node
 */
function shortest_path(
  navmesh: number[][],
  start_node: Vec2D,
  goal_node: Vec2D
) {
  // Round off the values
  const start = new Vec2D(Math.round(start_node.x), Math.round(start_node.y));
  const goal = new Vec2D(Math.round(goal_node.x), Math.round(goal_node.y));
  const g_scores = new Map<string, number>();
  const f_scores = new Map<string, number>();

  g_scores.set(start.to_string(), 0);
  f_scores.set(start.to_string(), heuristic(start, goal));

  const from = new Map<string, string>();
  const explore = new Heap<Vec2D>((a, b) => {
    const a_f = f_scores.get(a.to_string());
    const b_f = f_scores.get(b.to_string());
    if (a_f === undefined || b_f === undefined) {
      return false;
    }
    return a_f < b_f;
  });
  explore.insert(start);

  while (explore.size() > 0) {
    // Get the most promising node so far
    const current = explore.poptop();
    if (current === undefined) {
      continue;
    }

    const current_str = current.to_string();
    const g = g_scores.get(current.to_string());
    if (g === undefined) {
      continue;
    }

    // Goal test
    if (current.equals(goal)) {
      return reconstruct_path(from, current_str);
    }

    // Expand children
    for (const adj of get_neighbors(current)) {
      if (!in_bounds(navmesh, adj)) {
        continue;
      }
      if (navmesh[adj.y][adj.x]) {
        continue;
      }

      // Update costs
      const adj_str = adj.to_string();
      const new_adj_g = g + heuristic(current, adj);
      const old_adj_g = g_scores.get(adj_str);
      if (old_adj_g === undefined || new_adj_g < old_adj_g) {
        from.set(adj_str, current_str);
        g_scores.set(adj_str, new_adj_g);
        f_scores.set(adj_str, new_adj_g + heuristic(adj, goal));

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

export { shortest_path };
