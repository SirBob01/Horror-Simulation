import { Color, Vec2D } from 'dynamojs-engine';
import { shootSound, shootClickSound, reloadSound } from '../Assets';
import { Bullet } from './Bullet';
import { Entity } from './Entity';
import { Flashlight } from './Flashlight';
import { Light } from '../World';
import { Syncable, Controllable, InputEvent } from './Interfaces';
import { HumanEntitySocketData } from '../Network';

/**
 * Human callback methods
 */
interface HumanCallbacks {
  /**
   * Callback when the human reloads
   */
  onReload(): void;

  /**
   * Callback when the human shoots
   */
  onShoot(): void;
}

/**
 * Human character
 */
class Human extends Entity implements Controllable, Syncable {
  speed: number;

  maxHealth: number;
  health: number;

  maxAmmo: number;
  ammo: number;
  ammoInventory: number;

  reloading: boolean;
  maxReloadTimer: number;
  reloadTimer: number;

  maxShootTimer;
  shootTimer;

  muzzleFlash: Light;
  muzzleTimer: number;

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

    this.maxHealth = 3;
    this.health = 3;

    this.maxAmmo = 8;
    this.ammo = 8;
    this.ammoInventory = 24;

    this.reloading = false;
    this.maxReloadTimer = 3000;
    this.reloadTimer = 0;

    this.muzzleFlash = new Light(
      this.center.x,
      this.center.y,
      300,
      new Color(255, 200, 100),
      new Vec2D(1, 0),
      Math.PI
    );
    this.muzzleTimer = 0;

    this.maxShootTimer = 500;
    this.shootTimer = 0;

    this.flashlight = new Flashlight(this);

    this.callbacks = {
      onReload: () => {},
      onShoot: () => {},
    };
  }

  /**
   * Handle input events
   *
   * @param event
   */
  handleInput(event: InputEvent): void {
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
    this.speed = 0.1 - 0.025 * (this.maxHealth - this.health);

    // Kill the human when 0 health
    if (this.health <= 0) {
      this.kill();
    }

    // Handle shooting
    if (this.shootTimer <= 0) {
      this.shootTimer = 0;
    } else {
      this.shootTimer -= dt;
    }

    // Handle reloading
    if (this.reloading) {
      this.reloadTimer += dt;
      if (this.reloadTimer >= this.maxReloadTimer) {
        let bulletCount = this.maxAmmo - this.ammo;
        if (this.ammoInventory < bulletCount) {
          bulletCount = this.ammoInventory;
        }
        this.ammoInventory -= bulletCount;
        this.ammo += bulletCount;
        this.reloadTimer = 0;
        this.reloading = false;
        this.callbacks.onReload();
      }
    }

    // Update flashlight
    this.flashlight.update(dt);
    this.output.lights.push(this.flashlight.core, this.flashlight.cone);

    // Muzzle flash effect
    if (this.muzzleTimer > 0) {
      this.muzzleTimer -= dt;
      this.muzzleFlash.center = this.center;
      this.output.lights.push(this.muzzleFlash);
    }
  }

  /**
   * Test if the human can shoot
   */
  canShoot() {
    return !this.reloading && this.shootTimer === 0;
  }

  /**
   * Shoot the gun
   */
  shoot() {
    if (!this.canShoot()) {
      return;
    }
    this.callbacks.onShoot();
    if (this.ammo > 0) {
      const dir = this.dir.unit();
      this.output.entities.push(
        new Bullet(this.center.x, this.center.y, dir.x, dir.y, this)
      );
      this.output.sounds.push({
        sound: shootSound,
        position: this.center,
        volume: 0.25,
      });
      this.muzzleTimer = 50;
      this.ammo--;
    } else {
      this.output.sounds.push({
        sound: shootClickSound,
        position: this.center,
        volume: 0.05,
      });
    }
    this.shootTimer = this.maxShootTimer;
  }

  /**
   * Reload the gun
   */
  reload() {
    if (!this.reloading && this.ammoInventory > 0 && this.ammo < this.maxAmmo) {
      this.output.sounds.push({
        sound: reloadSound,
        position: this.center,
        volume: 0.05,
      });
      this.reloading = true;
    }
  }

  /**
   * Get the data that will be transmitted via socket
   */
  getSocketData() {
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
  setSocketData(data: HumanEntitySocketData) {
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

export { Human };
