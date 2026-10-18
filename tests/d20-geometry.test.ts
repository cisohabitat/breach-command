import assert from "node:assert/strict";
import { test } from "node:test";
import { d20Faces } from "../lib/d20-geometry.ts";

test("the d20 is a closed regular twenty-face mesh with outward planes", () => {
  assert.equal(d20Faces.length, 20);
  const vertices: number[][] = [];
  const edges = new Map<string, number>();
  const height = Math.sqrt(3) * 48;
  for (const face of d20Faces) {
    const m = face.transform.slice(9, -1).split(",").map(Number);
    assert.equal(m.length, 16);
    assert.ok(m.every(Number.isFinite));
    assert.ok(m[8] * m[12] + m[9] * m[13] + m[10] * m[14] > 0, "normal points out, so the visible front face is not culled");
    const points = [[0, -2 * height / 3], [-48, height / 3], [48, height / 3]].map(([x, y]) => [m[0] * x + m[4] * y + m[12], m[1] * x + m[5] * y + m[13], m[2] * x + m[6] * y + m[14]]);
    const ids = points.map(point => {
      const existing = vertices.findIndex(v => Math.hypot(...v.map((value, i) => value - point[i])) < .001);
      return existing >= 0 ? existing : vertices.push(point) - 1;
    });
    for (let i = 0; i < 3; i++) {
      const next = (i + 1) % 3;
      assert.ok(Math.abs(Math.hypot(...points[i].map((v, j) => v - points[next][j])) - 96) < .001);
      const edge = [ids[i], ids[next]].sort((a, b) => a - b).join(",");
      edges.set(edge, (edges.get(edge) ?? 0) + 1);
    }
  }
  assert.equal(vertices.length, 12);
  assert.equal(edges.size, 30);
  assert.ok([...edges.values()].every(count => count === 2), "every edge joins exactly two faces");
  const front = d20Faces[0].transform.slice(9, -1).split(",").map(Number);
  assert.ok(front[10] > .999 && Math.abs(front[12]) < .001 && Math.abs(front[13]) < .001);
});
