import { Color, Vec2D } from 'dynamojs-engine';
import { shoot_sound, shoot_click_sound, reload_sound } from '../../Assets';
import { Bullet } from '../Bullet';
import { Entity } from '../Entity';
import { Flashlight } from './Flashlight';
import { Light } from '../../World';
import { Controllable, InputEvent } from '../Controllable';
import { HumanEntitySocketData } from '../../Network';

/**
 * Human callback methods
 */
interface HumanCallbacks {
  /**
   * Callback when the human reloads
   */
  on_reload(): void;

  /**
   * Callback when the human shoots
   */
  on_shoot(): void;
}

/**
 * Human character
 */
class Human extends Entity implements Controllable {
  speed: number;

  max_health: number;
  health: number;

  max_ammo: number;
  ammo: number;
  ammo_inventory: number;

  reloading: boolean;
  max_reload_timer: number;
  reload_timer: number;

  max_shoot_timer;
  shoot_timer;

  muzzle_flash: Light;
  muzzle_timer: number;

  flashlight: Flashlight;

  callbacks: HumanCallbacks;

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

    this.flashlight = new Flashlight(this);

    this.callbacks = {
      on_reload: () => {},
      on_shoot: () => {},
    };
  }

  /**
   * Handle input events
   *
   * @param event
   */
  handle_input(event: InputEvent): void {
    if (event.type === 'left') {
      if (event.pressed) {
        this.vel.x = -this.speed;
      } else if (this.vel.x < 0) {
        this.vel.x = 0;
      }
    }
    if (event.type === 'right') {
      if (event.pressed) {
        this.vel.x = this.speed;
      } else if (this.vel.x > 0) {
        this.vel.x = 0;
      }
    }
    if (event.type === 'up') {
      if (event.pressed) {
        this.vel.y = -this.speed;
      } else if (this.vel.y < 0) {
        this.vel.y = 0;
      }
    }
    if (event.type === 'down') {
      if (event.pressed) {
        this.vel.y = this.speed;
      } else if (this.vel.y > 0) {
        this.vel.y = 0;
      }
    }
    if (event.type === 'use3' && event.pressed) {
      this.flashlight.switch();
    }
    if (event.type === 'use2') {
      this.reload();
    }
    if (event.type === 'attack') {
      this.shoot();
    }
    if (event.type === 'mouse') {
      this.dir.x = event.position.x - this.center.x;
      this.dir.y = event.position.y - this.center.y;
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
        this.callbacks.on_reload();
      }
    }

    // Update flashlight
    this.flashlight.update(dt);
    this.output.lights.push(this.flashlight.core, this.flashlight.cone);

    // Muzzle flash effect
    if (this.muzzle_timer > 0) {
      this.muzzle_timer -= dt;
      this.muzzle_flash.center = this.center;
      this.output.lights.push(this.muzzle_flash);
    }
  }

  /**
   * Test if the human can shoot
   */
  can_shoot() {
    return !this.reloading && this.shoot_timer === 0;
  }

  /**
   * Shoot the gun
   */
  shoot() {
    if (!this.can_shoot()) {
      return;
    }
    if (this.ammo > 0) {
      const dir = this.dir.unit();
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
    this.callbacks.on_shoot();
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
  get_socket_data() {
    return {
      type: 'human',
      id: this.id,
      center: this.center,
      dir: this.dir,
      vel: this.vel,
      health: this.health,
      ammo: this.ammo,
      flashlight: {
        on: this.flashlight.on,
        battery: this.flashlight.battery,
      },
    } as HumanEntitySocketData;
  }

  /**
   * Update state from socket data
   *
   * @param data
   */
  set_socket_data(data: HumanEntitySocketData) {
    this.center.x = data.center.x;
    this.center.y = data.center.y;

    this.dir.x = data.dir.x;
    this.dir.y = data.dir.y;

    this.vel.x = data.vel.x;
    this.vel.y = data.vel.y;

    this.health = data.health;
    this.ammo = data.ammo;

    this.flashlight.battery = data.flashlight.battery;
    this.flashlight.on = data.flashlight.on;
  }
}

export { Human };
