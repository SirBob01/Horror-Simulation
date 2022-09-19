import { randrange, Vec2D } from 'dynamojs-engine';
import { Particle } from './Particle';

/**
 * Persistent blood particle effects
 */
class Blood extends Particle {
  private vel: Vec2D;
  private life: number;
  private speed: number;

  /**
   * Create a new blood particle
   *
   * @param x     X-coordinate position
   * @param y     Y-coordinate position
   * @param dx    X-direction component
   * @param dy    Y-direction component
   */
  constructor(x: number, y: number, dx: number, dy: number) {
    super('blood', x, y, 10, 10, true);

    // TODO: Depending on the velocity, it will determine the shape of the splash
    // Faster velocity means the blood forms an elongated streak
    this.speed = randrange(0.3, 0.5);
    this.vel = new Vec2D(dx, dy).scale(this.speed);

    this.life = randrange(15, 200);
  }

  update(dt: number) {
    this.life -= dt;
    if (this.life > 0) {
      // Gravity simulation
      this.vel.y += 0.001 * dt;

      this.center.x += this.vel.x * dt;
      this.center.y += this.vel.y * dt;
    } else {
      // Squash the x-dimension to make it look like it's dripping
      if (Math.random() < 0.5) {
        this.dim.x /= 2;
      }
      this.kill();
    }
  }
}

export { Blood };
