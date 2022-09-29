import { BulletEntitySocketData } from '../Network';
import { Id } from '../Utils';
import { Entity } from './Entity';

/**
 * Bullet projectile fired from the player gun
 */
class Bullet extends Entity {
  private sourceId: Id;

  /**
   * Create a new bullet
   *
   * @param x      X-coordinate position
   * @param y      Y-coordinate position
   * @param dx     X-direction
   * @param dy     Y-direction
   * @param source Source entity (who fired the gun?)
   */
  constructor(x: number, y: number, dx: number, dy: number, source: Entity) {
    super('friendly', x, y, 5, 5, 'Blocker');
    this.dir.x = dx;
    this.dir.y = dy;
    this.sourceId = source.id;
  }

  /**
   * Destroy the bullet on contact with a map tile
   */
  onCollide() {
    this.kill();
  }

  /**
   * Update velocity based on current direction
   *
   * @param dt Delta time
   */
  update(dt: number) {
    const bulletSpeed = 2;
    this.vel = this.dir.scale(bulletSpeed);
  }

  /**
   * Destroy the bullet on contact with another entity with a different
   * alignment (friend or foe)
   *
   * @param entity
   */
  interactWith(entity: Entity) {
    if (entity.align !== this.align) {
      this.kill();
    }
  }

  /**
   * Get the information that will be transmitted via socket
   */
  getSocketData() {
    return {
      type: 'bullet',
      id: this.id,
      center: this.center,
      dir: this.dir,
      vel: this.vel,
      sourceId: this.sourceId,
    } as BulletEntitySocketData;
  }

  /**
   * Update state from socket data
   *
   * @param data
   */
  setSocketData(data: BulletEntitySocketData) {
    this.center.x = data.center.x;
    this.center.y = data.center.y;

    this.dir.x = data.dir.x;
    this.dir.y = data.dir.y;

    this.vel.x = data.vel.x;
    this.vel.y = data.vel.y;

    this.sourceId = data.sourceId;
  }
}

export { Bullet };
