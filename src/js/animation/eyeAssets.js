import { stringToRawPath, rawPathToString, transformRawPath } from "gsap/utils/paths.js";

const namespace = "http://www.w3.org/2000/svg";
export const EYE_GAZE_IDS = ["miradaizq", "miradader"];
export const EYE_ASSETS = {
  open: { file: "open.svg", shapes: ["path156-9", "path156-9-2"], pupils: ["path156-3-6", "path156-3-6-4"] },
  closed: { file: "closed.svg", shapes: ["path155", "path155-8"] },
  growth: { file: "growth.svg", shapes: ["path156-3", "path156-0-5"] }
};

export async function loadEyeAssets(baseUrl) {
  const entries = await Promise.all(Object.entries(EYE_ASSETS).map(async ([state, asset]) => {
    const response = await fetch(`${baseUrl}assets/svg/eyes/${asset.file}`);
    if (!response.ok) throw new Error(`No se pudo cargar ${asset.file} (${response.status})`);
    const doc = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
    if (doc.querySelector("parsererror")) throw new Error(`SVG inválido: ${asset.file}`);
    [...asset.shapes, ...(asset.pupils ?? [])].forEach((id) => {
      if (!doc.getElementById(id)) throw new Error(`Falta ${id} en ${asset.file}`);
    });
    return [state, doc];
  }));
  return Object.fromEntries(entries);
}

// Align the matching eyebrow contours, not the differently cropped viewBoxes.
export function alignClosedPath(openData, closedData) {
  const open = stringToRawPath(openData);
  const closed = stringToRawPath(closedData);
  if (!open[1] || !closed[1]) throw new Error("Los estados del ojo deben incluir la ceja.");
  transformRawPath(closed, 1, 0, 0, 1, open[1][0] - closed[1][0], open[1][1] - closed[1][1]);
  return rawPathToString(closed);
}

function group(parent) {
  const node = document.createElementNS(namespace, "g");
  parent.append(node);
  return node;
}

function copyShape(doc, id, parent, runtimeId) {
  const source = doc.getElementById(id);
  const node = document.createElementNS(namespace, source.localName);
  // Import geometry and paint only, without document metadata or duplicate IDs.
  ["d", "cx", "cy", "r", "style"].forEach((name) => {
    if (source.hasAttribute(name)) node.setAttribute(name, source.getAttribute(name));
  });
  node.id = runtimeId;
  parent.append(node);
  return node;
}

export function prepareEyeStates(layer, originals, assets) {
  const targets = originals.map((node) => ({ node, box: node.getBBox() }))
    .sort((a, b) => a.box.x - b.box.x);
  const eyes = targets.map(({ node: original, box: target }, index) => {
    const placement = group(layer);
    placement.setAttribute("aria-hidden", "true");
    placement.setAttribute("pointer-events", "none");
    const motion = group(placement);
    const openGroup = group(motion);
    const path = copyShape(assets.open, EYE_ASSETS.open.shapes[index], openGroup, `eye-open-${index}`);
    const pupilMotion = group(openGroup);
    pupilMotion.id = EYE_GAZE_IDS[index];
    const pupil = copyShape(assets.open, EYE_ASSETS.open.pupils[index], pupilMotion, `eye-pupil-${index}`);
    const gazeDistance = Math.min(Number(pupil.getAttribute("r")) * 0.85, 2.4);
    const box = openGroup.getBBox();
    const scale = Math.min(target.width / box.width, target.height / box.height);
    const x = target.x + target.width / 2 - (box.x + box.width / 2) * scale;
    const y = target.y + target.height / 2 - (box.y + box.height / 2) * scale;
    placement.setAttribute("transform", `translate(${x} ${y}) scale(${scale})`);
    const growthGroup = group(motion);
    growthGroup.style.opacity = "0";
    const seed = copyShape(assets.growth, EYE_ASSETS.growth.shapes[index], growthGroup, `eye-growth-${index}`);
    seed.setAttribute("transform", `translate(${Number(pupil.getAttribute("cx")) - Number(seed.getAttribute("cx"))} ${Number(pupil.getAttribute("cy")) - Number(seed.getAttribute("cy"))})`);
    const openShape = path.getAttribute("d");
    const closedShape = alignClosedPath(openShape, assets.closed.getElementById(EYE_ASSETS.closed.shapes[index]).getAttribute("d"));
    const glow = path.cloneNode(false);
    glow.removeAttribute("id");
    glow.setAttribute("aria-hidden", "true");
    glow.style.fill = "#ffe8a3";
    glow.style.opacity = "0";
    // Fixed halo; the finale animates only this copy's opacity and position.
    glow.style.filter = "drop-shadow(0 0 2.5px rgba(255,190,0,.8))";
    motion.append(glow);
    original.style.display = "none";
    return { group: motion, openGroup, growthGroup, path, pupil, pupilMotion, gazeDistance, openShape, closedShape, glow };
  });
  return { eyes };
}
