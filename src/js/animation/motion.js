// Neutral wrappers preserve the source geometry and Inkscape transforms.
import { SVG_IDS } from "./selectors.js";
import { addLetterGlitch } from "./letterGlitch.js";

export function addLetters(tl, { letters, finalOIris, finalOCrosshair, letterFlash }) {
  letters.forEach((letter, index) => {
    const position = `letters+=${index * 0.085}`;
    if (letter.querySelector(SVG_IDS.letterE)) {
      addLetterGlitch(tl, letter, position, letterFlash);
      return;
    }
    tl.fromTo(letter, { opacity: 0, y: index % 2 ? 5 : 8 },
      { opacity: 1, y: 0, duration: 1.15, ease: "power3.out" }, position);
  });
  if (finalOIris) {
    tl.fromTo(finalOIris, { x: -2, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.85, ease: "power3.out" }, "focus");
  }
  if (finalOCrosshair.length) {
    tl.fromTo(finalOCrosshair, { opacity: 0 },
      { opacity: 1, duration: 0.9, stagger: 0.1, ease: "sine.inOut" }, "focus+=0.2");
  }
}

export function addLight(tl, { luminousCircles }) {
  luminousCircles.forEach((orb, index) => {
    // Three existing filtered exposures; filters remain static throughout.
    tl.fromTo(orb, { opacity: 0 },
      { opacity: 1, duration: 1.35, ease: "sine.inOut" }, `light+=${index * 0.14}`)
      .to(orb, { opacity: 0.62 + index * 0.08, duration: 1.1, ease: "sine.inOut" }, `light+=${1.65 + index * 0.1}`)
      .to(orb, { opacity: 1, duration: 1.6, ease: "sine.inOut" }, `light+=${2.85 + index * 0.1}`);
  });
}

export function addOptics(tl, { eyePaths }) {
  eyePaths.forEach((eye, index) => {
    tl.to(eye, { x: index ? -0.8 : 0.8, duration: 0.65, ease: "sine.inOut" }, "focus")
      .to(eye, { x: 0, duration: 1.1, ease: "sine.inOut" }, "focus+=0.65");
  });
}
