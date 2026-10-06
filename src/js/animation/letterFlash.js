import { SVG_IDS } from "./selectors.js";

/** A warm copy follows the E's wrapper exactly; only its opacity is animated. */
export function prepareLetterFlash({ letters }) {
  const letter = letters.find((node) => node.querySelector(SVG_IDS.letterE));
  if (!letter) return null;
  const highlight = letter.querySelector(SVG_IDS.letterE).cloneNode(false);
  highlight.removeAttribute("id");
  highlight.setAttribute("aria-hidden", "true");
  highlight.setAttribute("pointer-events", "none");
  highlight.style.fill = "#ffe8a3";
  highlight.style.opacity = "0";
  // Static, small halo: do not interpolate blur or filter on every frame.
  highlight.style.filter = "drop-shadow(0 0 2px rgba(255,190,0,.65))";
  letter.append(highlight);
  return { highlight, dispose: () => highlight.remove() };
}
