import { randrange, Vec2D } from 'dynamojs-engine';
import { hitSounds } from '../Assets';
import { MonsterEntitySocketData } from '../Network';
import { Entity } from './Entity';
import { Blood } from '../Particle';
import { Bullet } from './Bullet';
import { Syncable, Controllable, InputEvent } from './Interfaces';

/**
 * Monster entity
 */
class Monster extends Entity implements Controllable, Syncable {
  targetVel: Vec2D;
  private walkSpeed: number;
  private chaseSpeed: number;
  private maxSpeed: number;
  private currentSpeed: number;
  private heading: number;
  private patrolPoints: Vec2D[];

  /**
   * Create a new monster
   *
   * @param x World x-coordinate
   * @param y World y-coordinate
   */
  constructor(x: number, y: number) {
    super('hostile', x, y, 36, 72, 'Collider', 250, Math.PI / 4, 250);
    this.targetVel = new Vec2D(0, 0);

    this.walkSpeed = 0.08;
    this.chaseSpeed = 0.15;
    this.maxSpeed = this.chaseSpeed;
    this.currentSpeed = 0;

    this.heading = 0;
    this.patrolPoints = [];
  }

  /**
   * Handle input events
   *
   * @param event
   */
  handleInput(event: InputEvent) {
    if (event.type === 'left') {
      if (event.pressed) {
        this.targetVel.x = -this.maxSpeed;
      } else if (this.targetVel.x < 0) {
        this.targetVel.x = 0;
      }
    }
    if (event.type === 'right') {
      if (event.pressed) {
        this.targetVel.x = this.maxSpeed;
      } else if (this.targetVel.x > 0) {
        this.targetVel.x = 0;
      }
    }
    if (event.type === 'up') {
      if (event.pressed) {
        this.targetVel.y = -this.maxSpeed;
      } else if (this.targetVel.y < 0) {
        this.targetVel.y = 0;
      }
    }
    if (event.type === 'down') {
      if (event.pressed) {
        this.targetVel.y = this.maxSpeed;
      } else if (this.targetVel.y > 0) {
        this.targetVel.y = 0;
      }
    }
    if (event.type === 'mouse') {
      this.dir.x = event.position.x - this.center.x;
      this.dir.y = event.position.y - this.center.y;
    }
  }

  /**
   * Main update function
   *
   * @param dt Delta time
   */
  update(dt: number) {
    this.accel = this.targetVel.sub(this.vel).scale(1 / 20);
    this.vel.x = Math.min(this.vel.x, this.maxSpeed);
    this.vel.y = Math.min(this.vel.y, this.maxSpeed);
  }

  /**
   * Interact with another entity
   *
   * @param entity
   */
  interactWith(entity: Entity) {
    if (entity instanceof Bullet) {
      const { center, dir } = entity;
      const angle = Math.atan2(dir.y, dir.x);
      for (let i = 0; i < 50; i++) {
        const d = randrange(-0.3, 0.3);
        this.output.particles.push(
          new Blood(
            center.x,
            center.y,
            Math.cos(angle + d),
            Math.sin(angle + d)
          )
        );
      }
      this.output.sounds.push({
        volume: 0.15,
        position: this.center,
        sound: hitSounds[Math.floor(Math.random() * hitSounds.length)],
      });
    }
  }

  /**
   * Get the information that will be transmitted via socket
   */
  getSocketData() {
    return {
      type: 'monster',
      id: this.id,
      center: this.center,
      dir: this.dir,
      vel: this.vel,
    } as MonsterEntitySocketData;
  }

  /**
   * Update state from socket data
   *
   * @param data
   */
  setSocketData(data: MonsterEntitySocketData) {
    this.center.x = data.center.x;
    this.center.y = data.center.y;

    this.dir.x = data.dir.x;
    this.dir.y = data.dir.y;

    this.vel.x = data.vel.x;
    this.vel.y = data.vel.y;
  }

  /**
   * Convert to controllable instance
   */
  asControllable(): this & Controllable {
    return this;
  }

  /**
   * Convert to syncable instance
   */
  asSyncable(): this & Syncable {
    return this;
  }
}

export { Monster };
