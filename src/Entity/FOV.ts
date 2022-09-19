import { AABB, Vec2D } from 'dynamojs-engine';

/**
 * Visual sensor
 */
class FieldOfView extends AABB {
  private radius: number;
  private half_angle: number;
  private dir: Vec2D;

  /**
   * Construct a new visual sensor
   *
   * @param position    Position of entity
   * @param radius     Maximum distance
   * @param half_angle Field of view angle
   * @param dir         Look direction
   */
  constructor(position: Vec2D, radius: number, half_angle: number, dir: Vec2D) {
    super(position.x, position.y, radius * 2, radius * 2);
    this.radius = radius;
    this.half_angle = half_angle;
    this.dir = dir;
  }

  /**
   * Test if a world position is within the visibility radius
   *
   * @param target Target position
   */
  private in_range(target: Vec2D) {
    const length_sq = this.center.sub(target).length_sq();
    return length_sq <= Math.pow(this.radius, 2);
  }

  /**
   * Test if a world position is within the visibility cone
   *
   * @param target Target position
   */
  private in_cone(target: Vec2D) {
    const base_angle = Math.atan2(this.dir.y, this.dir.x);
    const arc_start = base_angle - this.half_angle;
    const arc_stop = base_angle + this.half_angle;

    const distance = target.sub(this.center);
    const angle = Math.atan2(distance.y, distance.x);

    if (arc_stop > Math.PI) {
      if (angle >= arc_stop - 2 * Math.PI && angle <= arc_start) {
        return false;
      }
    } else if (arc_start < -Math.PI) {
      if (angle <= arc_start + 2 * Math.PI && angle >= arc_stop) return false;
    } else if (angle <= arc_start || angle >= arc_stop) {
      return false;
    }
    return true;
  }

  /**
   * Test if a target is occluded by the world map
   *
   * @param target   Target position
   * @param map Occlusion map
   * @param tilesize Tile dimensions
   */
  private is_occluded(target: Vec2D, map: number[][], tilesize: Vec2D) {
    // Bresenham's algorithm
    const target_unit = target.copy();
    target_unit.x = Math.floor(target_unit.x / tilesize.x);
    target_unit.y = Math.floor(target_unit.y / tilesize.y);

    const from_unit = this.center.copy();
    from_unit.x = Math.floor(from_unit.x / tilesize.x);
    from_unit.y = Math.floor(from_unit.y / tilesize.y);

    const dx = Math.abs(target_unit.x - from_unit.x);
    const sx = from_unit.x < target_unit.x ? 1 : -1;
    const dy = -Math.abs(target_unit.y - from_unit.y);
    const sy = from_unit.y < target_unit.y ? 1 : -1;
    let err = dx + dy;

    // NOTE: Farthest possible distance will be about 10000 tiles
    for (let n = 10000; n > 0; n--) {
      if (map[from_unit.y][from_unit.x] === 1) {
        return true;
      }
      if (target_unit.equals(from_unit)) {
        break;
      }
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        from_unit.x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        from_unit.y += sy;
      }
    }
    return false;
  }

  /**
   * Test if a target position is visible from this FOV
   *
   * @param target   Target position
   * @param map Occlusion map
   * @param tilesize Tile dimensions
   */
  is_visible(target: Vec2D, map: number[][], tilesize: Vec2D) {
    if (!this.in_range(target)) {
      return false;
    }
    if (!this.in_cone(target)) {
      return false;
    }
    if (this.is_occluded(target, map, tilesize)) {
      return false;
    }
    return true;
  }
}

export { FieldOfView };
