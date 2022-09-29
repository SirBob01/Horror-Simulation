import { AABB, Vec2D } from 'dynamojs-engine';
import { Light } from '../World';
import {
  NarrowAttachment,
  SpawnAttachment,
  TileAttachment,
} from './Attachment';

/**
 * List of all map layers
 */
const MapLayers = [
  'Floor',
  'FloorItems',
  'Background',
  'Midground',
  'Foreground',
] as const;

/**
 * Enumerates all map layer types
 */
type Layer = typeof MapLayers[number];

/**
 * Unique identifer for a tile
 */
type Tile = number;

/**
 * 2D array of tile GIDs within a layer
 */
type LayerTiles = Tile[][];

/**
 * Sprite image associated with a tile
 */
interface TileImage {
  /**
   * Image source file
   */
  imagefile: string;

  /**
   * Column index
   */
  x: number;

  /**
   * Row index
   */
  y: number;
}

/**
 * Transferrable data via socket to the client
 *
 * This will contain all information about tile attachments, sprites, and the layers
 */
interface WorldMapSocketData {
  /**
   * Gridsize of the map
   */
  size: Vec2D;

  /**
   * Tile size in pixels
   */
  tilesize: Vec2D;

  /**
   * Raw image buffers for each tileset
   */
  tilesets: [string, Buffer][];

  /**
   * Tile attachment mapping
   */
  attachments: [Tile, [TileAttachment['type'], TileAttachment[]][]][];

  /**
   * Tile sprite mapping
   */
  sprites: [Tile, TileImage][];

  /**
   * Actual map tile data
   */
  layers: [Layer, LayerTiles][];

  /**
   * Is the map outdoors?
   */
  outdoors: boolean;

  /**
   * Is it raining?
   */
  raining: boolean;
}

/**
 * WorldMap interface
 */
interface WorldMap {
  /**
   * Size of the map (in tiles)
   */
  size: Vec2D;

  /**
   * Size of an individual tile
   */
  tilesize: Vec2D;

  /**
   * Map of all colliders on the map
   */
  wallmesh: number[][];

  /**
   * Get the navigation points for AI
   */
  navmesh: number[][];

  /**
   * Get the list of landmark points that an AI may want to travel to
   */
  waypoints: Vec2D[];

  /**
   * Is the map outdoors?
   */
  outdoors: boolean;

  /**
   * Is the weather raining?
   */
  raining: boolean;

  /**
   * Get the tile located at a layer
   *
   * @param x
   * @param y
   * @param layer
   */
  getTile(x: number, y: number, layer: Layer): Tile;

  /**
   * Get the list of attachments for a given tile
   *
   * @param x
   * @param y
   * @param layer
   * @param type
   */
  getAttachments<AttachmentType extends TileAttachment['type']>(
    x: number,
    y: number,
    layer: Layer,
    type: AttachmentType
  ): NarrowAttachment<TileAttachment, AttachmentType>[];

  /**
   * Get all spawns on the map
   */
  getSpawns(): Map<SpawnAttachment['id'], AABB>;

  /**
   * Get all lights on the map
   */
  getLights(): Light[];
}

/**
 * Server-side representation of the map
 */
interface ServerMap extends WorldMap {
  /**
   * Get socket transferrable data
   */
  getSocketData(): WorldMapSocketData;
}

export { MapLayers };
export type {
  WorldMap,
  Layer,
  Tile,
  LayerTiles,
  TileImage,
  WorldMapSocketData,
  ServerMap,
};
