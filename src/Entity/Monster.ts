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
        this.vel.x = -this.current_speed;
      } else if (this.vel.x < 0) {
        this.vel.x = 0;
      }
    }
    if (event.type === 'right') {
      if (event.pressed) {
        this.vel.x = this.current_speed;
      } else if (this.vel.x > 0) {
        this.vel.x = 0;
      }
    }
    if (event.type === 'up') {
      if (event.pressed) {
        this.vel.y = -this.current_speed;
      } else if (this.vel.y < 0) {
        this.vel.y = 0;
      }
    }
    if (event.type === 'down') {
      if (event.pressed) {
        this.vel.y = this.current_speed;
      } else if (this.vel.y > 0) {
        this.vel.y = 0;
      }
    }
  }

  /**
   * Follow the path specified by `current_path` member
   */
  private follow_path() {
    // Semi-realistic steering thank god
    if (this.current_path.length > 0) {
      const collider = this.z_collider();
      const next = this.current_path[0].scale(16).add(collider.dim.scale(0.5));

      const dir = next.sub(collider.center);
      const length = dir.length();

      if (length > 10) {
        const desired = dir.scale(this.max_speed / length);
        const accel = desired.sub(this.vel).scale(1 / 20);
        this.vel.x = Math.min(this.vel.x + accel.x, this.max_speed);
        this.vel.y = Math.min(this.vel.y + accel.y, this.max_speed);
        this.dir = dir;
      } else {
        this.current_path.shift();
      }
    } else {
      this.vel.x = 0;
      this.vel.y = 0;
    }
  }

  /**
   * Randomly visit a set of waypoints to patrol the area
   *
   * @param waypoints
   */
  private patrol(waypoints: Vec2D[]) {
    const shuffle = (arr: any[]) => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
      }
    };
    if (this.patrol_points.length === 0) {
      this.patrol_points = waypoints.slice();
      shuffle(this.patrol_points);
    } else if (this.current_path.length === 0) {
      // Wait a bit before going to next path
      const first_waypoint = this.patrol_points.shift();
      if (first_waypoint) {
        this.generate_path(first_waypoint.scale(16).add(new Vec2D(8, 8)));
      }
    }
  }

  /**
   * Main update function
   *
   * @param dt Delta time
   */
  update(dt: number) {
    this.patrol(this.input.waypoints);
    this.follow_path();
  }

  /**
   * Interact with another entity
   *
   * @param entity
   */
  interact_with(entity: Entity) {
    if (entity instanceof Bullet) {
      const dir = entity.vel.unit();
      const angle = Math.atan2(dir.y, dir.x);
      for (let i = 0; i < 50; i++) {
        const d = randrange(-0.3, 0.3);
        this.output.particles.push(
          new Blood(
            entity.center.x,
            entity.center.y,
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
      alive: this.alive,
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

    this.alive = data.alive;
  }
}

export { Monster };
