import { clamp } from 'dynamojs-engine';
import { Entity, Human, Monster } from '../Entity';
import { Light } from './Light';
import { Sound } from './Sound';
import { MapLayers, WorldMap } from '../Map';
import { Quadtree } from '../Utils';
import { Particle } from '../Particle';
import { GameStateSocketData } from '../Network';

/**
 * Handler for when an entity transitions between worlds
 */
type WorldExitHandler = (
  entity: Entity,
  target_map: string,
  target_spawn: string
) => void;

/**
 * World simulation
 */
class World {
  map: WorldMap;
  entities: Entity[];
  particles: Particle[];
  map_lights: Light[];
  lights: Light[];
  sounds: Sound[];
  on_exit: WorldExitHandler;

  /**
   * Create a new world
   *
   * @param humans
   * @param monster
   * @param map
   */
  constructor(map: WorldMap, on_exit: WorldExitHandler) {
    this.map = map;

    // Objects
    this.entities = [];
    this.particles = []; // Non-interactive entities used for visual effects

    // World data for sensors
    this.map_lights = this.map.get_lights();
    this.lights = [];
    this.sounds = [];
    this.on_exit = on_exit;
  }

  /**
   * Test if a bounding volume is colliding with a named entity
   *
   * @param bounds     Bounding volume
   * @param name       Entity name
   * @param solid_tile Type of tile that blocks this entity
   */
  private is_colliding(entity: Entity) {
    const bounds = entity.z_collider();
    const left = clamp(
      Math.floor((bounds.center.x - bounds.dim.x / 2.0) / this.map.tilesize.x),
      0,
      this.map.size.x - 1
    );
    const right = clamp(
      Math.ceil((bounds.center.x + bounds.dim.x / 2.0) / this.map.tilesize.x),
      0,
      this.map.size.x - 1
    );
    const top = clamp(
      Math.floor((bounds.center.y - bounds.dim.y / 2.0) / this.map.tilesize.y),
      0,
      this.map.size.y - 1
    );
    const bottom = clamp(
      Math.ceil((bounds.center.y + bounds.dim.y / 2.0) / this.map.tilesize.y),
      0,
      this.map.size.y - 1
    );

    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        if (entity instanceof Human || entity instanceof Monster) {
          // Hit collider for exit
          const exits = this.map.get_attachments(x, y, 'Background', 'Exit');
          for (const exit of exits) {
            if (exit.rect.is_colliding(bounds)) {
              this.on_exit(entity, exit.target_map, exit.target_spawn_id);
            }
          }
        }

        for (const layer of MapLayers) {
          const colliders = this.map.get_attachments(
            x,
            y,
            layer,
            entity.solid_tile
          );
          for (const collider of colliders) {
            if (collider.rect.is_colliding(bounds)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  /**
   * Update all entities and handle their interactions
   *
   * @param dt Delta time
   */
  private update_entities(dt: number) {
    const qt = new Quadtree(
      3,
      this.map.size.x * this.map.tilesize.x,
      this.map.size.y * this.map.tilesize.y
    );
    for (const ent of this.entities) {
      qt.insert(ent);
    }

    // Update entities
    for (const ent of this.entities) {
      // Set the input data based on the FOV sensors
      for (const light of this.lights) {
        if (
          ent.visual_fov &&
          ent.visual_fov.is_visible(
            light.center,
            this.map.wallmesh,
            this.map.tilesize
          )
        ) {
          ent.input.lights.push(light);
        }
      }
      for (const sound of this.sounds) {
        if (
          ent.hearing_fov.is_visible(
            sound.position,
            this.map.wallmesh,
            this.map.tilesize
          )
        ) {
          ent.input.sounds.push(sound);
        }
      }
      for (const target of qt.get_neighbors(ent.visual_fov)) {
        if (ent === target) continue;
        if (
          ent.visual_fov.is_visible(
            target.center,
            this.map.wallmesh,
            this.map.tilesize
          )
        ) {
          ent.input.entities.push(target as Entity);
        }
      }
      for (const target of qt.get_neighbors(ent)) {
        if (ent === target) continue;
        if (ent.is_colliding(target)) {
          ent.interact_with(target as Entity);
        }
      }
      ent.input.navmesh = this.map.navmesh;
      ent.input.waypoints = this.map.waypoints;
      ent.input.tilesize = this.map.tilesize.copy();

      // Update
      ent.update(dt);

      // Physics equations
      ent.vel = ent.vel.add(ent.accel.scale(dt));
      const step = ent.vel
        .scale(dt)
        .add(ent.accel.scale(0.5 * Math.pow(dt, 2)));

      // Collision resolution
      ent.collision.left = false;
      ent.collision.right = false;
      ent.collision.top = false;
      ent.collision.bottom = false;
      if (ent.vel.x) {
        ent.dir.x = Math.sign(ent.vel.x);
      }
      if (ent.vel.y) {
        ent.dir.y = Math.sign(ent.vel.y);
      }

      const substeps = 5;
      let tile_collision = false;
      for (let n = 0; n < substeps; n++) {
        const old_pos = ent.center.copy();

        ent.center.x += step.x / substeps;
        if (this.is_colliding(ent)) {
          tile_collision = true;
          if (ent.vel.x < 0) {
            ent.collision.left = true;
          } else if (ent.vel.x > 0) {
            ent.collision.right = true;
          }
          ent.center.x = old_pos.x;
        }

        ent.center.y += step.y / substeps;
        if (this.is_colliding(ent)) {
          tile_collision = true;
          if (ent.vel.y < 0) {
            ent.collision.top = true;
          } else if (ent.vel.y > 0) {
            ent.collision.bottom = true;
          }
          ent.center.y = old_pos.y;
        }
      }
      if (tile_collision) {
        ent.on_collide();
      }
    }

    // Register all entity output for next update step
    this.lights = [...this.map_lights];
    this.sounds = [];
    for (const ent of this.entities) {
      this.lights.push(...ent.output.lights);
      this.sounds.push(...ent.output.sounds);
      this.entities.push(...ent.output.entities);
      this.particles.push(...ent.output.particles);
      if (ent.alive) {
        ent.input = {
          lights: [],
          sounds: [],
          navmesh: [],
          waypoints: [],
          entities: [],
          tilesize: this.map.tilesize,
        };
        ent.output = {
          lights: [],
          sounds: [],
          entities: [],
          particles: [],
        };
      } else {
        const index = this.entities.indexOf(ent, 0);
        if (index > -1) {
          this.entities.splice(index, 1);
        }
      }
    }
  }

  /**
   * Update all particles
   *
   * @param dt Delta time
   */
  private update_particles(dt: number) {
    // Update particles
    for (const particle of this.particles) {
      particle.update(dt);
    }

    // Register all particle output for next update step
    for (const particle of this.particles) {
      this.lights.push(...particle.lights);
      this.particles.push(...particle.children);
      if (particle.alive || particle.persist) {
        particle.children = [];
        particle.lights = [];
      } else {
        const index = this.particles.indexOf(particle, 0);
        if (index > -1) {
          this.particles.splice(index, 1);
        }
      }
    }
  }

  /**
   * Main update step
   *
   * @param dt Delta time
   */
  update(dt: number) {
    this.update_entities(dt);
    this.update_particles(dt);
  }

  /**
   * Remove an existing entity from the world
   *
   * @param entity
   */
  remove_entity(entity: Entity) {
    const index = this.entities.findIndex((query) => query === entity);
    if (index < 0) return;
    this.entities.splice(index, 1);
  }

  /**
   * Add a new external entity to the world
   *
   * @param entity
   */
  add_entity(entity: Entity) {
    this.entities.push(entity);
  }

  /**
   * Get the information to be transmitted via socket
   */
  get_socket_data(player_entity_id: number) {
    return {
      entities: this.entities.map((entity) => entity.get_socket_data()),
      lights: this.lights,
      sounds: this.sounds,
      player_entity_id
    } as GameStateSocketData;
  }
}

export { World };
export type { WorldExitHandler };
