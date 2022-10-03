import { AABB } from 'dynamojs-engine';
import { Id, IdGenerator } from '../Utils';
import { Light } from '../World';

/**
 * Particles are objects that are primarily used for visual effects
 *
 * These are non-interactive for performance reasons, as there can be thousands of them
 * instantiated at once
 *
 * When a particle is marked as persistent, the renderer will "paint" it onto a particle mask
 * before it is deleted
 */
class Particle extends AABB {
  id: Id;
  name: string;
  persist: boolean;
  alive: boolean;
  lights: Light[];
  children: Particle[];

  /**
   * Create a new particle
   *
   * @param x       X-coordinate
   * @param y       Y-coordinate
   * @param w       Width of particle
   * @param h       Height of particle
   * @param persist Persistence
   */
  constructor(
    name: string,
    x: number,
    y: number,
    w: number,
    h: number,
    persist: boolean
  ) {
    super(x, y, w, h);
    this.id = IdGenerator.generate();
    this.name = name;
    this.persist = persist;
    this.alive = true;
    this.lights = [];
    this.children = [];
  }

  kill() {
    this.alive = false;
  }

  /**
   * Update step (override)
   *
   * @param dt Delta time
   */
  update(dt: number) {
    return;
  }
}

export { Particle };
