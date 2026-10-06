import test from "node:test";
import assert from "node:assert/strict";
import { gsap } from "gsap";
import { addHeadphones, prepareHeadphones } from "../src/js/animation/headphones.js";

test("headphones settle on the last view, replay, and revert to the static first view", () => {
  const frames = Array.from({ length: 4 }, (_, index) => ({ opacity: index === 0 ? 1 : 0, scale: 1, y: 0 }));
  let tl;
  const context = gsap.context(() => {
    tl = gsap.timeline({ paused: true });
    addHeadphones(tl, frames);
  });
  try {
    assert.equal(tl.duration(), 2.8);
    tl.seek(0.75);
    assert.ok(frames[0].opacity > 0 && frames[1].opacity > 0);
    tl.seek(2.8);
    assert.deepEqual(frames.map(({ opacity }) => opacity), [0, 0, 0, 1]);
    tl.restart().pause(0);
    assert.deepEqual(frames.map(({ opacity }) => opacity), [1, 0, 0, 0]);
    tl.seek(1.5);
    context.revert();
    assert.deepEqual(frames.map(({ opacity }) => opacity), [1, 0, 0, 0]);
    assert.ok(frames.every(({ scale, y }) => scale === 1 && y === 0));
  } finally {
    context.revert();
    gsap.ticker.sleep();
  }
});

test("a failed decorative image does not block the remaining frames", async () => {
  let removed = false;
  const first = { decode: async () => {}, remove() {} };
  const broken = { decode: async () => { throw new Error("Image missing"); }, remove() { removed = true; } };
  assert.deepEqual(await prepareHeadphones({ querySelectorAll: () => [first, broken] }), [first]);
  assert.equal(removed, true);
});
