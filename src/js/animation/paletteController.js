import { gsap } from "gsap";

export const PALETTE = Object.freeze({
  north: { color: "#e6e6d4", name: "Crema" },
  east: { color: "#1c819e", name: "Teal" },
  south: { color: "#ffbe00", name: "Amarillo" },
  west: { color: "#005874", name: "Azul oscuro" }
});

/** Keep palette interaction independent of the logo playback and its SVG paths. */
export function createPaletteController(root, stage, reducedMotion) {
  const buttons = [...root.querySelectorAll("[data-direction]")];
  const status = root.querySelector("[role=status]");
  const visual = root.querySelector(".palette-controller__visual");
  const events = new AbortController();
  let selected = "east";
  let colorTween;
  let feedback;
  const original = stage.style.getPropertyValue("--wordmark-ink");

  function select(direction) {
    const palette = PALETTE[direction];
    if (!palette) return;
    selected = direction;
    colorTween?.kill();
    feedback?.revert();
    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.direction === direction));
    });
    status.textContent = `${palette.name} · ${palette.color.toUpperCase()}`;
    colorTween = gsap.to(stage, {
      "--wordmark-ink": palette.color,
      duration: reducedMotion.matches ? 0 : 0.65,
      ease: "power2.inOut",
      overwrite: "auto"
    });
    if (!reducedMotion.matches) {
      feedback = gsap.fromTo(visual, { scale: 0.96 }, {
        scale: 1, duration: 0.4, ease: "power2.out"
      });
    }
  }

  buttons.forEach((button) => button.addEventListener("click", () => {
    select(button.dataset.direction);
  }, { signal: events.signal }));
  root.addEventListener("keydown", (event) => {
    const direction = { ArrowUp: "north", ArrowRight: "east", ArrowDown: "south", ArrowLeft: "west" }[event.key];
    if (!direction) return;
    event.preventDefault();
    buttons.find((button) => button.dataset.direction === direction).focus();
    select(direction);
  }, { signal: events.signal });
  reducedMotion.addEventListener("change", () => select(selected), { signal: events.signal });

  return () => {
    events.abort();
    colorTween?.kill();
    feedback?.revert();
    if (original) stage.style.setProperty("--wordmark-ink", original);
    else stage.style.removeProperty("--wordmark-ink");
  };
}
