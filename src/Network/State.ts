import { Entity } from '../Entity';
import { WorldMapSocketData } from '../Map';
import { Particle } from '../Particle';
import { Sound, Light } from '../World';

/**
 * Live game state information
 */
interface GameStateSocketData {
  entities: Entity[];
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

export type { GameStateSocketData, MapTransitionSocketData };
