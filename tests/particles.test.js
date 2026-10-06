import test from "node:test";
import assert from "node:assert/strict";
import { sampleLetterPoints } from "../src/js/animation/letterParticles.js";

// Minimal affine geometry to verify sampling with scaled/transformed SVG paths.
class Matrix {
  constructor(scale = 1, x = 0, y = 0) { Object.assign(this, { scale, x, y }); }
  inverse() { return new Matrix(1 / this.scale, -this.x / this.scale, -this.y / this.scale); }
  multiply(b) { return new Matrix(this.scale * b.scale, this.scale * b.x + this.x, this.scale * b.y + this.y); }
}

test("particle sampling preserves transformed silhouettes, holes and deduplicates overlaps", () => {
  const previous = globalThis.DOMPoint;
  globalThis.DOMPoint = class {
    constructor(x, y) { Object.assign(this, { x, y }); }
    matrixTransform(m) { return new globalThis.DOMPoint(this.x * m.scale + m.x, this.y * m.scale + m.y); }
  };
  try {
    const svg = { getScreenCTM: () => new Matrix(2, 100, 50) };
    const shape = {
      getScreenCTM: () => new Matrix(4, 120, 70),
      getBBox: () => ({ x: 0, y: 0, width: 4, height: 4 }),
      isPointInFill: ({ x, y }) => x >= 0 && x <= 4 && y >= 0 && y <= 4 && !(x === 2 && y === 2)
    };
    const points = sampleLetterPoints(svg, [shape, shape], 2);
    assert.equal(points.length, 24);
    assert.ok(points.some(p => p.x === 10 && p.y === 10));
    assert.ok(points.some(p => p.x === 18 && p.y === 18));
    assert.ok(!points.some(p => p.x === 14 && p.y === 14));
    assert.deepEqual(sampleLetterPoints(svg, [], 2), []);
  } finally {
    if (previous === undefined) delete globalThis.DOMPoint;
    else globalThis.DOMPoint = previous;
  }
});
