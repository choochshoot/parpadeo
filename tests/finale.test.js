import test from "node:test";
import assert from "node:assert/strict";
import { gsap } from "gsap";
import { addEyeGrowth } from "../src/js/animation/eyeMotion.js";
import { addEyeFinale } from "../src/js/animation/eyeFinale.js";
import { addLightSweep } from "../src/js/animation/lightSweep.js";
import { addEyeGaze } from "../src/js/animation/eyeGaze.js";

// Plain targets exercise real GSAP timing/replay without pretending to test SVG rendering.
test("eyes disappear before the synchronized sweep; replay restores the opening", () => {
  const target = () => ({ x: 0, y: 0, opacity: 1, scale: 1, transformOrigin: "50% 50%", visibility: "visible", display: "inline" });
  const eyes = [0, 1].map(() => {
    return {
      group: target(), pupil: target(), pupilMotion: target(), gazeDistance: 2.4,
      openGroup: target(), growthGroup: target(), glow: { x: 0, opacity: 0 }
    };
  });
  const luminousMotion = target();
  const lightSweep = { overlay: { opacity: 0 }, beam: target(), travel: -600 };
  const tl = gsap.timeline({ paused: true });
  tl.addLabel("eyesReady", 2.25).addLabel("blink", 5.75).addLabel("blinkComplete", 6.92).addLabel("gaze", 7.95)
    .addLabel("eyeGlitch", 8.95).addLabel("sweep", 9.45);
  addEyeGrowth(tl, { eyes });
  addEyeGaze(tl, { eyes });
  addEyeFinale(tl, { eyes });
  addLightSweep(tl, { lightSweep, luminousMotion });
  try {
    tl.seek(2.4);
    eyes.forEach(({ openGroup, growthGroup }) => {
      assert.equal(openGroup.opacity, 1);
      assert.equal(openGroup.scale, 1);
      assert.equal(growthGroup.opacity, 0);
    });
    tl.seek(3.2);
    eyes.forEach(({ pupilMotion }) => assert.equal(pupilMotion.x, 2.4));
    tl.seek(4.55);
    eyes.forEach(({ pupilMotion }) => assert.equal(pupilMotion.x, -2.4));
    for (const time of [5.75, 6.05, 6.22, 6.45, 6.7, 6.92, 8.5]) {
      tl.seek(time);
      eyes.forEach(({ pupilMotion }) => assert.equal(pupilMotion.x, 0));
    }
    tl.seek(9.04);
    eyes.forEach(({ glow, group }) => {
      assert.ok(glow.opacity > 0.5);
      assert.equal(group.opacity, 1);
    });
    tl.seek(9.35);
    eyes.forEach(({ group, glow }) => {
      assert.equal(glow.opacity, 0);
      assert.equal(group.display, "none");
    });
    assert.equal(luminousMotion.x, 0);
    tl.seek(11);
    assert.ok(luminousMotion.x < 0);
    assert.equal(luminousMotion.x, lightSweep.beam.x);
    assert.ok(lightSweep.overlay.opacity > 0);
    tl.seek(tl.duration());
    assert.equal(luminousMotion.x, 0);
    assert.equal(lightSweep.beam.x, 0);
    assert.equal(lightSweep.overlay.opacity, 0);
    tl.restart().pause(0.1);
    eyes.forEach(({ group, openGroup, pupilMotion, glow }) => {
      assert.equal(glow.opacity, 0);
      assert.equal(glow.x, 0);
      assert.equal(pupilMotion.x, 0);
      assert.equal(openGroup.opacity, 0);
      assert.equal(group.display, "inline");
      assert.equal(group.opacity, 1);
      assert.equal(group.x, 0);
    });
    assert.equal(luminousMotion.x, 0);
  } finally {
    tl.kill();
    gsap.ticker.sleep();
  }
});
