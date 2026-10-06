import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { addOptics, addLight, addLetters } from "./motion.js";
import { addEyeGrowth, addEyeBlink } from "./eyeMotion.js";
import { addEyeFinale } from "./eyeFinale.js";
import { addLightSweep } from "./lightSweep.js";
import { addEyeGaze } from "./eyeGaze.js";
import { addHeadphones } from "./headphones.js";

gsap.registerPlugin(MorphSVGPlugin);

export function createLogoTimeline(parts, { reflection, onComplete } = {}) {
  const tl = gsap.timeline({ paused: true, onComplete });
  tl.addLabel("open", 0).addLabel("eyesReady", 2.25)
    .addLabel("letters", 2.65).addLabel("light", 3.15).addLabel("focus", 3.85)
    .addLabel("blink", 5.75).addLabel("blinkAgain", 6.45).addLabel("blinkComplete", 6.92)
    .addLabel("gaze", 7.95).addLabel("eyeGlitch", 8.95).addLabel("sweep", 9.45);
  addEyeGrowth(tl, parts.eyeStates);
  addHeadphones(tl, parts.headphoneFrames ?? []);
  addEyeBlink(tl, parts.eyeStates, "blink");
  addEyeBlink(tl, parts.eyeStates, "blinkAgain");
  addEyeGaze(tl, parts.eyeStates);
  addLight(tl, parts);
  addOptics(tl, parts);
  addLetters(tl, parts);
  addEyeFinale(tl, parts.eyeStates);
  addLightSweep(tl, parts);
  if (reflection) {
    tl.fromTo(reflection, { opacity: 0, scaleX: 0.2 },
      { opacity: 0.65, scaleX: 1, duration: 1.2, ease: "power2.out" }, "focus")
      .to(reflection, { opacity: 0.25, duration: 1.2 }, "focus+=1.35");
  }
  tl.addLabel("heroComplete");
  return tl;
}
