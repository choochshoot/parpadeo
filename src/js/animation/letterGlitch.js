/** Open the E from its horizontal center; animate only its neutral wrapper. */
export function addLetterGlitch(tl, letter, position, flash) {
  tl.fromTo(letter, {
    opacity: 0, scaleY: 0.018, x: 0, y: 0,
    transformOrigin: "50% 50%"
  }, {
    opacity: 1, duration: 0.12, ease: "none"
  }, position)
    .to(letter, { scaleY: 0.018, duration: 0.16, ease: "none" }, ">")
    .to(letter, { scaleY: 0.28, x: -1.8, duration: 0.12, ease: "steps(1)" }, ">")
    .to(letter, { scaleY: 0.62, x: 1.2, duration: 0.14, ease: "steps(1)" }, ">")
    .to(letter, { scaleY: 0.9, x: -0.5, duration: 0.12, ease: "steps(1)" }, ">")
    .to(letter, { scaleY: 1, x: 0, y: 0, opacity: 1, duration: 0.24, ease: "power2.out" }, ">");
  if (flash) {
    // One smooth light pulse, synchronized with the slower opening.
    const start = tl.recent().endTime() - 0.9;
    tl.fromTo(flash.highlight, { opacity: 0 },
      { opacity: 0.9, duration: 0.16, ease: "sine.out" }, start + 0.22)
      .to(flash.highlight, { opacity: 0.6, duration: 0.22, ease: "sine.inOut" }, start + 0.38)
      .to(flash.highlight, { opacity: 0, duration: 0.3, ease: "sine.out" }, start + 0.6);
  }
}
