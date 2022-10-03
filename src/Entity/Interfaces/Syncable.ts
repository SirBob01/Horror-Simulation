import { EntitySocketData } from '../../Network';
import { Entity } from '../Entity';

/**
 * An entity that needs to be updated in the client
 */
interface Syncable extends Entity {
  /**
   * Get the data required for socket transmission
   */
  getSocketData(): EntitySocketData;

  /**
   * Update the entity given transmitted socket data
   */
  setSocketData(data: EntitySocketData): void;
}

export type { Syncable };
