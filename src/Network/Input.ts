/**
 * Defines the keyboard input data format from the client
 */
interface InputSocketData {
  /**
   * Key code
   */
  key: string;

  /**
   * Pressed or released?
   */
  pressed: boolean;
}

export type { InputSocketData };
