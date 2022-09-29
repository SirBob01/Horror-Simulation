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
  halfAngle: number;
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
   * @param halfAngle  Cone half-angle
   */
  constructor(
    x: number,
    y: number,
    radius: number,
    color: Color,
    dir: Vec2D,
    halfAngle: number
  ) {
    super(x, y, radius * 2, radius * 2);
    this.color = color;

    // NEVER make abs(halfAngle) >= Math.PI/2
    this.halfAngle = halfAngle;
    this.dir = dir;

    this.on = true;
  }

  /**
   * Test for the intersection between a ray and a segment
   *
   * @param ray
   * @param segment
   */
  private getIntersection(ray: Segment, segment: Segment) {
    const rP = ray.start.copy();
    const rD = ray.stop.sub(ray.start);

    const sP = segment.start.copy();
    const sD = segment.stop.sub(segment.start);

    if (rD.unit().equals(sD.unit())) {
      // When parallel, no intersection
      return null;
    }

    const T2 =
      (rD.x * (sP.y - rP.y) + rD.y * (rP.x - sP.x)) /
      (sD.x * rD.y - sD.y * rD.x);
    const T1 = (sP.x + sD.x * T2 - rP.x) / rD.x;
    if (T1 < 0 || T2 < 0 || T2 > 1) {
      return null;
    }

    // Point of intersection and parametric parameter
    return {
      point: new Vec2D(rP.x + rD.x * T1, rP.y + rD.y * T1),
      param: T1,
    };
  }

  /**
   * Get the occluders from a map
   *
   * @param map
   * @param layers
   */
  private getOccluders(map: WorldMap, layers: Layer[]) {
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
          const occluders = map.getAttachments(x, y, layer, 'Occluder');
          for (let i = 0; i < occluders.length; i++) {
            if (occluders[i].rect.isInBounds(this.center)) {
              continue;
            }
            if (map.getAttachments(x, y - 1, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.top(),
                normal: new Vec2D(0, -1),
              });
            }
            if (map.getAttachments(x, y + 1, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.bottom(),
                normal: new Vec2D(0, 1),
              });
            }
            if (map.getAttachments(x - 1, y, layer, 'Occluder').length === 0) {
              segments.push({
                segment: occluders[i].rect.left(),
                normal: new Vec2D(-1, 0),
              });
            }
            if (map.getAttachments(x + 1, y, layer, 'Occluder').length === 0) {
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
  private filterOccluders(occluders: GeometricSide[]) {
    const baseAngle = Math.atan2(this.dir.y, this.dir.x);
    const arcStart = baseAngle - this.halfAngle;
    const arcStop = baseAngle + this.halfAngle;

    const angles = [arcStart, arcStop];
    const segments = [];

    const uniqueAngles = new Set<number>();
    for (const occluder of occluders) {
      const d = occluder.segment.start.sub(this.center);
      if (d.dot(occluder.normal) >= 0) {
        continue;
      }
      const startD = occluder.segment.start.sub(this.center);
      const stopD = occluder.segment.stop.sub(this.center);

      uniqueAngles.add(Math.atan2(startD.y, startD.x));
      uniqueAngles.add(Math.atan2(stopD.y, stopD.x));
      segments.push(occluder.segment);
    }
    uniqueAngles.forEach((a) => {
      // Handle corner cases when direction is around the -x axis
      // Ngl this gave me massive hemorrhoids
      if (arcStop > Math.PI) {
        if (a >= arcStop - 2 * Math.PI && a <= arcStart) {
          return;
        }
      } else if (arcStart < -Math.PI) {
        if (a <= arcStart + 2 * Math.PI && a >= arcStop) return;
      } else if (a <= arcStart || a >= arcStop) {
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
  private getPoints(angles: number[], segments: Segment[]) {
    const intersects = [];
    for (const angle of angles) {
      const dir = new Vec2D(Math.cos(angle), Math.sin(angle));
      const ray = new Segment(this.center, this.center.add(dir));

      let closest: any = null;
      for (const segment of segments) {
        const intersect = this.getIntersection(ray, segment);
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
      if (this.halfAngle === Math.PI) {
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
  getPolygon(map: WorldMap, layers: Layer[] = []) {
    const occluders = this.getOccluders(map, layers);
    const filtered = this.filterOccluders(occluders);

    const segments = filtered[0];
    const angles = filtered[1];
    return this.getPoints(angles, segments);
  }
}

export { Light };
