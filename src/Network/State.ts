import { WorldMapSocketData } from '../Map';
import { Sound, Light } from '../World';
import { EntitySocketData } from './Entity';

/**
 * Live game state information
 */
interface GameStateSocketData {
  entities: EntitySocketData[];
  sounds: Sound[];
  lights: Light[];
  player_entity_id: number;
}

/**
 * Map transitioning information
 */
interface MapTransitionSocketData {
  map_data: WorldMapSocketData;
  target_spawn: string;
}

export type { GameStateSocketData, MapTransitionSocketData };
