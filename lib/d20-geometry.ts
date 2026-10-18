// A regular icosahedron, rendered as twenty CSS planes. This is decorative:
// neither its geometry nor its motion participates in the game's random draw.
type Vec = [number, number, number];
const add = (a: Vec, b: Vec): Vec => a.map((v, i) => v + b[i]) as Vec;
const sub = (a: Vec, b: Vec): Vec => a.map((v, i) => v - b[i]) as Vec;
const dot = (a: Vec, b: Vec) => a.reduce((sum, v, i) => sum + v * b[i], 0);
const cross = (a: Vec, b: Vec): Vec => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec): Vec => a.map(v => v / Math.hypot(...a)) as Vec;
const phi = (1 + Math.sqrt(5)) / 2;
const vertices: Vec[] = [[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0], [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi], [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]];
const indices = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
const centre = (points: Vec[]): Vec => points.reduce(add, [0, 0, 0]).map(v => v / 3) as Vec;
const first = indices[0].map(i => vertices[i]);
const forward = unit(centre(first));
const down = unit(sub(centre(first), first[0]));
const right = unit(cross(down, forward));
const orient = (v: Vec): Vec => [dot(v, right), dot(v, down), dot(v, forward)];
const colour = (r: number, g: number, b: number) => `rgb(${r} ${g} ${b})`;

export const d20Faces = indices.map((ids, index) => {
  const points = ids.map(i => orient(vertices[i]));
  const c = centre(points);
  const y = unit(sub(c, points[0]));
  const x = unit(cross(y, unit(c)));
  const z = cross(x, y);
  const matrix = [...x, 0, ...y, 0, ...z, 0, ...c.map(v => v * 48), 1];
  // Fixed studio light, independent of roll value and hidden game state.
  const light = Math.round(135 + 72 * Math.max(0, dot(unit(c), unit([-1, -2, 3]))));
  return { id: index, transform: `matrix3d(${matrix.map(v => +v.toFixed(6)).join(",")})`, shade: `linear-gradient(145deg,${colour(light + 28, light + 22, light + 8)},${colour(light, light - 4, light - 14)})` };
});
