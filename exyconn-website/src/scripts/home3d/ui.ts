/**
 * The DOM half of the home page, independent of WebGL: chapter headings reveal as they
 * enter, and the chapter rail marks where the reader is. Without JavaScript neither runs
 * and every heading is simply visible.
 */
export const setupReveal = (stage: HTMLElement): (() => void) => {
  const targets = stage.querySelectorAll<HTMLElement>("[data-reveal-line]");
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
    },
    { rootMargin: "0px 0px -12% 0px" }
  );
  targets.forEach((target) => observer.observe(target));
  stage.dataset.revealReady = "";
  return () => observer.disconnect();
};

export const setupRail = (stage: HTMLElement, chapters: readonly HTMLElement[]): (() => void) => {
  const links = new Map(
    [...stage.querySelectorAll<HTMLAnchorElement>("[data-rail-link]")].map((link) => [
      link.hash.slice(1),
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
    { rootMargin: "-45% 0px -50% 0px" }
  );
  chapters.forEach((chapter) => observer.observe(chapter));
  return () => observer.disconnect();
};
