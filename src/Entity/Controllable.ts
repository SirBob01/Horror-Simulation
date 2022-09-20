import { Vec2D } from 'dynamojs-engine';

/**
 * Defines the user events that map to keyboard/mouse button input
 *
 * Default mappings:
 *    left     - 'Left Arrow'
 *    right    - 'Right Arrow'
 *    up       - 'Up Arrow'
 *    down     - 'Down Arrow'
 *    use1     - 'E'
 *    use2     - 'R'
 *    use3     - 'C'
 *    attack   - 'Mouse0' (LMB)
 *    modifier - 'Mouse2' (RMB)
 */
interface ButtonEvent {
  /**
   * Button press event type
   */
  type:
    | 'left'
    | 'right'
    | 'up'
    | 'down'
    | 'use1'
    | 'use2'
    | 'use3'
    | 'attack'
    | 'modifier';

  /**
   * Pressed or released?
   */
  pressed: boolean;
}

/**
 * Defines the mouse movement events
 */
interface MouseEvent {
  /**
   * Event type
   */
  type: 'mouse';

  /**
   * Mouse position in world units
   */
  position: Vec2D;
}

/**
 * Input event
 */
type InputEvent = ButtonEvent | MouseEvent;

/**
 * Interface for controllable entities
 */
interface Controllable {
  /**
   * Input event handler
   *
   * @param event
   */
  handle_input(event: InputEvent): void;
}

export type { InputEvent, Controllable };
