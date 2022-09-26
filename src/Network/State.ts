import { InputEvent } from '../Entity';
import { WorldMapSocketData } from '../Map';
import { Id } from '../Utils';
import { EntitySocketData } from './Entity';

/**
 * Live input state information
 */
interface InputStateSocketData {
  seq: number;
  input: InputEvent[];
}

/**
 * Live game state information
 */
interface GameStateSocketData {
  seq: number;
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

export type { InputStateSocketData, GameStateSocketData, MapTransitionSocketData };
