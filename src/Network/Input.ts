/**
 * Defines the keyboard input data format from the client
 */
interface KeyInputSocketData {
  /**
   * Key code
   */
  key: string;

  /**
   * Pressed or released?
   */
  pressed: boolean;
}

/**
 * Defines the mouse input data format from the client
 */
interface MouseInputSocketData {
  /**
   * Mouse0 - Left mouse
   * Mouse1 - Middle mouse
   * Mouse2 - Right mouse
   */
  button: number;

  /**
   * Pressed or released?
   */
  pressed: boolean;
}

export type { KeyInputSocketData, MouseInputSocketData };
