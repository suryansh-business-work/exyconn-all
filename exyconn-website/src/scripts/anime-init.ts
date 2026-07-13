/**
 * Global anime.js scroll-reveal animations.
 *
 * Usage in any Astro/HTML page:
 *   <div data-anime="fade-up">…</div>
 *   <div data-anime="fade-in" data-anime-delay="200">…</div>
 *   <div data-anime="zoom-in">…</div>
 *   <div data-anime="slide-left">…</div>
 *   <div data-anime="slide-right">…</div>
 *
 * Or for staggered children:
 *   <ul data-anime-stagger="fade-up">
 *     <li>…</li><li>…</li>
 *   </ul>
 *
 * Respects `prefers-reduced-motion` and the accessibility drawer
 * `data-a11y-motion="on"` setting on <html>.
 */
import { animate, stagger } from "animejs";

type AnimeName = "fade-up" | "fade-in" | "zoom-in" | "slide-left" | "slide-right";

const PRESETS: Record<AnimeName, Record<string, unknown>> = {
  "fade-up": { opacity: [0, 1], translateY: [24, 0] },
  "fade-in": { opacity: [0, 1] },
  "zoom-in": { opacity: [0, 1], scale: [0.92, 1] },
  "slide-left": { opacity: [0, 1], translateX: [-32, 0] },
  "slide-right": { opacity: [0, 1], translateX: [32, 0] },
};

function isMotionDisabled(): boolean {
  if (typeof window === "undefined") return true;
  if (document.documentElement.getAttribute("data-a11y-motion") === "on") return true;
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    return true;
  return false;
}

function setInitialHidden(el: HTMLElement, name: AnimeName) {
  el.style.willChange = "opacity, transform";
  el.style.opacity = "0";
  if (name === "fade-up") el.style.transform = "translateY(24px)";
  else if (name === "zoom-in") el.style.transform = "scale(0.92)";
  else if (name === "slide-left") el.style.transform = "translateX(-32px)";
  else if (name === "slide-right") el.style.transform = "translateX(32px)";
}

function clearWill(el: HTMLElement) {
  el.style.willChange = "";
}

function playSingle(el: HTMLElement) {
  const name = (el.dataset.anime as AnimeName) || "fade-up";
  const preset = PRESETS[name] || PRESETS["fade-up"];
  const delay = Number(el.dataset.animeDelay || 0);
  const duration = Number(el.dataset.animeDuration || 700);
  animate(el, {
    ...preset,
    duration,
    delay,
    easing: "out(3)",
    complete: () => clearWill(el),
  });
}

function playStagger(el: HTMLElement) {
  const name = (el.dataset.animeStagger as AnimeName) || "fade-up";
  const preset = PRESETS[name] || PRESETS["fade-up"];
  const step = Number(el.dataset.animeStep || 80);
  const duration = Number(el.dataset.animeDuration || 700);
  const children = Array.from(el.children) as HTMLElement[];
  children.forEach((c) => setInitialHidden(c, name));
  animate(children, {
    ...preset,
    duration,
    delay: stagger(step),
    easing: "out(3)",
    complete: () => children.forEach(clearWill),
  });
}

function init() {
  if (typeof window === "undefined") return;

  const singles = Array.from(document.querySelectorAll<HTMLElement>("[data-anime]"));
  const staggered = Array.from(document.querySelectorAll<HTMLElement>("[data-anime-stagger]"));

  // If motion is disabled, just reveal everything statically.
  if (isMotionDisabled()) {
    [...singles, ...staggered].forEach((el) => {
      el.style.opacity = "1";
      el.style.transform = "";
    });
    return;
  }

  // Pre-hide
  singles.forEach((el) => setInitialHidden(el, (el.dataset.anime as AnimeName) || "fade-up"));

  if (!("IntersectionObserver" in window)) {
    // Fallback: animate immediately
    singles.forEach(playSingle);
    staggered.forEach(playStagger);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        io.unobserve(el);
        if (el.hasAttribute("data-anime-stagger")) playStagger(el);
        else playSingle(el);
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 }
  );

  singles.forEach((el) => io.observe(el));
  staggered.forEach((el) => io.observe(el));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
