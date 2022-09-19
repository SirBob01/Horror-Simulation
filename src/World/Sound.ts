import { Vec2D } from 'dynamojs-engine';

/**
 * Sound metadata
 */
interface Sound {
  /**
   * Sound effect URI
   */
  sound: string;

  /**
   * Floating point number between 0 and 1 describing loudness
   */
  volume: number;

  /**
   * World position of the sound source
   */
  position: Vec2D;
}

export type { Sound };
