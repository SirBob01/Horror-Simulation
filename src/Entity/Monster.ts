import { randrange, Vec2D } from 'dynamojs-engine';
import { hit_sounds } from '../Assets';
import { MonsterEntitySocketData } from '../Network';
import { Blood } from '../Particle';
import { Bullet } from './Bullet';
import { Controllable, InputEvent } from './Controllable';
import { Entity } from './Entity';

/**
 * Monster entity
 */
class Monster extends Entity implements Controllable {
  target_vel: Vec2D;
  private walk_speed: number;
  private chase_speed: number;
  private max_speed: number;
  private current_speed: number;
  private heading: number;
  private patrol_points: Vec2D[];

  /**
   * Create a new monster
   *
   * @param x World x-coordinate
   * @param y World y-coordinate
   */
  constructor(x: number, y: number) {
    super('hostile', x, y, 36, 72, 'Collider', 250, Math.PI / 4, 250);
    this.target_vel = new Vec2D(0, 0);

    this.walk_speed = 0.08;
    this.chase_speed = 0.09;
    this.max_speed = this.chase_speed;
    this.current_speed = 0;

    this.heading = 0;
    this.patrol_points = [];
  }

  /**
   * Handle input events
   *
   * @param event
   */
  handle_input(event: InputEvent) {
    if (event.type === 'left') {
      if (event.pressed) {
        this.target_vel.x = -this.max_speed;
      } else if (this.target_vel.x < 0) {
        this.target_vel.x = 0;
      }
    }
    if (event.type === 'right') {
      if (event.pressed) {
        this.target_vel.x = this.max_speed;
      } else if (this.target_vel.x > 0) {
        this.target_vel.x = 0;
      }
    }
    if (event.type === 'up') {
      if (event.pressed) {
        this.target_vel.y = -this.max_speed;
      } else if (this.target_vel.y < 0) {
        this.target_vel.y = 0;
      }
    }
    if (event.type === 'down') {
      if (event.pressed) {
        this.target_vel.y = this.max_speed;
      } else if (this.target_vel.y > 0) {
        this.target_vel.y = 0;
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
    const accel = this.target_vel.sub(this.vel).scale(1 / 20);
    this.vel.x = Math.min(this.vel.x + accel.x, this.max_speed);
    this.vel.y = Math.min(this.vel.y + accel.y, this.max_speed);
  }

  /**
   * Interact with another entity
   *
   * @param entity
   */
  interact_with(entity: Entity) {
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
        sound: hit_sounds[Math.floor(Math.random() * hit_sounds.length)],
      });
    }
  }

  /**
   * Get the information that will be transmitted via socket
   */
  get_socket_data() {
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
  set_socket_data(data: MonsterEntitySocketData) {
    this.center.x = data.center.x;
    this.center.y = data.center.y;

    this.dir.x = data.dir.x;
    this.dir.y = data.dir.y;

    this.vel.x = data.vel.x;
    this.vel.y = data.vel.y;
  }
}

export { Monster };
