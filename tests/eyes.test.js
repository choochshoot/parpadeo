import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { stringToRawPath } from "gsap/utils/paths.js";
import { EYE_ASSETS, alignClosedPath } from "../src/js/animation/eyeAssets.js";

const files = Object.fromEntries(Object.entries(EYE_ASSETS).map(([state, { file }]) =>
  [state, readFileSync(new URL(`../public/assets/svg/eyes/${file}`, import.meta.url), "utf8")]));

function pathData(source, id) {
  const tag = [...source.matchAll(/<path\b[^>]*>/g)].find(([value]) => value.includes(`id="${id}"`));
  assert.ok(tag, `Missing path ${id}`);
  return tag[0].match(/\bd="([^"]*)"/)[1];
}

test("all three supplied eye states retain their required shapes and pupils", () => {
  Object.entries(EYE_ASSETS).forEach(([state, { shapes, pupils = [] }]) => {
    [...shapes, ...pupils].forEach((id) => assert.ok(files[state].includes(`id="${id}"`)));
  });
});

test("both closed eyes keep their eyebrow aligned with the open artwork", () => {
  EYE_ASSETS.open.shapes.forEach((id, index) => {
    const openData = pathData(files.open, id);
    const closedData = pathData(files.closed, EYE_ASSETS.closed.shapes[index]);
    const open = stringToRawPath(openData);
    const closed = stringToRawPath(alignClosedPath(openData, closedData));
    assert.equal(closed.length, 2);
    assert.equal(open[1].length, closed[1].length);
    open[1].forEach((value, i) => assert.ok(Math.abs(value - closed[1][i]) < 0.002, `Eyebrow coordinate ${i}`));
  });
});

test("the original logo, including lettering and old eye IDs, remains untouched", () => {
  const source = readFileSync(new URL("../public/assets/svg/parpadeo-logo.svg", import.meta.url));
  assert.equal(createHash("sha256").update(source).digest("hex"), "ab7081e3da80151412c6e162237f22030ced6f684d4701d22da79c15cb39ac04");
});
