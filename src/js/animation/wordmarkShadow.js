const namespace = "http://www.w3.org/2000/svg";
let instance = 0;

/** A static shadow derived from the lettering alpha follows every letter reveal. */
export function prepareWordmarkShadow(svg, wordmark) {
  if (!wordmark) return;
  const defs = document.createElementNS(namespace, "defs");
  const filter = document.createElementNS(namespace, "filter");
  const id = `parpadeo-wordmark-shadow-${++instance}`;
  Object.entries({
    id, x: "-10%", y: "-25%", width: "120%", height: "160%",
    "color-interpolation-filters": "sRGB"
  }).forEach(([name, value]) => filter.setAttribute(name, value));

  const shadow = document.createElementNS(namespace, "feDropShadow");
  Object.entries({
    dx: "2", dy: "6", stdDeviation: "5",
    "flood-color": "#00080c", "flood-opacity": "0.65"
  }).forEach(([name, value]) => shadow.setAttribute(name, value));
  filter.append(shadow);
  defs.append(filter);
  svg.prepend(defs);
  // SVG filter generates the rear silhouette without duplicating paths or IDs.
  // Keep blur/offset constant; GSAP only animates the existing letter wrappers.
  wordmark.style.filter = `url(#${id})`;
}
