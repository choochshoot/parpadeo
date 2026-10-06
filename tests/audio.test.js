import test from "node:test";
import assert from "node:assert/strict";
import { createLogoAudio } from "../src/js/animation/logoAudio.js";

function setup(fetchFile) {
  const playback = { time: 0, cues: { letters: 2.65, sweep: 9.45, sweepReturn: 12.6 }, playing: true };
  const sources = [];
  let requests = 0;
  const context = {
    state: "suspended", currentTime: 0, destination: {},
    async resume() { this.state = "running"; },
    async close() { this.state = "closed"; },
    async decodeAudioData() { return { duration: 3 }; },
    createBufferSource() {
      const source = {
        stopped: false, connect() {}, disconnect() {},
        start(_when, offset) { this.offset = offset; },
        stop() { this.stopped = true; }
      };
      sources.push(source);
      return source;
    }
  };
  const audio = createLogoAudio({
    tracks: [
      { url: "/whoosh.wav", cue: "letters" },
      { url: "/glitch.wav", cue: "sweep" },
      { url: "/glitch.wav", cue: "sweepReturn" }
    ],
    getPlayback: () => playback, createContext: () => context,
    fetchFile: fetchFile ?? (async () => {
      requests++;
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
    })
  });
  return { audio, playback, sources, context, requests: () => requests };
}

test("audio stays silent until enabled and follows cue, pause, resume and replay", async () => {
  const { audio, playback, sources, context, requests } = setup();
  audio.sync();
  assert.equal(requests(), 0);
  assert.equal(sources.length, 0);
  await audio.enable();
  audio.sync();
  assert.equal(sources.length, 0);
  playback.time = 2.65;
  audio.sync();
  assert.equal(sources[0].offset, 0);
  playback.time = 3.15;
  context.currentTime = 0.5;
  audio.sync();
  assert.equal(sources.length, 1);
  playback.playing = false;
  audio.sync();
  assert.equal(sources[0].stopped, true);
  playback.playing = true;
  context.currentTime = 8;
  audio.sync();
  assert.equal(sources[1].offset, 0.5);
  playback.time = 0;
  audio.sync();
  assert.equal(sources[1].stopped, true);
  playback.time = 2.65;
  audio.sync();
  assert.equal(sources[2].offset, 0);
  playback.time = 6;
  audio.sync();
  assert.equal(sources[2].stopped, true);
  audio.disable();
  playback.time = 2.65;
  audio.sync();
  assert.equal(sources.length, 3);
  audio.dispose();
  assert.equal(context.state, "closed");
});

test("the second cue starts at the light sweep and obeys pause, replay and mute", async () => {
  const { audio, playback, sources, context, requests } = setup();
  await audio.enable();
  assert.equal(requests(), 2);
  playback.time = 9.4;
  audio.sync();
  assert.equal(sources.length, 0);
  playback.time = 9.45;
  audio.sync();
  assert.equal(sources.length, 1);
  assert.equal(sources[0].offset, 0);
  context.currentTime = 0.5;
  playback.time = 9.95;
  audio.sync();
  assert.equal(sources.length, 1);
  playback.playing = false;
  audio.sync();
  assert.equal(sources[0].stopped, true);
  playback.playing = true;
  context.currentTime = 8;
  audio.sync();
  assert.equal(sources[1].offset, 0.5);
  playback.time = 0;
  audio.sync();
  assert.equal(sources[1].stopped, true);
  playback.time = 9.45;
  audio.sync();
  assert.equal(sources[2].offset, 0);
  audio.disable();
  assert.equal(sources[2].stopped, true);
  audio.sync();
  assert.equal(sources.length, 3);
  audio.dispose();
});

test("return reuses the electric buffer and starts from zero at 12.6 seconds", async () => {
  const { audio, playback, sources, requests, context } = setup();
  await audio.enable();
  assert.equal(requests(), 2);
  playback.time = 9.45;
  audio.sync();
  const outward = sources[0];
  playback.time = 12.59;
  audio.sync();
  assert.equal(outward.stopped, true);
  assert.equal(sources.length, 1);
  playback.time = 12.6;
  audio.sync();
  assert.equal(sources.length, 2);
  assert.equal(sources[1].buffer, outward.buffer);
  assert.equal(sources[1].offset, 0);
  context.currentTime = 0.5;
  playback.time = 13.1;
  audio.sync();
  playback.playing = false;
  audio.sync();
  assert.equal(sources[1].stopped, true);
  playback.playing = true;
  audio.sync();
  assert.equal(sources[2].offset, 0.5);
  playback.time = 0;
  audio.sync();
  assert.equal(sources[2].stopped, true);
  playback.time = 12.6;
  audio.sync();
  assert.equal(sources[3].offset, 0);
  audio.disable();
  assert.equal(sources[3].stopped, true);
  audio.dispose();
});

test("disabling while loading prevents late activation", async () => {
  let finish;
  const pending = new Promise((resolve) => { finish = resolve; });
  const { audio } = setup(() => pending);
  const enabling = audio.enable();
  audio.disable();
  finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) });
  assert.equal(await enabling, false);
  assert.equal(audio.enabled, false);
  audio.dispose();
});

test("a failed download leaves sound disabled and can be retried", async () => {
  let available = false;
  const { audio } = setup(async () => ({
    ok: available, status: 404, arrayBuffer: async () => new ArrayBuffer(8)
  }));
  await assert.rejects(audio.enable(), /404/);
  assert.equal(audio.enabled, false);
  available = true;
  assert.equal(await audio.enable(), true);
  audio.dispose();
});
