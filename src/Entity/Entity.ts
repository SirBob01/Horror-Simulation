import { AABB, Vec2D } from 'dynamojs-engine';
import { FieldOfView } from './FOV';
import { Light, Sound } from '../World';
import { SolidAttachment } from '../Map';
import { Particle } from '../Particle';
import { IdGenerator, shortest_path } from '../Utils';
import { EntitySocketData } from '../Network';

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
abstract class Entity extends AABB {
  id: number;
  align: EntityAlignment;
  vel: Vec2D;
  accel: Vec2D;
  dir: Vec2D;
  collision: CollisionTable;
  hearing_fov: FieldOfView;
  visual_fov: FieldOfView;
  current_path: Vec2D[];
  input: EntityInput;
  output: EntityOutput;
  solid_tile: SolidAttachment['type'];
  alive: boolean;

  /**
   * Create a new entity
   *
   * @param align        Alignment of the entity (friendly or hostile)
   * @param x            World x-coordinate
   * @param y            World y-cooridnate
   * @param w            World width dimension
   * @param h            World height dimension
   * @param solid_tile   Type of tile that blocks this entity from moving
   * @param hearing_dist Hearing distance (audio sensor)
   * @param view_angle   Field of view    (visual sensor)
   * @param view_range   Range of view    (visual sensor)
   */
  constructor(
    align: EntityAlignment,
    x: number,
    y: number,
    w: number,
    h: number,
    solid_tile: SolidAttachment['type'],
    hearing_dist = 0,
    view_angle = 0,
    view_range = 0
  ) {
    super(x, y, w, h);
    this.id = IdGenerator.generate();
    this.align = align;
    this.solid_tile = solid_tile;

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
    this.hearing_fov = new FieldOfView(
      this.center,
      hearing_dist,
      Math.PI,
      new Vec2D(1, 0)
    );
    this.visual_fov = new FieldOfView(
      this.center,
      view_range,
      view_angle,
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
    this.current_path = [];
  }

  /**
   * Get the world collider of the entity
   * The sprite's bounding volume will be slightly above his feet to simulate 3D
   */
  z_collider() {
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
   * This updates the internal `current_path` variable, which is an
   * array of discrete positions to travel to
   *
   * @param target
   */
  generate_path(target: Vec2D) {
    const collider = this.z_collider();
    let from_unit = collider.center.copy();
    from_unit.x = Math.floor(from_unit.x / this.input.tilesize.x);
    from_unit.y = Math.floor(from_unit.y / this.input.tilesize.x);

    let target_unit = target.copy();
    target_unit.x = Math.floor(target_unit.x / this.input.tilesize.x);
    target_unit.y = Math.floor(target_unit.y / this.input.tilesize.x);

    const adj_list = [
      new Vec2D(1, 0),
      new Vec2D(-1, 0),
      new Vec2D(0, -1),
      new Vec2D(0, 1),
    ];
    if (this.input.navmesh[from_unit.y][from_unit.x] !== 0) {
      for (const offset of adj_list) {
        const adj = from_unit.add(offset);
        if (this.input.navmesh[adj.y][adj.x] === 0) {
          from_unit = adj;
          break;
        }
      }
    }
    if (this.input.navmesh[target_unit.y][target_unit.x] !== 0) {
      for (const offset of adj_list) {
        const adj = target_unit.add(offset);
        if (this.input.navmesh[adj.y][adj.x] === 0) {
          target_unit = adj;
          break;
        }
      }
    }
    this.current_path = shortest_path(
      this.input.navmesh,
      from_unit,
      target_unit
    );
  }

  /**
   * Handle colliding with another entity (override)
   *
   * @param target Other entity
   */
  interact_with(target: Entity) {
    return;
  }

  /**
   * Handle colliding with the map
   */
  on_collide() {
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
   * Get the data required for socket transmission
   */
  abstract get_socket_data(): EntitySocketData;
}

export { Entity };
