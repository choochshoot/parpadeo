/** Center the new pupils, then glitch both supplied eyes away. */
export function addEyeFinale(tl, { eyes }) {
  const groups = eyes.map(({ group }) => group);
  const glows = eyes.map(({ glow }) => glow);
  eyes.forEach(({ pupilMotion }) => {
    tl.to(pupilMotion, { x: 0, y: 0, duration: 0.45, ease: "power2.out" }, "gaze");
  });
  // A single luminous burst follows the original silhouette, then fades with both eyes.
  tl.fromTo(glows, { opacity: 0, x: 0 },
    { opacity: 0.95, x: 1.4, duration: 0.08, ease: "power2.out" }, "eyeGlitch")
    .to(glows, { opacity: 0.5, x: -1.2, duration: 0.07, ease: "steps(1)" }, "eyeGlitch+=0.08")
    .to(glows, { opacity: 0.8, x: 0.5, duration: 0.04, ease: "steps(1)" }, "eyeGlitch+=0.15")
    .to(glows, { opacity: 0, x: 0, duration: 0.16, ease: "power2.in" }, "eyeGlitch+=0.19");
  tl.to(groups, { x: -2, y: 0.4, duration: 0.06, ease: "steps(1)" }, "eyeGlitch")
    .to(groups, { x: 2.5, y: -0.4, duration: 0.07, ease: "steps(1)" }, "eyeGlitch+=0.06")
    .to(groups, { x: -0.7, y: 0, duration: 0.06, ease: "steps(1)" }, "eyeGlitch+=0.13")
    .to(groups, { x: 0, opacity: 0, duration: 0.16, ease: "power2.in" }, "eyeGlitch+=0.19")
    .set(groups, { display: "none" }, "eyeGlitch+=0.35");
}
