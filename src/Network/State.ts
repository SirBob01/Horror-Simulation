import { Vec2D } from 'dynamojs-engine';
import { WorldMapSocketData } from '../Map';
import { Particle } from '../Particle';
import { Sound, Light } from '../World';

interface EntitySocketData {
  id: number;
  center: Vec2D;
  size: Vec2D;
  vel: Vec2D;
  accel: Vec2D;
  dir: Vec2D;
  alive: boolean;
}

/**
 * Live game state information
 */
interface GameStateSocketData {
  entities: EntitySocketData[];
  particles: Particle[];
  sounds: Sound[];
  lights: Light[];
}

/**
 * Map transitioning information
 */
interface MapTransitionSocketData {
  map_data: WorldMapSocketData;
  target_spawn: string;
}

export type { EntitySocketData, GameStateSocketData, MapTransitionSocketData };
