import { clamp, Color, Vec2D } from 'dynamojs-engine';
import { Light } from '../../World';
import { Entity } from '../Entity';

/**
 * A flashlight with a limited battery
 */
class Flashlight {
  cone: Light;
  core: Light;
  battery: number;
  on: boolean;
  user: Entity;
  private maxBattery: number;
  private flickerTime: number;
  private color: Color;
  private useRate: number;

  constructor(user: Entity) {
    this.color = new Color(174, 169, 204);
    this.cone = new Light(0, 0, 150, this.color, new Vec2D(1, 0), Math.PI / 6);
    this.core = new Light(0, 0, 50, this.color, new Vec2D(1, 0), Math.PI);
    this.on = true;
    this.user = user;

    this.maxBattery = 100;
    this.battery = this.maxBattery;
    this.useRate = 0.001;

    this.flickerTime = 0;
  }

  /**
   * Toggle between on and off
   */
  switch() {
    this.on = !this.on;
  }

  /**
   * Slowly dim the light as the battery reduces over time
   * As soon as the light hits certain thresholds, it will start flickering
   *
   * @param dt       Delta time
   * @param position Position of the source
   */
  update(dt: number) {
    if (this.on) {
      // Update flashlight brightness
      // This is clipped to 50% (so it still remains visible), but the battery will still drain
      this.core.on = true;
      this.cone.on = true;

      this.battery = clamp(
        this.battery - dt * this.useRate,
        0,
        this.maxBattery
      );

      let t = 1.0;
      if (this.battery <= 0) {
        this.battery = 0;
      } else {
        t = clamp((this.maxBattery - this.battery) / this.maxBattery, 0, 0.5);
      }
      this.cone.color = this.color.lerp(new Color(0, 0, 0, 0), t);
      this.core.color = this.color.lerp(new Color(0, 0, 0, 0), t);

      // Start flickering when the battery is at around 30% capacity
      // This signals the player to start collecting batteries or to recharge
      if (this.battery < this.maxBattery / 3) {
        if (this.flickerTime === 0 && Math.random() < 0.1) {
          this.flickerTime = clamp(Math.random() * 0.3, 0.15, 0.3);
          this.cone.on = false;
          this.core.on = false;
        }
        if (this.flickerTime > 0) {
          this.flickerTime -= dt;
        } else {
          this.flickerTime = 0;
          this.cone.on = true;
          this.core.on = true;
        }
      }
    } else {
      this.core.on = false;
      this.cone.on = false;
    }

    // Offset the cone by a little bit
    this.core.center = this.user.center.add(new Vec2D(0, 3));
    this.cone.center = this.user.center.add(new Vec2D(0, 3));
    this.cone.dir = this.user.dir.unit();
  }
}

export { Flashlight };
