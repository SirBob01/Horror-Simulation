import { AABB } from 'dynamojs-engine';

/**
 * Quadtree implementation
 */
class Quadtree extends AABB {
  private children: Quadtree[];
  private container: AABB[];
  private level: number;

  /**
   *
   * @param level Maximum height of the quadtree
   * @param w     Width of this quadtree
   * @param h     Height of this quadtree
   * @param x     World x-coordinate of the quadtree center
   * @param y     World y-coordinate of the quadtree center
   */
  constructor(level: number, w: number, h: number, x = w / 2, y = h / 2) {
    super(x, y, w, h);
    this.children = [];
    this.container = [];
    this.level = level;
  }

  /**
   * Generate child nodes
   */
  private generate_chilren() {
    const level = this.level - 1;
    const hd = this.dim.scale(0.5);

    // Top-left
    this.children.push(
      new Quadtree(
        level,
        hd.x,
        hd.y,
        this.center.x - hd.x / 2,
        this.center.y - hd.y / 2
      )
    );
    // Bottom-left
    this.children.push(
      new Quadtree(
        level,
        hd.x,
        hd.y,
        this.center.x - hd.x / 2,
        this.center.y + hd.y / 2
      )
    );
    // Top-right
    this.children.push(
      new Quadtree(
        level,
        hd.x,
        hd.y,
        this.center.x + hd.x / 2,
        this.center.y - hd.y / 2
      )
    );
    // Bottom-right
    this.children.push(
      new Quadtree(
        level,
        hd.x,
        hd.y,
        this.center.x + hd.x / 2,
        this.center.y + hd.y / 2
      )
    );
  }

  /**
   * Insert a new object into the quadtree
   *
   * @param object Object to be inserted
   */
  insert(object: AABB) {
    // Leaf node
    if (this.level == 0) {
      this.container.push(object);
    } else {
      if (this.children.length === 0) {
        this.generate_chilren();
      }
      for (const child of this.children) {
        if (child.is_colliding(object)) {
          child.insert(object);
        }
      }
    }
  }

  /**
   * Get all neighboring objects to this one
   *
   * @param object Object to be queried
   */
  get_neighbors(object: AABB) {
    if (this.level <= 0) {
      return this.container;
    }

    const set = new Set<string>();
    const neighbors: AABB[] = [];
    for (const child of this.children) {
      if (child.is_colliding(object)) {
        for (const neighbor of child.get_neighbors(object)) {
          const key = neighbor.center.to_string() + neighbor.dim.to_string();
          if (set.has(key)) {
            continue;
          }
          set.add(key);
          neighbors.push(neighbor);
        }
      }
    }
    return neighbors;
  }
}

export { Quadtree };
