import { Color, Vec2D } from 'dynamojs-engine';
import { shoot_sound, shoot_click_sound, reload_sound } from '../../Assets';
import { Bullet } from '../Bullet';
import { Entity } from '../Entity';
import { Flashlight } from './Flashlight';
import { Light } from '../../World';
import { Controllable, InputEvent } from '../Controllable';
import { EntitySocketData } from '../../Network';

/**
 * Human character
 */
class Human extends Entity implements Controllable {
  protected speed: number;

  protected max_health: number;
  protected health: number;

  protected max_ammo: number;
  protected ammo: number;
  protected ammo_inventory: number;

  protected reloading: boolean;
  protected max_reload_timer: number;
  protected reload_timer: number;

  protected max_shoot_timer;
  protected shoot_timer;

  protected muzzle_flash: Light;
  protected muzzle_timer: number;

  protected flashlight: Flashlight;

  /**
   * Create a new human entity
   *
   * @param x World x-position
   * @param y World y-position
   */
  constructor(x: number, y: number) {
    super('friendly', x, y, 24, 48, 'Collider');
    this.speed = 0.1;

    this.max_health = 3;
    this.health = 3;

    this.max_ammo = 8;
    this.ammo = 8;
    this.ammo_inventory = 24;

    this.reloading = false;
    this.max_reload_timer = 3000;
    this.reload_timer = 0;

    this.muzzle_flash = new Light(
      this.center.x,
      this.center.y,
      300,
      new Color(255, 200, 100),
      new Vec2D(1, 0),
      Math.PI
    );
    this.muzzle_timer = 0;

    this.max_shoot_timer = 500;
    this.shoot_timer = 0;

    this.flashlight = new Flashlight();
  }

  /**
   * Handle input events
   *
   * @param event
   */
  handle_input(event: InputEvent): void {
    // Flashlight cone determines the player's direction
    const flashcone = this.flashlight.get_cone();

    if (event.type === 'left' && event.pressed) {
      if (event.pressed) {
        this.vel.x = -this.speed;
      } else if (this.vel.x < 0) {
        this.vel.x = 0;
      }
    }
    if (event.type === 'right' && event.pressed) {
      if (event.pressed) {
        this.vel.x = this.speed;
      } else if (this.vel.x > 0) {
        this.vel.x = 0;
      }
    }
    if (event.type === 'up' && event.pressed) {
      if (event.pressed) {
        this.vel.y = -this.speed;
      } else if (this.vel.y < 0) {
        this.vel.y = 0;
      }
    }
    if (event.type === 'down' && event.pressed) {
      if (event.pressed) {
        this.vel.y = this.speed;
      } else if (this.vel.y > 0) {
        this.vel.y = 0;
      }
    }
    if (event.type === 'use3' && event.pressed) {
      this.flashlight.switch();
    }
    if (event.type === 'attack') {
      this.shoot(flashcone.dir);
    }
    if (event.type === 'mouse') {
      flashcone.dir = this.center.sub(event.position);
    }
  }

  /**
   * Main update tick
   *
   * @param dt Delta time
   */
  update(dt: number) {
    // Adjust movement speed depending on health
    this.speed = 0.1 - 0.025 * (this.max_health - this.health);

    // Kill the human when 0 health
    if (this.health <= 0) {
      this.kill();
    }

    // Handle shooting
    if (this.shoot_timer <= 0) {
      this.shoot_timer = 0;
    } else {
      this.shoot_timer -= dt;
    }

    // Handle reloading
    if (this.reloading) {
      this.reload_timer += dt;
      if (this.reload_timer >= this.max_reload_timer) {
        let bullet_count = this.max_ammo - this.ammo;
        if (this.ammo_inventory < bullet_count) {
          bullet_count = this.ammo_inventory;
        }
        this.ammo_inventory -= bullet_count;
        this.ammo += bullet_count;
        this.reload_timer = 0;
        this.reloading = false;
      }
    }

    // Update flashlight
    this.flashlight.update(dt, this.center);
    this.output.lights.push(
      this.flashlight.get_core(),
      this.flashlight.get_cone()
    );

    // Muzzle flash effect
    if (this.muzzle_timer > 0) {
      this.muzzle_timer -= dt;
      this.muzzle_flash.center = this.center;
      this.output.lights.push(this.muzzle_flash);
    }
  }

  /**
   * Get the ammo count of the human
   */
  get_ammo() {
    return this.ammo;
  }

  /**
   * Get the ammo count in the human's inventory
   */
  get_ammo_inventory() {
    return this.ammo_inventory;
  }

  /**
   * Test if human is reloading
   */
  is_reloading() {
    return this.reloading;
  }

  /**
   * Test if the human can shoot
   */
  can_shoot() {
    return !this.reloading && this.shoot_timer === 0;
  }

  /**
   * Shoot the gun
   *
   * @param dir The direction of the shot
   */
  shoot(dir: Vec2D) {
    if (!this.can_shoot()) {
      return;
    }
    if (this.ammo > 0) {
      this.output.entities.push(
        new Bullet(this.center.x, this.center.y, dir.x, dir.y, this)
      );
      this.output.sounds.push({
        sound: shoot_sound,
        position: this.center,
        volume: 0.25,
      });
      this.muzzle_timer = 50;
      this.ammo--;
    } else {
      this.output.sounds.push({
        sound: shoot_click_sound,
        position: this.center,
        volume: 0.05,
      });
    }
    this.shoot_timer = this.max_shoot_timer;
  }

  /**
   * Reload the gun
   */
  reload() {
    if (
      !this.reloading &&
      this.ammo_inventory > 0 &&
      this.ammo < this.max_ammo
    ) {
      this.output.sounds.push({
        sound: reload_sound,
        position: this.center,
        volume: 0.05,
      });
      this.reloading = true;
    }
  }

  /**
   * Get the data that will be transmitted via socket
   */
  get_socket_data(): EntitySocketData {
    return {
      id: this.id,
      center: this.center,
      size: this.dim,
      dir: this.dir,
      vel: this.vel,
      accel: this.accel,
      alive: this.alive,
    };
  }
}

export { Human };
