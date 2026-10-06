import "../css/reset.css";
import "../css/style.css";
import { gsap } from "gsap";
import { prepareSvg } from "./animation/prepareSvg.js";
import { createLogoTimeline } from "./animation/logoTimeline.js";
import { loadEyeAssets } from "./animation/eyeAssets.js";
import { prepareLightSweep } from "./animation/lightSweep.js";
import { prepareLetterFlash } from "./animation/letterFlash.js";
import { createLogoAudio } from "./animation/logoAudio.js";
import { prepareHeadphones } from "./animation/headphones.js";

const logoMount = document.querySelector("#logoMount");
const replayButton = document.querySelector("#replayButton");
const pauseButton = document.querySelector("#pauseButton");
const status = document.querySelector("#status");
const reflection = document.querySelector(".logo-reflection");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const soundButton = document.querySelector("#soundButton");
const soundStatus = document.querySelector("#soundStatus");
const events = new AbortController();
const listenerOptions = { signal: events.signal };
let soundLoading = false;
let timeline;
let context;
let parts;
let userPaused = false;
const logoAudio = createLogoAudio({
  tracks: [
    { url: `${import.meta.env.BASE_URL}assets/audio/lettering-whoosh.wav`, cue: "letters" },
    { url: `${import.meta.env.BASE_URL}assets/audio/light-sweep-glitch.wav`, cue: "sweep" },
    { url: `${import.meta.env.BASE_URL}assets/audio/light-sweep-glitch.wav`, cue: "sweepReturn" }
  ],
  getPlayback: () => ({
    time: timeline?.time() ?? 0,
    cues: timeline?.labels ?? {},
    playing: Boolean(timeline && timeline.progress() < 1 && !timeline.paused() && !document.hidden && !reducedMotion.matches)
  }),
  onError: reportAudioError
});

function updateSoundControl() {
  soundButton.disabled = !timeline || reducedMotion.matches || soundLoading;
  soundButton.textContent = soundLoading ? "Cargando sonido…" : logoAudio.enabled ? "Silenciar" : "Activar sonido";
  soundButton.setAttribute("aria-pressed", String(logoAudio.enabled));
  soundButton.setAttribute("aria-busy", String(soundLoading));
}

function reportAudioError(error) {
  logoAudio.disable();
  console.error(error);
  soundStatus.textContent = "No se pudo activar el sonido. Puedes reintentarlo.";
  updateSoundControl();
}

function updateControls() {
  const complete = !timeline || timeline.progress() === 1;
  replayButton.disabled = !timeline || reducedMotion.matches;
  pauseButton.disabled = complete || reducedMotion.matches;
  pauseButton.textContent = userPaused ? "Continuar" : "Pausar";
  updateSoundControl();
  status.textContent = reducedMotion.matches ? "Movimiento reducido · identidad en reposo"
    : complete ? "PARPADEO · enfoque completo"
    : userPaused ? "Animación en pausa" : "PARPADEO · exploración óptica";
}

function configureMotion() {
  logoAudio.stop();
  if (reducedMotion.matches) {
    logoAudio.disable();
    soundStatus.textContent = "Sonido desactivado con movimiento reducido.";
  } else {
    soundStatus.textContent = "Activar sonido reinicia la animación.";
  }
  context?.revert();
  parts.lightSweep?.dispose();
  parts.letterFlash?.dispose();
  parts.letterFlash = null;
  parts.lightSweep = null;
  timeline = null;
  userPaused = false;
  if (!reducedMotion.matches) {
    parts.lightSweep = prepareLightSweep(parts);
    parts.letterFlash = prepareLetterFlash(parts);
    context = gsap.context(() => {
      timeline = createLogoTimeline(parts, { reflection, onComplete: updateControls });
      timeline.eventCallback("onUpdate", logoAudio.sync);
    }, logoMount);
    if (!document.hidden) timeline.play(0);
  }
  updateControls();
}

async function boot() {
  replayButton.disabled = pauseButton.disabled = true;
  try {
    const [response, eyeAssets, headphoneFrames] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}assets/svg/parpadeo-logo.svg`),
      loadEyeAssets(import.meta.env.BASE_URL),
      prepareHeadphones(document.querySelector("#headphonesVisual"))
    ]);
    if (!response.ok) throw new Error(`No se pudo cargar el SVG (${response.status})`);
    logoMount.innerHTML = await response.text();
    const svg = logoMount.querySelector("svg");
    if (!svg) throw new Error("El archivo no contiene un SVG válido.");
    parts = prepareSvg(svg, eyeAssets);
    parts.headphoneFrames = headphoneFrames;
    configureMotion();
    reducedMotion.addEventListener("change", configureMotion);
  } catch (error) {
    context?.revert();
    parts?.lightSweep?.dispose();
    parts?.letterFlash?.dispose();
    replayButton.disabled = pauseButton.disabled = true;
    console.error(error);
    status.textContent = "No se pudo cargar la identidad. Recarga la página para reintentar.";
  }
}

replayButton.addEventListener("click", () => {
  if (!timeline || reducedMotion.matches) return;
  userPaused = false;
  logoAudio.stop();
  timeline.restart();
  updateControls();
}, listenerOptions);
pauseButton.addEventListener("click", () => {
  if (!timeline || reducedMotion.matches || timeline.progress() === 1) return;
  userPaused = !userPaused;
  timeline.paused(userPaused || document.hidden);
  logoAudio.sync();
  updateControls();
}, listenerOptions);
soundButton.addEventListener("click", async () => {
  if (!timeline || reducedMotion.matches || soundLoading) return;
  if (logoAudio.enabled) {
    logoAudio.disable();
    soundStatus.textContent = "Sonido desactivado.";
    updateSoundControl();
    return;
  }
  soundLoading = true;
  updateSoundControl();
  try {
    if (await logoAudio.enable() && timeline && !reducedMotion.matches) {
      userPaused = false;
      logoAudio.stop();
      timeline.restart().paused(document.hidden);
      soundStatus.textContent = "Sonido activado · entrada del texto y barrido de luz.";
      updateControls();
    }
  } catch (error) {
    if (!events.signal.aborted) reportAudioError(error);
  } finally {
    soundLoading = false;
    if (!events.signal.aborted) updateSoundControl();
  }
}, listenerOptions);
document.addEventListener("visibilitychange", () => {
  if (timeline && timeline.progress() < 1) timeline.paused(document.hidden || userPaused);
  logoAudio.sync();
}, listenerOptions);
if (import.meta.hot) import.meta.hot.dispose(() => {
  events.abort();
  logoAudio.dispose();
  context?.revert();
  parts?.lightSweep?.dispose();
  parts?.letterFlash?.dispose();
  reducedMotion.removeEventListener("change", configureMotion);
});
boot();
