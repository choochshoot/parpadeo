/** Audio follows the timeline clock, including pause, replay and tab visibility. */
export function createLogoAudio({
  tracks, getPlayback, onError = () => {},
  createContext = () => new window.AudioContext(), fetchFile = (...args) => fetch(...args)
}) {
  let context;
  const clips = tracks.map((track) => ({ ...track, buffer: null, source: null, startedAt: 0 }));
  let enabled = false;
  let version = 0;
  let disposed = false;
  const request = new AbortController();
  const buffers = new Map();

  function loadBuffer(url) {
    if (!buffers.has(url)) {
      const loading = fetchFile(url, { signal: request.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Audio HTTP ${response.status}`);
          return response.arrayBuffer();
        }).then((data) => context.decodeAudioData(data))
        .catch((error) => {
          buffers.delete(url);
          throw error;
        });
      buffers.set(url, loading);
    }
    return buffers.get(url);
  }

  function stopClip(clip) {
    if (!clip.source) return;
    clip.source.onended = null;
    clip.source.stop();
    clip.source.disconnect();
    clip.source = null;
  }

  function stop() {
    clips.forEach(stopClip);
  }

  function disable() {
    version++;
    enabled = false;
    stop();
  }

  async function enable() {
    const attempt = ++version;
    // Invoke resume directly from the button gesture, before fetching/decoding.
    context ??= createContext();
    const unlocked = context.resume();
    const loaded = Promise.all(clips.map((clip) => loadBuffer(clip.url)));
    const [, decoded] = await Promise.all([unlocked, loaded]);
    if (disposed || attempt !== version) return false;
    clips.forEach((clip, index) => { clip.buffer = decoded[index]; });
    if (context.state !== "running") throw new Error("El navegador no habilitó el audio.");
    enabled = true;
    return true;
  }

  function syncClip(clip, time, cues) {
    const offset = time - (cues[clip.cue] ?? Infinity);
    if (!clip.buffer || offset < 0 || offset >= clip.buffer.duration) return stopClip(clip);
    // Avoid writes per frame: restart only after a seek or material clock drift.
    if (clip.source && Math.abs(context.currentTime - clip.startedAt - offset) < 0.12) return;
    stopClip(clip);
    let active;
    try {
      active = context.createBufferSource();
      active.buffer = clip.buffer;
      active.connect(context.destination);
      active.onended = () => {
        active.disconnect();
        if (clip.source === active) clip.source = null;
      };
      clip.startedAt = context.currentTime - offset;
      active.start(0, offset);
      clip.source = active;
    } catch (error) {
      active?.disconnect();
      disable();
      onError(error);
    }
  }

  function sync() {
    if (!enabled || disposed) return stop();
    const { time, cues, playing } = getPlayback();
    if (!playing || context.state !== "running") return stop();
    for (const clip of clips) {
      syncClip(clip, time, cues);
      if (!enabled) break;
    }
  }

  return {
    get enabled() { return enabled; },
    enable, disable, sync, stop,
    dispose() {
      disposed = true;
      disable();
      request.abort();
      buffers.clear();
      if (context && context.state !== "closed") context.close().catch(() => {});
    }
  };
}
