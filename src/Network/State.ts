import { WorldMapSocketData } from '../Map';
import { EntitySocketData } from './Entity';

/**
 * Live game state information
 */
interface GameStateSocketData {
  entities: EntitySocketData[];
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
