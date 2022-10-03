import { AABB, Vec2D } from 'dynamojs-engine';
import { FieldOfView } from './FOV';
import { Light, Sound } from '../World';
import { SolidAttachment } from '../Map';
import { Particle } from '../Particle';
import { Id, IdGenerator, shortestPath } from '../Utils';
import { Controllable, Syncable } from './Interfaces';

/**
 * Various alignments of the entities
 *
 * This will affect the interactions between them
 */
type EntityAlignment = 'friendly' | 'hostile';

/**
 * World input for the entity read from virtual "sensors"
 *
 * Allows an entity to react to external stimuli
 */
interface EntityInput {
  /**
   * Visible light sources
   */
  lights: Light[];

  /**
   * Audible sounds
   */
  sounds: Sound[];

  /**
   * Other nearby entities
   */
  entities: Entity[];

  /**
   * Navigation mesh for pathfinding
   */
  navmesh: number[][];

  /**
   * Common areas on the map to patrol
   */
  waypoints: Vec2D[];

  /**
   * Dimensions of a tile
   * This is constant throughout the entity's lifetime
   */
  tilesize: Vec2D;
}

/**
 * World information emitted by an entity
 */
interface EntityOutput {
  /**
   * Lights emitted from the entity (e.g., flashlight)
   */
  lights: Light[];

  /**
   * Sounds emitted from the entity (e.g., footsteps)
   */
  sounds: Sound[];

  /**
   * Child entities emitted from the entity
   */
  entities: Entity[];

  /**
   * Particle emission
   */
  particles: Particle[];
}

/**
 * Collision flags
 */
interface CollisionTable {
  left: boolean;
  right: boolean;
  top: boolean;
  bottom: boolean;
}

/**
 * World entity base class
 *
 * Individual actors in the game world
 */
class Entity extends AABB {
  id: Id;
  align: EntityAlignment;
  vel: Vec2D;
  accel: Vec2D;
  dir: Vec2D;
  collision: CollisionTable;
  hearingFov: FieldOfView;
  visualFov: FieldOfView;
  currentPath: Vec2D[];
  input: EntityInput;
  output: EntityOutput;
  solidTile: SolidAttachment['type'];
  alive: boolean;

  /**
   * Create a new entity
   *
   * @param align        Alignment of the entity (friendly or hostile)
   * @param x            World x-coordinate
   * @param y            World y-cooridnate
   * @param w            World width dimension
   * @param h            World height dimension
   * @param solidTile   Type of tile that blocks this entity from moving
   * @param hearingDist Hearing distance (audio sensor)
   * @param viewAngle   Field of view    (visual sensor)
   * @param viewRange   Range of view    (visual sensor)
   */
  constructor(
    align: EntityAlignment,
    x: number,
    y: number,
    w: number,
    h: number,
    solidTile: SolidAttachment['type'],
    hearingDist = 0,
    viewAngle = 0,
    viewRange = 0
  ) {
    super(x, y, w, h);
    this.id = IdGenerator.generate();
    this.align = align;
    this.solidTile = solidTile;

    this.vel = new Vec2D(0, 0);
    this.accel = new Vec2D(0, 0);
    this.dir = new Vec2D(1, 1);
    this.collision = {
      left: false,
      right: false,
      top: false,
      bottom: false,
    };
    this.alive = true;

    this.output = {
      lights: [],
      sounds: [],
      entities: [],
      particles: [],
    };
    // Sensors, input, and output
    // Visual FOV depends on heading vector (where is the character moving towards?)
    // Can also rotate (looking around)
    // Must be visualized somehow
    this.hearingFov = new FieldOfView(
      this.center,
      hearingDist,
      Math.PI,
      new Vec2D(1, 0)
    );
    this.visualFov = new FieldOfView(
      this.center,
      viewRange,
      viewAngle,
      new Vec2D(1, 0)
    );

    this.input = {
      lights: [],
      sounds: [],
      entities: [],
      navmesh: [],
      waypoints: [],
      tilesize: new Vec2D(1, 1),
    };
    this.currentPath = [];
  }

  /**
   * Get the world collider of the entity
   * The sprite's bounding volume will be slightly above his feet to simulate 3D
   */
  zCollider() {
    return new AABB(this.center.x, this.center.y + this.dim.y / 3.0, 16, 16);
  }

  /**
   * Kill the entity
   */
  kill() {
    this.alive = false;
  }

  /**
   * Find the shortest path to a target world position
   *
   * This updates the internal `currentPath` variable, which is an
   * array of discrete positions to travel to
   *
   * @param target
   */
  generatePath(target: Vec2D) {
    const collider = this.zCollider();
    let fromUnit = collider.center.copy();
    fromUnit.x = Math.floor(fromUnit.x / this.input.tilesize.x);
    fromUnit.y = Math.floor(fromUnit.y / this.input.tilesize.x);

    let targetUnit = target.copy();
    targetUnit.x = Math.floor(targetUnit.x / this.input.tilesize.x);
    targetUnit.y = Math.floor(targetUnit.y / this.input.tilesize.x);

    const adjList = [
      new Vec2D(1, 0),
      new Vec2D(-1, 0),
      new Vec2D(0, -1),
      new Vec2D(0, 1),
    ];
    if (this.input.navmesh[fromUnit.y][fromUnit.x] !== 0) {
      for (const offset of adjList) {
        const adj = fromUnit.add(offset);
        if (this.input.navmesh[adj.y][adj.x] === 0) {
          fromUnit = adj;
          break;
        }
      }
    }
    if (this.input.navmesh[targetUnit.y][targetUnit.x] !== 0) {
      for (const offset of adjList) {
        const adj = targetUnit.add(offset);
        if (this.input.navmesh[adj.y][adj.x] === 0) {
          targetUnit = adj;
          break;
        }
      }
    }
    this.currentPath = shortestPath(this.input.navmesh, fromUnit, targetUnit);
  }

  /**
   * Handle colliding with another entity (override)
   *
   * @param target Other entity
   */
  interactWith(target: Entity) {
    return;
  }

  /**
   * Handle colliding with the map
   */
  onCollide() {
    return;
  }

  /**
   * Main update method (override)
   *
   * Execute internal entity logic here
   *
   * @param dt
   */
  update(dt: number) {
    return;
  }

  /**
   * Convert instance to syncable object, if possible
   */
  asControllable(): (this & Controllable) | null {
    return null;
  }

  /**
   * Convert instance to syncable object, if possible
   */
  asSyncable(): (this & Syncable) | null {
    return null;
  }
}

export { Entity };
