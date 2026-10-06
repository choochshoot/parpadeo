const namespace = "http://www.w3.org/2000/svg";
let instance = 0;

function element(tag, attributes = {}) {
  const node = document.createElementNS(namespace, tag);
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

function rootPoint(svg, node, x, y) {
  const point = svg.createSVGPoint();
  point.x = x;
  point.y = y;
  return point.matrixTransform(svg.getCTM().inverse().multiply(node.getCTM()));
}

/** Static letter mask + moving light band: no per-frame filter or path changes. */
export function prepareLightSweep({ svg, wordmark, luminousCircles }) {
  const light = luminousCircles[0];
  if (!wordmark || !light) return null;
  const lightBox = light.getBBox();
  const origin = rootPoint(svg, light, lightBox.x + lightBox.width / 2, lightBox.y + lightBox.height / 2);
  const wordBox = wordmark.getBBox();
  const left = rootPoint(svg, wordmark, wordBox.x, wordBox.y);
  const view = svg.viewBox.baseVal;
  const width = view.width * 0.2;
  const prefix = `parpadeo-sweep-${++instance}`;
  const defs = element("defs");
  const gradient = element("linearGradient", { id: `${prefix}-light` });
  [["0%", 0], ["35%", 0.25], ["50%", 0.9], ["65%", 0.25], ["100%", 0]].forEach(([offset, opacity]) => {
    gradient.append(element("stop", { offset, "stop-color": "#ffe8a3", "stop-opacity": opacity }));
  });
  const mask = element("mask", {
    id: `${prefix}-letters`, maskUnits: "userSpaceOnUse", maskContentUnits: "userSpaceOnUse",
    x: view.x, y: view.y, width: view.width, height: view.height,
    "mask-type": "luminance"
  });
  const silhouette = wordmark.cloneNode(true);
  [silhouette, ...silhouette.querySelectorAll("*")].forEach((node) => {
    node.removeAttribute("id");
    // Preserve every contour and Inkscape transform, replacing only the mask paint.
    node.style.fill = "white";
    node.style.stroke = "none";
    node.style.filter = "none";
  });
  mask.append(silhouette);
  defs.append(gradient, mask);
  const overlay = element("g", {
    mask: `url(#${prefix}-letters)`, "aria-hidden": "true", "pointer-events": "none"
  });
  overlay.style.opacity = "0";
  const beam = element("rect", {
    x: origin.x - width / 2, y: view.y, width, height: view.height,
    fill: `url(#${prefix}-light)`
  });
  overlay.append(beam);
  svg.append(defs, overlay);
  return {
    overlay, beam, travel: left.x + width * 0.12 - origin.x,
    dispose() { overlay.remove(); defs.remove(); }
  };
}

export function addLightSweep(tl, { lightSweep, luminousMotion }) {
  if (!lightSweep || !luminousMotion) return;
  const { overlay, beam, travel } = lightSweep;
  const moving = [luminousMotion, beam];
  tl.addLabel("sweepReturn", "sweep+=3.15");
  tl.fromTo(overlay, { opacity: 0 }, { opacity: 0.85, duration: 0.35 }, "sweep")
    .fromTo(moving, { x: 0 }, { x: travel, duration: 3, ease: "sine.inOut" }, "sweep")
    .to(moving, { x: 0, duration: 2.2, ease: "sine.inOut" }, "sweepReturn")
    .to(overlay, { opacity: 0, duration: 0.5, ease: "sine.out" }, "sweep+=4.85");
}
