/*
 * Exyconn visitor chat — the one-line loader.
 *
 *   <script src="https://exyconn.com/embed/chat.js" data-site="TOOLS" defer></script>
 *
 * Adds ONE iframe in the bottom-right corner that shows the chat served by the website at
 * <origin>/embed/chat (origin = wherever this file was loaded from). The chat inside the iframe
 * asks for the size it needs; this file only places the iframe and keeps it in step with the
 * page:
 *
 *   iframe -> page  { source: 'exy-chat', type: 'ready' | 'resize' | 'unread', ... }
 *   page -> iframe  { source: 'exy-chat-host', type: 'page' | 'theme' | 'layout', ... }
 *
 * Messages are only accepted from the iframe's own origin and window. Plain ES2019, no
 * dependencies, nothing global except a guard against loading twice.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || window.__exyconnChat) {
    return;
  }
  window.__exyconnChat = true;

  var ORIGIN = new URL(script.src, window.location.href).origin;
  var SITE = (script.getAttribute("data-site") || "WEBSITE").toUpperCase();
  var DARK_QUERY = window.matchMedia("(prefers-color-scheme: dark)");
  /** Phones: the open chat takes the whole screen. */
  var COMPACT_QUERY = window.matchMedia("(max-width: 480px)");

  /** Room for the round launcher, its shadow and its unread badge. */
  var CLOSED = { right: "0", bottom: "0", width: "96px", height: "96px" };
  var OPEN = {
    right: "12px",
    bottom: "12px",
    width: "min(420px, calc(100vw - 24px))",
    height: "min(700px, calc(100vh - 24px))",
  };
  var FULL = { right: "0", bottom: "0", width: "100%", height: "100%" };

  var frame = null;
  var state = "closed";
  var unread = 0;
  var titlePrefix = "";

  /** The page's light/dark mode: its own <html data-theme>, else the operating system's. */
  function hostTheme() {
    var attribute = document.documentElement.getAttribute("data-theme");
    if (attribute === "light" || attribute === "dark") {
      return attribute;
    }
    return DARK_QUERY.matches ? "dark" : "light";
  }

  function post(message) {
    if (frame && frame.contentWindow) {
      message.source = "exy-chat-host";
      frame.contentWindow.postMessage(message, ORIGIN);
    }
  }

  function postPage() {
    post({ type: "page", url: window.location.href });
  }

  function postTheme() {
    post({ type: "theme", theme: hostTheme() });
  }

  function postLayout() {
    post({ type: "layout", compact: COMPACT_QUERY.matches });
  }

  function place(box) {
    frame.style.display = "block";
    frame.style.right = box.right;
    frame.style.bottom = box.bottom;
    frame.style.width = box.width;
    frame.style.height = box.height;
  }

  /** Sizes the iframe for what the chat shows: the launcher, the panel, or nothing. */
  function applySize() {
    if (state === "hidden") {
      frame.style.display = "none";
    } else if (state === "open") {
      place(COMPACT_QUERY.matches ? FULL : OPEN);
    } else {
      place(CLOSED);
    }
  }

  /** "(2) Page title" while replies wait unread; the page's own title otherwise. */
  function applyTitle() {
    var title = document.title;
    var base =
      titlePrefix && title.indexOf(titlePrefix) === 0 ? title.slice(titlePrefix.length) : title;
    titlePrefix = unread > 0 ? "(" + unread + ") " : "";
    document.title = titlePrefix + base;
  }

  function onMessage(event) {
    var data = event.data;
    if (event.origin !== ORIGIN || !frame || event.source !== frame.contentWindow) {
      return;
    }
    if (!data || typeof data !== "object" || data.source !== "exy-chat") {
      return;
    }
    if (data.type === "ready") {
      postPage();
      postTheme();
      postLayout();
    } else if (data.type === "resize" && /^(closed|open|hidden)$/.test(data.state)) {
      state = data.state;
      applySize();
    } else if (data.type === "unread" && typeof data.count === "number") {
      unread = Math.max(0, Math.floor(data.count));
      applyTitle();
    }
  }

  /** Single-page apps change the URL without a load: report every change, keep the title prefix. */
  function onNavigate() {
    postPage();
    // The app sets its new title after the URL changes.
    window.setTimeout(applyTitle, 0);
  }

  function watchNavigation() {
    ["pushState", "replaceState"].forEach(function (name) {
      var original = window.history[name];
      window.history[name] = function () {
        var result = original.apply(this, arguments);
        onNavigate();
        return result;
      };
    });
    window.addEventListener("popstate", onNavigate);
  }

  function watchTheme() {
    new MutationObserver(postTheme).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    DARK_QUERY.addEventListener("change", postTheme);
    COMPACT_QUERY.addEventListener("change", function () {
      applySize();
      postLayout();
    });
  }

  function start() {
    var src = new URL("/embed/chat", ORIGIN);
    src.searchParams.set("site", SITE);
    src.searchParams.set("theme", hostTheme());

    frame = document.createElement("iframe");
    frame.title = "Chat with Exyconn";
    frame.src = src.toString();
    frame.setAttribute("allow", "microphone; autoplay; clipboard-write");
    frame.setAttribute("data-exyconn-chat", "");
    var style = frame.style;
    style.position = "fixed";
    style.border = "0";
    style.margin = "0";
    style.padding = "0";
    style.background = "transparent";
    // Matching the page's colour scheme would paint the iframe opaque; "normal" keeps it clear.
    style.colorScheme = "normal";
    style.zIndex = "2147483000";
    style.maxWidth = "100%";
    style.maxHeight = "100%";
    applySize();

    window.addEventListener("message", onMessage);
    watchNavigation();
    watchTheme();
    document.body.appendChild(frame);
  }

  // Never compete with the page's own first paint.
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 4000 });
  } else {
    window.setTimeout(start, 2000);
  }
})();
