import { openFrom } from "./disclosure";

/**
 * StickyToc marks the section being read (`aria-current`), and ReadingProgress fills its
 * 2px bar with how far the reader is through its target.
 */
export const progressThrough = (top: number, height: number, viewport: number): number => {
  const span = height - viewport;
  if (span <= 0) {
    return top <= 0 ? 1 : 0;
  }
  return Math.min(1, Math.max(0, -top / span));
};

const watchToc = (toc: HTMLDetailsElement) => {
  openFrom(toc, "(min-width: 1024px)");
  const links = new Map(
    [...toc.querySelectorAll<HTMLAnchorElement>("a[href^='#']")].map((link) => [
      decodeURIComponent(link.hash.slice(1)),
      link,
    ])
  );
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          links.forEach((link, id) => {
            if (id === entry.target.id) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );
  links.forEach((_, id) => {
    const section = document.getElementById(id);
    if (section) {
      observer.observe(section);
    }
  });
};

const watchProgress = (bar: HTMLElement) => {
  const target = document.getElementById(bar.dataset.readingProgress ?? "");
  const fill = bar.firstElementChild as HTMLElement | null;
  if (!target || !fill) {
    return;
  }
  let queued = false;
  const paint = () => {
    queued = false;
    const box = target.getBoundingClientRect();
    fill.style.transform = `scaleX(${progressThrough(box.top, box.height, window.innerHeight)})`;
  };
  const request = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(paint);
    }
  };
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request, { passive: true });
  paint();
};

export const bootReading = (): void => {
  document.querySelectorAll<HTMLDetailsElement>("details.inner-toc").forEach(watchToc);
  document.querySelectorAll<HTMLElement>("[data-reading-progress]").forEach(watchProgress);
};
