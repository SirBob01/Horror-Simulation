import { AABB, clamp, Color, Segment, Vec2D } from 'dynamojs-engine';
import { WorldMap, Layer } from '../Map';

interface GeometricSide {
  /**
   * Segment describing a side of the geometry
   */
  segment: Segment;

  /**
   * Surface normal
   */
  normal: Vec2D;
}

/**
 * 2D shadow-casting point light implementation
 */
class Light extends AABB {
  color: Color;
  half_angle: number;
  dir: Vec2D;
  on: boolean;

  /**
   * Construct a new light
   *
   * @param x           World x-coordinate
   * @param y           World y-coordinate
   * @param radius      Radius
   * @param color       Emission color
   * @param dir         Direction (for directed lights)
   * @param half_angle  Cone half-angle
   */
  constructor(
    x: number,
    y: number,
    radius: number,
    color: Color,
    dir: Vec2D,
    half_angle: number
  ) {
    super(x, y, radius * 2, radius * 2);
    this.color = color;

    // NEVER make abs(half_angle) >= Math.PI/2
    this.half_angle = half_angle;
    this.dir = dir;

    this.on = true;
  }

  /**
   * Test for the intersection between a ray and a segment
   *
   * @param ray
   * @param segment
   */
  private get_intersection(ray: Segment, segment: Segment) {
    const r_p = ray.start.copy();
    const r_d = ray.stop.sub(ray.start);

    const s_p = segment.start.copy();
    const s_d = segment.stop.sub(segment.start);

    if (r_d.unit().equals(s_d.unit())) {
      // When parallel, no intersection
      return null;
    }

    const T2 =
      (r_d.x * (s_p.y - r_p.y) + r_d.y * (r_p.x - s_p.x)) /
      (s_d.x * r_d.y - s_d.y * r_d.x);
    const T1 = (s_p.x + s_d.x * T2 - r_p.x) / r_d.x;
    if (T1 < 0 || T2 < 0 || T2 > 1) {
      return null;
    }

    // Point of intersection and parametric parameter
    return {
      point: new Vec2D(r_p.x + r_d.x * T1, r_p.y + r_d.y * T1),
      param: T1,
    };
  }

  /**
   * Get the occluders from a map
   *
   * @param map
   * @param layers
   */
  private get_occluders(map: WorldMap, layers: Layer[]) {
    const segments = [
      {
        segment: this.left(),
        normal: new Vec2D(1, 0),
      },
      {
        segment: this.right(),
        normal: new Vec2D(-1, 0),
      },
      {
        segment: this.top(),
        normal: new Vec2D(0, 1),
      },
      {
        segment: this.bottom(),
        normal: new Vec2D(0, -1),
      },
    ];
    if (layers.length === 0) {
      return segments;
    }

    const left = clamp(
      Math.floor((this.center.x - this.dim.x / 2.0) / map.tilesize.x),
      0,
      map.size.x - 1
    );
    const right = clamp(
      Math.ceil((this.center.x + this.dim.x / 2.0) / map.tilesize.x),
      0,
      map.size.x - 1
    );
    const top = clamp(
      Math.floor((this.center.y - this.dim.y / 2.0) / map.tilesize.y),
      0,
      map.size.y - 1
    );
    const bottom = clamp(
      Math.ceil((this.center.y + this.dim.y / 2.0) / map.tilesize.y),
      0,
      map.size.y - 1
    );
    for (let x = left; x <= right; x++) {
      for (let y = top; y <= bottom; y++) {
        for (let l = 0; l < layers.length; l++) {
          const layer = layers[l];
          const occluders = map.get_attachments(x, y, layer, 'Occluder');
          for (let i = 0; i < occluders.length; i++) {
            if (occluders[i].rect.is_in_bounds(this.center)) {
              continue;
            }
            if (map.get_attachments(x, y - 1, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.top(),
                normal: new Vec2D(0, -1),
              });
            }
            if (map.get_attachments(x, y + 1, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.bottom(),
                normal: new Vec2D(0, 1),
              });
            }
            if (map.get_attachments(x - 1, y, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.left(),
                normal: new Vec2D(-1, 0),
              });
            }
            if (map.get_attachments(x + 1, y, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.right(),
                normal: new Vec2D(1, 0),
              });
            }
          }
        }
      }
    }
    return segments;
  }

  /**
   * Filter the relevant occluders
   *
   * @param occluders
   */
  private filter_occluders(occluders: GeometricSide[]) {
    const base_angle = Math.atan2(this.dir.y, this.dir.x);
    const arc_start = base_angle - this.half_angle;
    const arc_stop = base_angle + this.half_angle;

    const angles = [arc_start, arc_stop];
    const segments = [];

    const uniqueAngles = new Set<number>();
    for (const occluder of occluders) {
      const d = occluder.segment.start.sub(this.center);
      if (d.dot(occluder.normal) >= 0) {
        continue;
      }
      const start_d = occluder.segment.start.sub(this.center);
      const stop_d = occluder.segment.stop.sub(this.center);

      uniqueAngles.add(Math.atan2(start_d.y, start_d.x));
      uniqueAngles.add(Math.atan2(stop_d.y, stop_d.x));
      segments.push(occluder.segment);
    }
    uniqueAngles.forEach((a) => {
      // Handle corner cases when direction is around the -x axis
      // Ngl this gave me massive hemorrhoids
      if (arc_stop > Math.PI) {
        if (a >= arc_stop - 2 * Math.PI && a <= arc_start) {
          return;
        }
      } else if (arc_start < -Math.PI) {
        if (a <= arc_start + 2 * Math.PI && a >= arc_stop) return;
      } else if (a <= arc_start || a >= arc_stop) {
        return;
      }
      angles.push(a - 0.00001, a, a + 0.00001);
    });

    const tuple: [Segment[], number[]] = [segments, angles];
    return tuple;
  }

  /**
   * Get light intersection points
   *
   * @param angles
   * @param segments
   */
  private get_points(angles: number[], segments: Segment[]) {
    const intersects = [];
    for (const angle of angles) {
      const dir = new Vec2D(Math.cos(angle), Math.sin(angle));
      const ray = new Segment(this.center, this.center.add(dir));

      let closest: any = null;
      for (const segment of segments) {
        const intersect = this.get_intersection(ray, segment);
        if (intersect === null) {
          continue;
        }
        if (closest === null || intersect.param < closest.param) {
          closest = intersect;
        }
      }

      if (closest === null) {
        continue;
      }
      closest.angle = angle;
      intersects.push(closest);
    }

    // Sort points around center in clockwise order
    intersects.sort((a, b) => {
      if (this.half_angle === Math.PI) {
        return a.angle - b.angle;
      }
      return (
        (a.point.x - this.center.x) * (b.point.y - this.center.y) -
        (b.point.x - this.center.x) * (a.point.y - this.center.y)
      );
    });
    return intersects;
  }

  /**
   * Get the light map polygon for rendering
   *
   * @param map
   * @param layers
   */
  get_polygon(map: WorldMap, layers: Layer[] = []) {
    const occluders = this.get_occluders(map, layers);
    const filtered = this.filter_occluders(occluders);

    const segments = filtered[0];
    const angles = filtered[1];
    return this.get_points(angles, segments);
  }
}

export { Light };
