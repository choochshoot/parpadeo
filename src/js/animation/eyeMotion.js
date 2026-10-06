export function addEyeGrowth(tl, { eyes }) {
  eyes.forEach(({ growthGroup, openGroup }, index) => {
    const start = 0.08 + index * 0.1;
    tl.fromTo(growthGroup, { opacity: 0, scale: 0.12, transformOrigin: "50% 50%" },
      { opacity: 1, scale: 1.8, duration: 1.2, ease: "power2.out" }, start)
      .to(growthGroup, { opacity: 0, duration: 0.45, ease: "sine.inOut" }, start + 1.05)
      .fromTo(openGroup, { opacity: 0, scale: 0.35, transformOrigin: "50% 65%" },
        { opacity: 1, scale: 1, duration: 1.05, ease: "power3.out" }, start + 0.95);
  });
}

export function addEyeBlink(tl, { eyes }, position) {
  eyes.forEach(({ path, pupil, openShape, closedShape }) => {
    tl.to(path, { morphSVG: { shape: closedShape, map: "position" }, duration: 0.14, ease: "power2.in" }, position)
      .to(pupil, { opacity: 0, duration: 0.09 }, position)
      .to(path, { morphSVG: { shape: openShape, map: "position" }, duration: 0.24, ease: "power2.out" }, `${position}+=0.23`)
      .to(pupil, { opacity: 1, duration: 0.16 }, `${position}+=0.29`)
      .set(path, { attr: { d: openShape } }, `${position}+=0.47`);
  });
}
