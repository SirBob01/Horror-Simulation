import { Vec2D } from 'dynamojs-engine';
import { Id } from '../Utils';
import { Light } from '../World';

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
  cone: Light;
  core: Light;
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
 * Monster specific data
 */
interface BulletEntitySocketData extends BaseEntitySocketData {
  type: 'bullet';
  source_id: number;
}

/**
 * Socket data for all types of entities
 */
type EntitySocketData =
  | HumanEntitySocketData
  | MonsterEntitySocketData
  | BulletEntitySocketData;

export type {
  EntitySocketData,
  HumanEntitySocketData,
  MonsterEntitySocketData,
  BulletEntitySocketData,
};
