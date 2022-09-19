import { Entity } from './Entity';

/**
 * Bullet projectile fired from the player gun
 */
class Bullet extends Entity {
  private source: Entity;

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
    super('bullet', 'player', x, y, 5, 5, 'Blocker');
    const bullet_speed = 2;
    this.vel.x = dx * bullet_speed;
    this.vel.y = dy * bullet_speed;
    this.source = source;
  }

  /**
   * Destroy the bullet on contact with a map tile
   */
  on_collide() {
    this.kill();
  }

  /**
   * Destroy the bullet on contact with another entity (that is not the source)
   * @param entity
   */
  interact_with(entity: Entity) {
    if (entity !== this.source) {
      this.kill();
    }
  }
}

export { Bullet };
