import { SVG_IDS } from "./selectors.js";

import { prepareEyeStates } from "./eyeAssets.js";
import { prepareWordmarkShadow } from "./wordmarkShadow.js";

const q = (root, selector) => root.querySelector(selector);
const qa = (root, selectors) => selectors.map((selector) => q(root, selector)).filter(Boolean);
const namespace = "http://www.w3.org/2000/svg";

function wrap(node) {
  if (!node) return null;
  const wrapper = document.createElementNS(namespace, "g");
  wrapper.classList.add("motion-part");
  node.before(wrapper);
  wrapper.append(node);
  return wrapper;
}

export function prepareSvg(svg, eyeAssets) {
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "PARPADEO, lentes experimentales");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  svg.removeAttribute("width");
  svg.removeAttribute("height");

  const eyeLayer = q(svg, SVG_IDS.eyeLayer);

  const eyeStates = prepareEyeStates(eyeLayer, qa(svg, SVG_IDS.eyePaths), eyeAssets);
  const wordmark = q(svg, SVG_IDS.wordmarkLayer);
  const letters = qa(svg, SVG_IDS.letters);
  letters.forEach((letter) => {
    [letter, ...letter.querySelectorAll("*")].forEach((node) => {
      // Recolor the lettering paint only, preserving the O's optical details.
      if (node.matches(SVG_IDS.finalOIris)) return;
      if (["#005874", "rgb(0, 88, 116)"].includes(node.style.fill.toLowerCase())) {
        node.style.fill = "var(--wordmark-ink, #1c819e)";
        node.setAttribute("data-particle-ink", "");
      }
    });
  });
  prepareWordmarkShadow(svg, wordmark);

  return {
    svg,
    wordmark,
    eyeLayer,
    eyeStates,
    eyePaths: eyeStates.eyes.map(({ group }) => group),
    letters: letters.map(wrap),
    luminousLayer: q(svg, SVG_IDS.luminousLayer),
    luminousMotion: wrap(q(svg, SVG_IDS.luminousLayer)),
    luminousCircles: qa(svg, SVG_IDS.luminousCircles).map(wrap),
    finalO: q(svg, SVG_IDS.finalO),
    finalOIris: wrap(q(svg, SVG_IDS.finalOIris)),
    finalOCrosshair: qa(svg, SVG_IDS.finalOCrosshair).map(wrap)
  };
}
