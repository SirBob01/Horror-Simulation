import { Vec2D } from 'dynamojs-engine';
import { Light } from '../World';

/**
 * Entity state information
 */
interface BaseEntitySocketData {
  id: number;
  center: Vec2D;
  size: Vec2D;
  vel: Vec2D;
  accel: Vec2D;
  dir: Vec2D;
  alive: boolean;
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
