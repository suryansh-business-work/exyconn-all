/** The OS setting or the site's own accessibility drawer switch (shared by the inner blocks). */
export const reducedMotion = (): boolean =>
  globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches ||
  document.documentElement.dataset.a11yMotion === "on";

/** Calls `onEnter` once per element, the first time it scrolls into view. */
export const onceInView = (
  elements: Iterable<Element>,
  onEnter: (element: Element) => void,
  rootMargin = "0px 0px -12% 0px"
): (() => void) => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          observer.unobserve(entry.target);
          onEnter(entry.target);
        });
    },
    { rootMargin }
  );
  [...elements].forEach((element) => observer.observe(element));
  return () => observer.disconnect();
};
