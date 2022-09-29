import { AABB, Vec2D } from 'dynamojs-engine';

/**
 * Visual sensor
 */
class FieldOfView extends AABB {
  private radius: number;
  private halfAngle: number;
  private dir: Vec2D;

  /**
   * Construct a new visual sensor
   *
   * @param position    Position of entity
   * @param radius     Maximum distance
   * @param halfAngle Field of view angle
   * @param dir         Look direction
   */
  constructor(position: Vec2D, radius: number, halfAngle: number, dir: Vec2D) {
    super(position.x, position.y, radius * 2, radius * 2);
    this.radius = radius;
    this.halfAngle = halfAngle;
    this.dir = dir;
  }

  /**
   * Test if a world position is within the visibility radius
   *
   * @param target Target position
   */
  private inRange(target: Vec2D) {
    const lengthSq = this.center.sub(target).lengthSq();
    return lengthSq <= Math.pow(this.radius, 2);
  }

  /**
   * Test if a world position is within the visibility cone
   *
   * @param target Target position
   */
  private inCone(target: Vec2D) {
    const baseAngle = Math.atan2(this.dir.y, this.dir.x);
    const arcStart = baseAngle - this.halfAngle;
    const arcStop = baseAngle + this.halfAngle;

    const distance = target.sub(this.center);
    const angle = Math.atan2(distance.y, distance.x);

    if (arcStop > Math.PI) {
      if (angle >= arcStop - 2 * Math.PI && angle <= arcStart) {
        return false;
      }
    } else if (arcStart < -Math.PI) {
      if (angle <= arcStart + 2 * Math.PI && angle >= arcStop) return false;
    } else if (angle <= arcStart || angle >= arcStop) {
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
  private isOccluded(target: Vec2D, map: number[][], tilesize: Vec2D) {
    // Bresenham's algorithm
    const targetUnit = target.copy();
    targetUnit.x = Math.floor(targetUnit.x / tilesize.x);
    targetUnit.y = Math.floor(targetUnit.y / tilesize.y);

    const fromUnit = this.center.copy();
    fromUnit.x = Math.floor(fromUnit.x / tilesize.x);
    fromUnit.y = Math.floor(fromUnit.y / tilesize.y);

    const dx = Math.abs(targetUnit.x - fromUnit.x);
    const sx = fromUnit.x < targetUnit.x ? 1 : -1;
    const dy = -Math.abs(targetUnit.y - fromUnit.y);
    const sy = fromUnit.y < targetUnit.y ? 1 : -1;
    let err = dx + dy;

    // NOTE: Farthest possible distance will be about 10000 tiles
    for (let n = 10000; n > 0; n--) {
      if (map[fromUnit.y][fromUnit.x] === 1) {
        return true;
      }
      if (targetUnit.equals(fromUnit)) {
        break;
      }
      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        fromUnit.x += sx;
      }
      if (e2 <= dx) {
        err += dx;
        fromUnit.y += sy;
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
  isVisible(target: Vec2D, map: number[][], tilesize: Vec2D) {
    if (!this.inRange(target)) {
      return false;
    }
    if (!this.inCone(target)) {
      return false;
    }
    if (this.isOccluded(target, map, tilesize)) {
      return false;
    }
    return true;
  }
}

export { FieldOfView };
