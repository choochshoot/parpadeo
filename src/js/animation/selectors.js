/**
 * IDs taken directly from the supplied Inkscape SVG.
 * Keep this file as the single source of truth if layer IDs change later.
 */
export const SVG_IDS = {
  luminousLayer: "#layer9",          // Inkscape label: esfera luminosa
  wordmarkLayer: "#layer6",          // Inkscape label: todo parpadeo
  eyeLayer: "#layer8",               // Inkscape label: ojo con esferas
  eyePaths: ["#path73", "#path73-9"],
  luminousCircles: ["#path97", "#path97-4", "#path97-4-6"],
  letters: [
    "#letter-04-p",   // P first
    "#g9",            // A first
    "#letter-03-r",   // R
    "#letter-04-p-2", // P second
    "#g10",           // A second
    "#letter-06-d",   // D
    "#path1",         // standalone letter path in wordmark layer
    "#g11"            // final O group
  ],
  letterE: "#path1",
  finalO: "#g11",
  finalOIris: "#path3",
  finalOCrosshair: ["#path5", "#path5-5"]
};
