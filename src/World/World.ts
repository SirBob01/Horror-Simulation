import { clamp } from 'dynamojs-engine';
import { Entity, Human, Monster } from '../Entity';
import { Light } from './Light';
import { Sound } from './Sound';
import { MapLayers, WorldMap } from '../Map';
import { Id, Quadtree } from '../Utils';
import { Particle } from '../Particle';
import { EntitySocketData, GameStateSocketData } from '../Network';

/**
 * Handler for when an entity transitions between worlds
 */
type WorldExitHandler = (
  entity: Entity,
  targetMap: string,
  targetSpawn: string
) => void;

/**
 * World simulation
 */
class World {
  map: WorldMap;
  entities: Map<Id, Entity>;
  particles: Map<Id, Particle>;
  mapLights: Light[];
  lights: Light[];
  sounds: Sound[];
  onExit: WorldExitHandler;

  /**
   * Create a new world
   *
   * @param humans
   * @param monster
   * @param map
   */
  constructor(map: WorldMap, onExit: WorldExitHandler) {
    this.map = map;

    // Objects
    this.entities = new Map();
    this.particles = new Map();

    // World data for sensors
    this.mapLights = this.map.getLights();
    this.lights = [];
    this.sounds = [];
    this.onExit = onExit;
  }

  /**
   * Test if a bounding volume is colliding with a named entity
   *
   * @param bounds    Bounding volume
   * @param name      Entity name
   * @param solidTile Type of tile that blocks this entity
   */
  private isColliding(entity: Entity) {
    const bounds = entity.zCollider();
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
          const exits = this.map.getAttachments(x, y, 'Background', 'Exit');
          for (const exit of exits) {
            if (exit.rect.isColliding(bounds)) {
              this.onExit(entity, exit.targetMap, exit.targetSpawnId);
            }
          }
        }

        for (const layer of MapLayers) {
          const colliders = this.map.getAttachments(
            x,
            y,
            layer,
            entity.solidTile
          );
          for (const collider of colliders) {
            if (collider.rect.isColliding(bounds)) {
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
  private updateEntities(dt: number) {
    const qt = new Quadtree(
      3,
      this.map.size.x * this.map.tilesize.x,
      this.map.size.y * this.map.tilesize.y
    );
    this.entities.forEach((ent) => {
      qt.insert(ent);
    });

    // Update entities
    this.entities.forEach((ent) => {
      // Set the input data based on the FOV sensors
      for (const light of this.lights) {
        if (
          ent.visualFov &&
          ent.visualFov.isVisible(
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
          ent.hearingFov.isVisible(
            sound.position,
            this.map.wallmesh,
            this.map.tilesize
          )
        ) {
          ent.input.sounds.push(sound);
        }
      }
      for (const target of qt.getNeighbors(ent.visualFov)) {
        if (ent === target) continue;
        if (
          ent.visualFov.isVisible(
            target.center,
            this.map.wallmesh,
            this.map.tilesize
          )
        ) {
          ent.input.entities.push(target as Entity);
        }
      }
      for (const target of qt.getNeighbors(ent)) {
        if (ent === target) continue;
        if (ent.isColliding(target)) {
          ent.interactWith(target as Entity);
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

      const substeps = 5;
      let tileCollision = false;
      for (let n = 0; n < substeps; n++) {
        const oldPos = ent.center.copy();

        ent.center.x += step.x / substeps;
        if (this.isColliding(ent)) {
          tileCollision = true;
          if (ent.vel.x < 0) {
            ent.collision.left = true;
          } else if (ent.vel.x > 0) {
            ent.collision.right = true;
          }
          ent.center.x = oldPos.x;
        }

        ent.center.y += step.y / substeps;
        if (this.isColliding(ent)) {
          tileCollision = true;
          if (ent.vel.y < 0) {
            ent.collision.top = true;
          } else if (ent.vel.y > 0) {
            ent.collision.bottom = true;
          }
          ent.center.y = oldPos.y;
        }
      }
      if (tileCollision) {
        ent.onCollide();
      }
    });

    // Register all entity output for next update step
    this.lights = [...this.mapLights];
    this.sounds = [];
    this.entities.forEach((ent) => {
      ent.output.entities.forEach((ent2) => {
        this.addEntity(ent2);
      });
      ent.output.particles.forEach((particle) => {
        this.addParticle(particle);
      });
      this.lights.push(...ent.output.lights);
      this.sounds.push(...ent.output.sounds);
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
        this.removeEntity(ent);
      }
    });
  }

  /**
   * Update all particles
   *
   * @param dt Delta time
   */
  private updateParticles(dt: number) {
    // Update particles
    this.particles.forEach((particle) => {
      particle.update(dt);
    });

    // Register all particle output for next update step
    this.particles.forEach((particle) => {
      particle.children.forEach((child) => {
        this.addParticle(child);
      });
      this.lights.push(...particle.lights);
      if (particle.alive || particle.persist) {
        particle.children = [];
        particle.lights = [];
      } else {
        this.removeParticle(particle);
      }
    });
  }

  /**
   * Main update step
   *
   * @param dt Delta time
   */
  update(dt: number) {
    this.updateEntities(dt);
    this.updateParticles(dt);
  }

  /**
   * Add a new entity to the world
   *
   * @param entity
   */
  addEntity(entity: Entity) {
    this.entities.set(entity.id, entity);
  }

  /**
   * Remove an existing entity from the world
   *
   * @param entity
   */
  removeEntity(entity: Entity) {
    this.entities.delete(entity.id);
  }

  /**
   * Add a new particle to the world
   *
   * @param particle
   */
  addParticle(particle: Particle) {
    this.particles.set(particle.id, particle);
  }

  /**
   * Remove an existing particle from the world
   *
   * @param particle
   */
  removeParticle(particle: Particle) {
    this.particles.delete(particle.id);
  }

  /**
   * Get the information to be transmitted via socket
   *
   * @param playerEntityId
   * @param seq
   */
  getSocketData(playerEntityId: Id, seq: number) {
    const entities: EntitySocketData[] = [];
    this.entities.forEach((entity) => {
      const syncable = entity.asSyncable();
      if (syncable) {
        entities.push(syncable.getSocketData());
      }
    });
    return { seq, entities, playerEntityId } as GameStateSocketData;
  }
}

export { World };
export type { WorldExitHandler };
