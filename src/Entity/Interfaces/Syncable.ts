import { EntitySocketData } from '../../Network';

/**
 * An entity that needs to be updated in the client
 */
interface Syncable {
  /**
   * Get the data required for socket transmission
   */
  getSocketData(): EntitySocketData;

  /**
   * Update the entity given transmitted socket data
   */
  setSocketData(data: EntitySocketData): void;

  /**
   * Convert instance
   */
  asSyncable(): Syncable;
}

export type { Syncable };
