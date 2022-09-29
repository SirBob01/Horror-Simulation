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
  playerEntityId: Id;
}

/**
 * Map transitioning information
 */
interface MapTransitionSocketData {
  mapData: WorldMapSocketData;
  targetSpawn: string;
}

export type {
  InputStateSocketData,
  GameStateSocketData,
  MapTransitionSocketData,
};
