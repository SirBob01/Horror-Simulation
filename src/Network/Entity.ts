import { Vec2D } from 'dynamojs-engine';
import { Id } from '../Utils';

/**
 * Entity state information
 */
interface BaseEntitySocketData {
  id: Id;
  center: Vec2D;
  vel: Vec2D;
  dir: Vec2D;
}

/**
 * Flashlight data
 */
interface FlashlightSocketData {
  battery: number;
  on: boolean;
}

/**
 * Human specific data
 */
interface HumanEntitySocketData extends BaseEntitySocketData {
  type: 'human';
  health: number;
  ammo: number;
  flashlight: FlashlightSocketData;
}

/**
 * Monster specific data
 */
interface MonsterEntitySocketData extends BaseEntitySocketData {
  type: 'monster';
}

/**
 * Socket data for all types of entities
 */
type EntitySocketData = HumanEntitySocketData | MonsterEntitySocketData;

export type {
  EntitySocketData,
  HumanEntitySocketData,
  MonsterEntitySocketData,
};
