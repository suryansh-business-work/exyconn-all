/**
 * Runs `frame` on animation frames only while the scene is worth drawing: the element is on
 * screen and the tab is visible. Returns a stop function that removes every listener.
 */
export function runWhileVisible(element: Element, frame: (time: number) => void): () => void {
  let raf = 0;
  let onScreen = true;
  let started = performance.now();
  let elapsed = 0;

  const tick = (now: number) => {
    frame((elapsed + now - started) / 1000);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf === 0 && onScreen && !document.hidden) {
      started = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  const pause = () => {
    if (raf !== 0) {
      cancelAnimationFrame(raf);
      raf = 0;
      elapsed += performance.now() - started;
    }
  };
  const sync = () => (onScreen && !document.hidden ? start() : pause());

  const observer = new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    sync();
  });
  observer.observe(element);
  document.addEventListener('visibilitychange', sync);
  start();

  return () => {
    pause();
    observer.disconnect();
    document.removeEventListener('visibilitychange', sync);
  };
}
