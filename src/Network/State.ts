import { WorldMapSocketData } from '../Map';
import { Id } from '../Utils';
import { EntitySocketData } from './Entity';

/**
 * Live game state information
 */
interface GameStateSocketData {
  entities: EntitySocketData[];
  player_entity_id: Id;
}

/**
 * Map transitioning information
 */
interface MapTransitionSocketData {
  map_data: WorldMapSocketData;
  target_spawn: string;
}

export type { GameStateSocketData, MapTransitionSocketData };
