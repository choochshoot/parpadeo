import { gsap } from "gsap";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { planParticleBounce } from "./particleBounce.js";

gsap.registerPlugin(Physics2DPlugin);
const ns = "http://www.w3.org/2000/svg";

/** Sample in root SVG coordinates, preserving compound path holes and transforms. */
export function sampleLetterPoints(svg, shapes, spacing) {
  const rootInverse = svg.getScreenCTM().inverse();
  const entries = shapes.map((shape) => {
    const matrix = rootInverse.multiply(shape.getScreenCTM());
    const box = shape.getBBox();
    const corners = [[box.x, box.y], [box.x + box.width, box.y],
      [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]]
      .map(([x, y]) => new DOMPoint(x, y).matrixTransform(matrix));
    return { shape, inverse: matrix.inverse(),
      left: Math.min(...corners.map(p => p.x)), right: Math.max(...corners.map(p => p.x)),
      top: Math.min(...corners.map(p => p.y)), bottom: Math.max(...corners.map(p => p.y)) };
  });
  const points = new Map();
  for (const entry of entries) {
    for (let x = Math.ceil(entry.left / spacing) * spacing; x <= entry.right; x += spacing) {
      for (let y = Math.ceil(entry.top / spacing) * spacing; y <= entry.bottom; y += spacing) {
        const point = new DOMPoint(x, y).matrixTransform(entry.inverse);
        if (entry.shape.isPointInFill(point)) points.set(`${x.toFixed(3)},${y.toFixed(3)}`, { x, y });
      }
    }
  }
  return [...points.values()];
}

export function createLetterParticles(parts, { mount, reducedMotion, reflection }) {
  const { svg } = parts;
  const shapes = [...svg.querySelectorAll("[data-particle-ink]")]
    .flatMap(node => typeof node.isPointInFill === "function" ? [node] : [...node.querySelectorAll("path, circle, ellipse, rect, polygon")]);
  const uniqueShapes = [...new Set(shapes)];
  const layer = document.createElementNS(ns, "g");
  layer.setAttribute("aria-hidden", "true");
  layer.setAttribute("fill", "var(--wordmark-ink, #1c819e)");
  layer.style.pointerEvents = "none";
  layer.style.display = "none";
  svg.append(layer);
  const events = new AbortController();
  let dots = [];
  let positions = [];
  let active = false;
  let burst;
  let frame = 0;
  let pointer;
  let restoreReflection;
  const pulled = new Set();

  function reset() {
    cancelAnimationFrame(frame);
    frame = 0;
    burst?.kill();
    burst = null;
    restoreReflection?.();
    restoreReflection = null;
    pulled.clear();
    gsap.killTweensOf(dots);
    gsap.set(dots, { x: 0, y: 0 });
  }

  function activate() {
    if (!dots.length) {
      // Cap DOM work on mobile; retain enough points for the original thin serifs.
      const limit = window.matchMedia("(max-width: 600px)").matches ? 700 : 1400;
      let spacing = 2.4;
      do {
        positions = sampleLetterPoints(svg, uniqueShapes, spacing);
        if (positions.length <= limit) break;
        spacing *= 1.2;
      } while (spacing < 30);
      if (!positions.length) throw new Error("No se pudo muestrear el lettering.");
      const fragment = document.createDocumentFragment();
      dots = positions.map(({ x, y }) => {
        const circle = document.createElementNS(ns, "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", spacing * 0.32);
        fragment.append(circle);
        return circle;
      });
      layer.append(fragment);
    }
    active = true;
    layer.style.display = "";
    uniqueShapes.forEach(shape => shape.classList.add("particle-source-hidden"));
    mount.classList.add("particles-active");
  }

  function deactivate() {
    active = false;
    reset();
    layer.style.display = "none";
    uniqueShapes.forEach(shape => shape.classList.remove("particle-source-hidden"));
    mount.classList.remove("particles-active");
  }

  function localPoint(event) {
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  }

  function disperse(point) {
    if (!active || reducedMotion.matches || burst) return;
    reset();
    const center = point ?? { x: svg.viewBox.baseVal.x + svg.viewBox.baseVal.width / 2, y: svg.viewBox.baseVal.y + svg.viewBox.baseVal.height / 2 };
    const distances = positions.map(p => Math.hypot(p.x - center.x, p.y - center.y));
    const farthest = Math.max(1, ...distances);
    // Measure on every burst: the CSS line moves relative to the SVG on mobile.
    const rect = reflection.getBoundingClientRect();
    const inverse = svg.getScreenCTM().inverse();
    const left = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
    const right = new DOMPoint(rect.right, rect.top).matrixTransform(inverse);
    const floor = { left: left.x, right: right.x, y: left.y };
    const opacity = reflection.style.opacity;
    restoreReflection = () => { reflection.style.opacity = opacity; };
    burst = gsap.timeline({ onComplete: () => {
      burst = null;
      restoreReflection?.();
      restoreReflection = null;
    } });
    let firstImpact = Infinity;
    let lastImpact = 0;
    dots.forEach((dot, i) => {
      const start = distances[i] / farthest * 0.24;
      const flight = planParticleBounce(positions[i], floor, Number(dot.getAttribute("r")),
        gsap.utils.random(35, 65), gsap.utils.random(-32, 32), gsap.utils.random(0.42, 0.56));
      const impact = start + flight.duration;
      firstImpact = Math.min(firstImpact, impact);
      lastImpact = Math.max(lastImpact, impact);
      burst.to(dot, { duration: flight.duration, ease: "none",
        physics2D: { velocity: flight.velocity, angle: flight.angle, gravity: flight.gravity }
      }, start)
        .set(dot, { x: flight.x, y: flight.y }, impact)
        .to(dot, { duration: flight.riseDuration, ease: "none",
          physics2D: { velocity: flight.rebound, angle: -90, gravity: flight.gravity }
        }, impact)
        .to(dot, { x: 0, y: 0, duration: 0.8, ease: "power2.inOut" }, impact + flight.riseDuration);
    });
    // One restrained glow for the impact wave, rather than a flash per dot.
    burst.to(reflection, { opacity: 0.75, duration: 0.12 }, firstImpact)
      .to(reflection, { opacity: Number(opacity || 0.25), duration: 0.5 }, lastImpact);
  }

  mount.addEventListener("click", event => disperse(localPoint(event)), { signal: events.signal });
  mount.addEventListener("pointermove", event => {
    if (!active || reducedMotion.matches || burst || event.pointerType !== "mouse") return;
    pointer = localPoint(event);
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      dots.forEach((dot, i) => {
        const dx = pointer.x - positions[i].x;
        const dy = pointer.y - positions[i].y;
        const distance = Math.hypot(dx, dy);
        const pull = Math.max(0, 1 - distance / 24) * 0.3;
        if (!pull && !pulled.has(i)) return;
        if (pull) pulled.add(i);
        else pulled.delete(i);
        gsap.to(dot, { x: dx * pull, y: dy * pull, duration: 0.35, overwrite: true });
      });
    });
  }, { signal: events.signal });
  mount.addEventListener("pointerleave", () => {
    cancelAnimationFrame(frame);
    frame = 0;
    pulled.clear();
    if (active && !burst) gsap.to(dots, { x: 0, y: 0, duration: reducedMotion.matches ? 0 : 0.5, overwrite: true });
  }, { signal: events.signal });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) reset();
  }, { signal: events.signal });
  window.addEventListener("resize", () => {
    if (burst) reset();
  }, { signal: events.signal });

  return { activate, deactivate, disperse, get active() { return active; },
    dispose() { deactivate(); events.abort(); layer.remove(); } };
}
