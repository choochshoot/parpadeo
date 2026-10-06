/** Missing decorative images must never prevent the logo or audio from loading. */
export async function prepareHeadphones(root) {
  const frames = [...root.querySelectorAll("img")];
  const results = await Promise.allSettled(frames.map((frame) => frame.decode()));
  const ready = frames.filter((frame, index) => {
    if (results[index].status === "fulfilled") return true;
    frame.remove();
    return false;
  });
  return ready;
}

/** A single, three-second change of view; the last frame stays at rest. */
export function addHeadphones(tl, frames) {
  if (frames.length < 2) return;
  tl.set(frames, { opacity: (index) => index === 0 ? 1 : 0 }, 0);
  frames.slice(1).forEach((frame, index) => {
    const start = 0.55 + index * 0.9;
    tl.to(frames[index], { opacity: 0, duration: 0.45, ease: "sine.inOut" }, start)
      .fromTo(frame, { opacity: 0, scale: 0.98, y: 1 },
        { opacity: 1, scale: 1, y: 0, duration: 0.45, ease: "sine.inOut" }, start);
  });
}
