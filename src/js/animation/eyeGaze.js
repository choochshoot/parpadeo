/** Both pupils look in the same direction; stop while the lids blink. */
export function addEyeGaze(tl, { eyes }) {
  eyes.forEach(({ pupilMotion, gazeDistance }) => {
    tl.fromTo(pupilMotion, { x: 0, y: 0 },
      { x: gazeDistance, duration: 0.7, ease: "sine.inOut" }, "eyesReady+=0.25")
      .to(pupilMotion, { x: -gazeDistance, duration: 1.1, ease: "sine.inOut" }, "eyesReady+=1.2")
      .to(pupilMotion, { x: 0, duration: 0.65, ease: "sine.inOut" }, "blink-=0.95")
      .to(pupilMotion, { x: -gazeDistance, duration: 0.35, ease: "sine.inOut" }, "blinkComplete+=0.18")
      .to(pupilMotion, { x: gazeDistance, duration: 0.35, ease: "sine.inOut" }, "blinkComplete+=0.58");
  });
}
