/**
 * Checks axe-core does not make, run inside the page. `inPageChecks` is serialised with
 * `Function#toString`, so it must not reference anything outside its own body.
 *
 * - 2.5.8 target size (24×24 CSS px, with the spacing and inline-link exceptions)
 * - icon inventory: rendered size per context, hidden from assistive tech or not
 * - 1.4.10 reflow: anything wider than the viewport
 * - heading order, landmarks, ambiguous link text
 */
export function inPageChecks() {
  const TARGETS =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="link"], [tabindex]:not([tabindex="-1"])';
  const CONTEXTS = [
    ["header-banner", "body > div:first-of-type"],
    ["header", "header"],
    ["footer", "footer"],
    ["button", 'button, [role="button"]'],
    ["heading", "h1, h2, h3, h4, h5, h6"],
    ["link", "a"],
    ["list", "li"],
  ];

  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none"
    );
  };
  const describe = (el) => {
    const id = el.id ? `#${el.id}` : "";
    const cls =
      typeof el.className === "string"
        ? el.className.trim().split(/\s+/).slice(0, 3).join(".")
        : "";
    const text = (el.getAttribute("aria-label") ?? el.textContent ?? "")
      .trim()
      .replaceAll(/\s+/g, " ")
      .slice(0, 40);
    return `${el.tagName.toLowerCase()}${id}${cls ? `.${cls}` : ""} "${text}"`;
  };
  const hiddenFromAt = (el) => Boolean(el.closest('[aria-hidden="true"]'));
  const accessibleName = (el) =>
    (el.getAttribute("aria-label") ?? el.getAttribute("title") ?? "").trim() ||
    [...el.childNodes]
      .map((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          return node.textContent;
        }
        if (node.nodeType !== Node.ELEMENT_NODE || hiddenFromAt(node)) {
          return "";
        }
        if (node.tagName === "IMG") {
          return node.getAttribute("alt") ?? "";
        }
        return node.classList.contains("sr-only") || visible(node) ? node.textContent : "";
      })
      .join("")
      .trim();

  const targets = [...document.querySelectorAll(TARGETS)].filter(visible);
  const rects = targets.map((el) => el.getBoundingClientRect());

  const isInline = (el) => {
    if (el.tagName !== "A" || getComputedStyle(el).display !== "inline") {
      return false;
    }
    const block = el.parentElement;
    return (block?.textContent ?? "").trim().length > (el.textContent ?? "").trim().length + 10;
  };
  const distanceToRect = (x, y, rect) => {
    const dx = Math.max(rect.left - x, 0, x - rect.right);
    const dy = Math.max(rect.top - y, 0, y - rect.bottom);
    return Math.hypot(dx, dy);
  };
  const smallTargets = [];
  targets.forEach((el, index) => {
    const rect = rects[index];
    if ((rect.width >= 24 && rect.height >= 24) || isInline(el)) {
      return;
    }
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const crowded = rects.some((other, otherIndex) => {
      if (
        otherIndex === index ||
        targets[otherIndex].contains(el) ||
        el.contains(targets[otherIndex])
      ) {
        return false;
      }
      return distanceToRect(cx, cy, other) < 12;
    });
    if (crowded) {
      smallTargets.push({
        el: describe(el),
        size: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
      });
    }
  });

  const icons = [...document.querySelectorAll('i[class*="fa-"], svg')]
    .filter((el) => !el.parentElement?.closest("svg") && visible(el))
    .map((el) => {
      const rect = el.getBoundingClientRect();
      const context = CONTEXTS.find(([, selector]) => el.closest(selector))?.[0] ?? "content";
      const control = el.closest('a, button, [role="button"]');
      return {
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === "string" ? el.className : "",
        context,
        fontSize: getComputedStyle(el).fontSize,
        box: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
        /* Hidden by aria-hidden, or a glyph whose CSS alt text is empty (global.scss). */
        hidden: hiddenFromAt(el) || getComputedStyle(el, "::before").content.endsWith('/ ""'),
        iconOnlyControlWithoutName: Boolean(control) && accessibleName(control) === "",
      };
    });

  const vw = document.documentElement.clientWidth;
  const overflowing = [...document.body.querySelectorAll("*")]
    .filter(
      (el) => !el.closest("[inert]") && visible(el) && el.getBoundingClientRect().right > vw + 1
    )
    .filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= vw + 1)
    .filter(
      (el) => !el.closest('[style*="overflow"], .overflow-x-auto, .overflow-hidden, pre, table')
    )
    .slice(0, 15)
    .map(describe);

  const headings = [...document.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter(visible);
  const headingSkips = [];
  headings.forEach((heading, index) => {
    const level = Number(heading.tagName[1]);
    const previous = index === 0 ? 0 : Number(headings[index - 1].tagName[1]);
    if (level > previous + 1) {
      headingSkips.push(`h${previous}->h${level} ${describe(heading)}`);
    }
  });

  const linkNames = new Map();
  document.querySelectorAll("a[href]").forEach((link) => {
    if (!visible(link)) {
      return;
    }
    const name = accessibleName(link).toLowerCase();
    const hrefs = linkNames.get(name) ?? new Set();
    hrefs.add(link.getAttribute("href"));
    linkNames.set(name, hrefs);
  });
  const ambiguousLinks = [...linkNames]
    .filter(([, hrefs]) => hrefs.size > 1)
    .map(([name, hrefs]) => `${name} (${hrefs.size} targets)`);

  return {
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
    h1Count: document.querySelectorAll("h1").length,
    landmarks: {
      main: document.querySelectorAll('main, [role="main"]').length,
      banner: document.querySelectorAll("body > header, [role='banner']").length,
      contentinfo: document.querySelectorAll("body > footer, [role='contentinfo']").length,
      navUnnamed: [...document.querySelectorAll("nav")].filter(
        (nav) => !nav.getAttribute("aria-label")
      ).length,
    },
    skipLink: Boolean(document.querySelector('a[href="#main-content"]')),
    horizontalScroll: document.documentElement.scrollWidth > vw,
    overflowing,
    smallTargets,
    icons,
    headingSkips,
    ambiguousLinks,
    infiniteAnimations: document
      .getAnimations()
      .filter(
        (animation) =>
          animation.effect?.getTiming().iterations === Infinity && animation.playState === "running"
      )
      .map((animation) => describe(animation.effect.target)),
  };
}

/** Where focus is and whether it can be seen, after one Tab press. */
export function focusSnapshot() {
  const el = document.activeElement;
  if (!el || el === document.body) {
    return null;
  }
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const outline = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
  const ring = style.boxShadow !== "none";
  const pinned = (node) => {
    for (let at = node; at && at !== document.body; at = at.parentElement) {
      if (["sticky", "fixed"].includes(getComputedStyle(at).position)) {
        return at;
      }
    }
    return null;
  };
  const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  const bar = top && !el.contains(top) && !top.contains(el) ? pinned(top) : null;
  const cover = bar && !bar.contains(el) ? bar : null;
  const text = (el.getAttribute("aria-label") ?? el.textContent ?? "")
    .trim()
    .replaceAll(/\s+/g, " ")
    .slice(0, 40);
  return {
    el: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} "${text}"`,
    indicator: outline || ring,
    obscured: Boolean(cover),
  };
}
