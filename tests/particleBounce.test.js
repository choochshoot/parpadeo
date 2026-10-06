import test from "node:test";
import assert from "node:assert/strict";
import { planParticleBounce } from "../src/js/animation/particleBounce.js";

test("particles contact the line with their radius and rebound upward within its ends", () => {
  const floor = { left: 20, right: 680, y: 180 };
  for (const position of [{ x: 0, y: 20 }, { x: 350, y: 90 }, { x: 720, y: 110 }]) {
    const flight = planParticleBounce(position, floor, 1, 50, 30);
    const angle = flight.angle * Math.PI / 180;
    const vx = Math.cos(angle) * flight.velocity;
    const vy = Math.sin(angle) * flight.velocity;
    const yAt = t => position.y + vy * t + flight.gravity * t * t / 2;
    assert.ok(Math.abs(yAt(flight.duration) + 1 - floor.y) < 1e-8);
    assert.ok(position.x + flight.x >= floor.left + 1);
    assert.ok(position.x + flight.x <= floor.right - 1);
    assert.ok(Math.abs(vx * flight.duration - flight.x) < 1e-8);
    for (let step = 0; step < 20; step++) assert.ok(yAt(flight.duration * step / 20) + 1 < floor.y);
    assert.ok(flight.rebound > 0);
    assert.ok(-flight.rebound * flight.riseDuration + flight.gravity * flight.riseDuration ** 2 / 2 < 0);
    assert.ok(Math.abs(-flight.rebound + flight.gravity * flight.riseDuration) < 1e-8);
  }
});
