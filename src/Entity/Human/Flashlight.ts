import { clamp, Color, Vec2D } from 'dynamojs-engine';
import { Light } from '../../World';

/**
 * A flashlight with a limited battery
 */
class Flashlight {
  private cone: Light;
  private core: Light;
  private battery: number;
  private max_battery: number;
  private flicker_time: number;
  private color: Color;
  private use_rate: number;
  private on: boolean;

  constructor() {
    this.color = new Color(174, 169, 204);
    this.cone = new Light(0, 0, 150, this.color, new Vec2D(1, 0), Math.PI / 6);
    this.core = new Light(0, 0, 50, this.color, new Vec2D(1, 0), Math.PI);
    this.on = true;

    this.max_battery = 100;
    this.battery = this.max_battery;
    this.use_rate = 0.001;

    this.flicker_time = 0;
  }

  /**
   * Get the flashlight cone
   */
  get_cone() {
    return this.cone;
  }

  /**
   * Get the flashlight core
   */
  get_core() {
    return this.core;
  }

  /**
   * Test if the flashlight is on
   */
  is_on() {
    return this.on;
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
   * @param dt      Delta time
   * @param position Position of the source
   */
  update(dt: number, position: Vec2D) {
    if (this.on) {
      // Update flashlight brightness
      // This is clipped to 50% (so it still remains visible), but the battery will still drain
      this.core.turn_on();
      this.cone.turn_on();

      this.battery = clamp(
        this.battery - dt * this.use_rate,
        0,
        this.max_battery
      );

      let t = 1.0;
      if (this.battery <= 0) {
        this.battery = 0;
      } else {
        t = clamp((this.max_battery - this.battery) / this.max_battery, 0, 0.5);
      }
      this.cone.color = this.color.lerp(new Color(0, 0, 0, 0), t);
      this.core.color = this.color.lerp(new Color(0, 0, 0, 0), t);

      // Start flickering when the battery is at around 30% capacity
      // This signals the player to start collecting batteries or to recharge
      if (this.battery < this.max_battery / 3) {
        if (this.flicker_time === 0 && Math.random() < 0.1) {
          this.flicker_time = clamp(Math.random() * 0.3, 0.15, 0.3);
          this.cone.turn_off();
          this.core.turn_off();
        }
        if (this.flicker_time > 0) {
          this.flicker_time -= dt;
        } else {
          this.flicker_time = 0;
          this.cone.turn_on();
          this.core.turn_on();
        }
      }
    } else {
      this.core.turn_off();
      this.cone.turn_off();
    }

    // Offset the cone by a little bit
    this.cone.center = position.add(new Vec2D(0, 3));
    this.core.center = position.add(new Vec2D(0, 3));
  }
}

export { Flashlight };
