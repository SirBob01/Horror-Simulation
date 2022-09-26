import { BulletEntitySocketData } from '../Network';
import { Id } from '../Utils';
import { Entity } from './Entity';

/**
 * Bullet projectile fired from the player gun
 */
class Bullet extends Entity {
  private source_id: Id;

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
    const bullet_speed = 2;
    this.vel.x = dx * bullet_speed;
    this.vel.y = dy * bullet_speed;
    this.source_id = source.id;
  }

  /**
   * Destroy the bullet on contact with a map tile
   */
  on_collide() {
    this.kill();
  }

  /**
   * Destroy the bullet on contact with another entity with a different
   * alignment (friend or foe)
   *
   * @param entity
   */
  interact_with(entity: Entity) {
    if (entity.align !== this.align) {
      this.kill();
    }
  }

  /**
   * Get the information that will be transmitted via socket
   */
  get_socket_data() {
    return {
      type: 'bullet',
      id: this.id,
      center: this.center,
      dir: this.dir,
      vel: this.vel,
      alive: this.alive,
      source_id: this.source_id,
    } as BulletEntitySocketData;
  }

  /**
   * Update state from socket data
   *
   * @param data
   */
  set_socket_data(data: BulletEntitySocketData) {
    this.center.x = data.center.x;
    this.center.y = data.center.y;

    this.dir.x = data.dir.x;
    this.dir.y = data.dir.y;

    this.vel.x = data.vel.x;
    this.vel.y = data.vel.y;

    this.alive = data.alive;
    this.source_id = data.source_id;
  }
}

export { Bullet };
