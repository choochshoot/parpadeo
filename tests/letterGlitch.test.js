import test from "node:test";
import assert from "node:assert/strict";
import { gsap } from "gsap";
import { addLetterGlitch } from "../src/js/animation/letterGlitch.js";

test("E holds its initial line, opens over 900 ms and finishes without light or offset", () => {
  const letter = { opacity: 1, scaleY: 1, x: 0, y: 0, transformOrigin: "50% 50%" };
  const flash = { highlight: { opacity: 0 } };
  let tl;
  const context = gsap.context(() => {
    tl = gsap.timeline({ paused: true }).addLabel("letters", 2.65);
    addLetterGlitch(tl, letter, "letters+=0.51", flash);
  });
  try {
    assert.ok(Math.abs(tl.duration() - 4.06) < 0.00001);
    tl.seek(3.4);
    assert.equal(letter.scaleY, 0.018);
    assert.ok(flash.highlight.opacity > 0);
    tl.seek(3.75);
    assert.ok(letter.scaleY > 0.018 && letter.scaleY < 1);
    assert.ok(flash.highlight.opacity > 0);
    tl.seek(4.06);
    assert.equal(letter.scaleY, 1);
    assert.equal(letter.x, 0);
    assert.equal(letter.opacity, 1);
    assert.equal(flash.highlight.opacity, 0);
    tl.restart().pause(0);
    assert.equal(letter.opacity, 0);
    assert.equal(flash.highlight.opacity, 0);
    tl.seek(3.6);
    context.revert();
    assert.equal(letter.scaleY, 1);
    assert.equal(letter.x, 0);
    assert.equal(letter.opacity, 1);
    assert.equal(flash.highlight.opacity, 0);
  } finally {
    context.revert();
    gsap.ticker.sleep();
  }
});
