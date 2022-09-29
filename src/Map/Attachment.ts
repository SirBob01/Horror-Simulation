import { AABB, Color, Vec2D } from 'dynamojs-engine';

/**
 * Meta data for a tile attachment
 */
interface BaseAttachment {
  /**
   * Section of the tile containing pertaining to this attachment
   */
  rect: AABB;
}

/**
 * A solid attachment that can block characters
 * from moving through it
 */
interface ColliderAttachment extends BaseAttachment {
  type: 'Collider';
}

/**
 * A blocker of light
 */
interface OccluderAttachment extends BaseAttachment {
  type: 'Occluder';
}

/**
 * Light source
 */
interface LightAttachment extends BaseAttachment {
  type: 'Light Source';

  /**
   * Radius of the light
   */
  radius: number;

  /**
   * Half angle of the emission cone
   */
  halfAngle: number;

  /**
   * Direction of the light
   */
  direction: Vec2D;

  /**
   * Color of the light
   */
  color: Color;
}

/**
 * A special case of colliders that block projectiles from
 * moving through it
 */
interface BlockerAttachment extends BaseAttachment {
  type: 'Blocker';
}

/**
 * Spawn point for character
 */
interface SpawnAttachment extends BaseAttachment {
  type: 'Spawn';

  /**
   * Unique identifer for the spawn in the map, since a map could have
   * multiple spawns
   */
  id: string;
}

/**
 * Exit point for a character
 */
interface ExitAttachment extends BaseAttachment {
  type: 'Exit';

  /**
   * Which map does this exit travel to?
   *
   * Can be a unique identifier or a URL
   */
  targetMap: string;

  /**
   * Which spawn should the character enter from?
   */
  targetSpawnId: string;
}

/**
 * Generic helper for narrowing attachment types based on the `type` field
 */
type NarrowAttachment<
  Attachment extends TileAttachment,
  Type
> = Attachment extends { type: Type } ? Attachment : never;

/**
 * Union of all attachment types
 */
type TileAttachment =
  | ColliderAttachment
  | OccluderAttachment
  | LightAttachment
  | BlockerAttachment
  | SpawnAttachment
  | ExitAttachment;

/**
 * Union of solid attachment types
 */
type SolidAttachment = ColliderAttachment | BlockerAttachment;

export type {
  TileAttachment,
  SolidAttachment,
  ColliderAttachment,
  OccluderAttachment,
  LightAttachment,
  BlockerAttachment,
  SpawnAttachment,
  ExitAttachment,
  NarrowAttachment,
};
