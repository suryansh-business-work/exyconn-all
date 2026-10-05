/** The host, the launcher, the panel frame and the shared controls. Colours: --cw-* only. */
export const baseCss = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
[hidden] { display: none !important; }
.cw-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.cw-icon { width: 20px; height: 20px; fill: currentColor; flex: none; }
button { font: inherit; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: 0.6; }
:focus-visible { outline: 3px solid var(--cw-focus); outline-offset: 2px; }

.cw-launcher {
  position: fixed; right: 20px; bottom: 20px; z-index: var(--cw-z-index);
  width: 60px; height: 60px; border-radius: 50%; border: 0;
  display: grid; place-items: center;
  background: var(--cw-primary); color: var(--cw-on-primary); box-shadow: var(--cw-shadow);
  transition: transform 0.2s ease;
}
.cw-launcher:hover { transform: scale(1.05); }
.cw-launcher .cw-icon { width: 28px; height: 28px; }
.cw-badge {
  position: absolute; top: -2px; right: -2px; min-width: 22px; height: 22px; padding: 0 6px;
  border-radius: 11px; display: grid; place-items: center;
  font: 700 12px/1 var(--cw-font-family);
  background: var(--cw-danger); color: var(--cw-on-danger); border: 2px solid var(--cw-surface);
  animation: cw-pulse 1.8s ease-out 3;
}
@keyframes cw-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--cw-danger) 55%, transparent); }
  100% { box-shadow: 0 0 0 12px color-mix(in srgb, var(--cw-danger) 0%, transparent); }
}

.cw-panel {
  position: fixed; right: 20px; bottom: 92px; z-index: var(--cw-z-index);
  width: 380px; height: min(640px, calc(100vh - 120px)); max-height: calc(100dvh - 120px);
  display: flex; flex-direction: column; overflow: hidden;
  font: 400 14px/1.5 var(--cw-font-family); color: var(--cw-text);
  background: var(--cw-surface); border: 1px solid var(--cw-border);
  border-radius: var(--cw-radius); box-shadow: var(--cw-shadow);
  opacity: 0; transform: translateY(12px) scale(0.96); transform-origin: bottom right;
  visibility: hidden;
  transition: opacity 0.2s ease, transform 0.2s ease, visibility 0s linear 0.2s;
}
.cw-panel.cw-open { opacity: 1; transform: none; visibility: visible; transition-delay: 0s; }

.cw-header {
  position: relative; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 12px 12px 12px 16px; background: var(--cw-primary); color: var(--cw-on-primary);
}
.cw-title { margin: 0; font-size: 16px; font-weight: 700; line-height: 1.3; }
.cw-status { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 12px; }
.cw-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--cw-offline); box-shadow: 0 0 0 2px var(--cw-on-primary); }
.cw-dot.cw-online { background: var(--cw-online); }
.cw-header-actions { display: flex; gap: 4px; }
.cw-header .cw-icon-button { color: var(--cw-on-primary); }
.cw-header .cw-icon-button:focus-visible { outline-color: var(--cw-on-primary); }
.cw-icon-button {
  width: 36px; height: 36px; border: 0; border-radius: var(--cw-radius-control);
  display: inline-grid; place-items: center; background: transparent; color: var(--cw-text-muted);
}
.cw-icon-button:hover { background: color-mix(in srgb, currentColor 12%, transparent); }

.cw-menu {
  position: absolute; top: calc(100% - 4px); right: 12px; z-index: 2; min-width: 230px; padding: 6px;
  background: var(--cw-surface); color: var(--cw-text); border: 1px solid var(--cw-border);
  border-radius: var(--cw-radius-control); box-shadow: var(--cw-shadow);
}
.cw-menu-item {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border: 0;
  border-radius: var(--cw-radius-control); background: transparent; color: var(--cw-text); text-align: left;
}
.cw-menu-item:hover { background: var(--cw-surface-muted); }
.cw-confirm { padding: 8px; }
.cw-confirm p { margin: 0 0 10px; }

.cw-tabs { display: flex; border-bottom: 1px solid var(--cw-border); background: var(--cw-surface); }
.cw-tab {
  flex: 1; padding: 12px 6px; border: 0; border-bottom: 3px solid transparent;
  background: transparent; color: var(--cw-text-muted); font-weight: 600; font-size: 13px;
}
.cw-tab[aria-selected='true'] { color: var(--cw-primary); border-bottom-color: var(--cw-primary); }

.cw-connection, .cw-banner {
  margin: 0; padding: 8px 16px; font-size: 13px; background: var(--cw-surface-muted); color: var(--cw-text);
}
.cw-notice { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.cw-error {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 6px 8px 6px 16px; font-size: 13px; background: var(--cw-danger); color: var(--cw-on-danger);
}
.cw-error .cw-icon-button { color: var(--cw-on-danger); }
.cw-tabpanel { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.cw-tabpanel > * { flex: 1; min-height: 0; }

.cw-button {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  min-height: 40px; padding: 8px 14px; border-radius: var(--cw-radius-control);
  border: 1px solid transparent; font-weight: 600;
}
.cw-primary { background: var(--cw-primary); color: var(--cw-on-primary); }
.cw-danger { background: var(--cw-danger); color: var(--cw-on-danger); }
.cw-quiet { background: transparent; color: var(--cw-text); border-color: var(--cw-border); }
.cw-row-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 8px; }
.cw-muted { margin: 0; color: var(--cw-text-muted); }
.cw-center { text-align: center; }
.cw-link { color: var(--cw-primary); font-size: 13px; }

@media (max-width: 480px) {
  .cw-panel { inset: 0; width: 100%; height: 100%; max-height: none; border-radius: 0; border: 0; }
  .cw-panel.cw-open ~ .cw-launcher { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
`;
