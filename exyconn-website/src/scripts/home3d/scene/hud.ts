import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Color,
  type Material,
} from "three";
import type { Rgb } from "./palette";

/**
 * The blueprint overlay the hero opens on: dashed construction circles around the core,
 * orange measurement handles with end points, a tick ring and faint construction lines.
 * It always faces the camera.
 */
const OUTER = 1.75;
const INNER = 1.1;

const srgb = ([r, g, b]: Rgb): Color => new Color().setRGB(r, g, b, SRGBColorSpace);

const circle = (radius: number, segments = 160): BufferGeometry => {
  const points: number[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
  }
  return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(points, 3));
};

/** A handle on each side of a circle: a tangent bar and its three points. */
const handles = (radius: number, half: number): { bars: number[]; dots: number[] } => {
  const bars: number[] = [];
  const dots: number[] = [];
  [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ].forEach(([nx, ny]) => {
    const cx = nx * radius;
    const cy = ny * radius;
    const tx = ny * half;
    const ty = nx * half;
    bars.push(cx - tx, cy - ty, 0, cx + tx, cy + ty, 0);
    dots.push(cx - tx, cy - ty, 0, cx, cy, 0, cx + tx, cy + ty, 0);
  });
  return { bars, dots };
};

const ticks = (radius: number, count: number): number[] =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const length = i % 6 === 0 ? 0.12 : 0.05;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return [cos * radius, sin * radius, 0, cos * (radius + length), sin * (radius + length), 0];
  }).flat();

const constructionLines = (): number[] =>
  [OUTER, INNER, -INNER, -OUTER].flatMap((at) => [
    -4.2,
    at,
    0,
    4.2,
    at,
    0,
    at,
    -3.2,
    0,
    at,
    3.2,
    0,
  ]);

const geometryOf = (values: number[]): BufferGeometry =>
  new BufferGeometry().setAttribute("position", new Float32BufferAttribute(values, 3));

export interface Hud {
  group: Group;
  setOpacity: (opacity: number) => void;
}

export const createHud = (line: Rgb, accent: Rgb): Hud => {
  const group = new Group();
  const dashed = new LineDashedMaterial({
    color: srgb(line),
    dashSize: 0.045,
    gapSize: 0.035,
    transparent: true,
  });
  const faint = new LineDashedMaterial({
    color: srgb(line),
    dashSize: 0.03,
    gapSize: 0.07,
    transparent: true,
  });
  const orange = new LineBasicMaterial({ color: srgb(accent), transparent: true });
  const dotMaterial = new PointsMaterial({ color: srgb(accent), size: 0.07, transparent: true });

  [OUTER, INNER].forEach((radius) => {
    const ring = new Line(circle(radius), dashed);
    ring.computeLineDistances();
    group.add(ring);
    const { bars, dots } = handles(radius, radius * 0.32);
    group.add(
      new LineSegments(geometryOf(bars), orange),
      new Points(geometryOf(dots), dotMaterial)
    );
  });
  group.add(new LineSegments(geometryOf(ticks(OUTER + 0.22, 72)), orange));
  const guides = new LineSegments(geometryOf(constructionLines()), faint);
  guides.computeLineDistances();
  group.add(guides);

  const levels: [Material, number][] = [
    [dashed, 0.75],
    [faint, 0.22],
    [orange, 0.95],
    [dotMaterial, 1],
  ];
  return {
    group,
    setOpacity: (opacity) => {
      group.visible = opacity > 0.01;
      levels.forEach(([material, level]) => {
        material.opacity = opacity * level;
      });
    },
  };
};
