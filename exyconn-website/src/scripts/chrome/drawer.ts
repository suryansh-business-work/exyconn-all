/**
 * One side drawer of the chrome — the phone menu, the accessibility and cookie drawers.
 *
 * Markup contract: the drawer is `role="dialog" aria-modal="true" data-open="false"` with an
 * id; its backdrop carries `data-drawer-backdrop="<id>"`; any button anywhere with
 * `data-drawer-open="<id>"` opens it and `data-drawer-close="<id>"` closes it. While closed
 * the drawer is `visibility: hidden` (styles/chrome.css) and modal-dialogs.ts makes it inert,
 * so nothing of it shows or takes focus. Opening another drawer from inside this one (the
 * phone menu's "Accessibility" row) closes this one first.
 */
export interface DrawerControl {
  open: () => void;
  close: () => void;
}

const LOCK_CLASS = "chrome-locked";

const isOpen = (drawer: HTMLElement): boolean => drawer.dataset.open === "true";

function setState(drawer: HTMLElement, backdrop: HTMLElement, open: boolean): void {
  drawer.dataset.open = String(open);
  backdrop.dataset.open = String(open);
  for (const opener of document.querySelectorAll(`[data-drawer-open="${drawer.id}"]`)) {
    opener.setAttribute("aria-expanded", String(open));
  }
  // Locked while ANY drawer is open: one may close as another opens, in either order.
  const anyOpen = document.querySelector('[data-drawer-backdrop][data-open="true"]') !== null;
  document.documentElement.classList.toggle(LOCK_CLASS, anyOpen);
}

export function bindDrawer(id: string, onOpen?: () => void): DrawerControl | null {
  const drawer = document.getElementById(id);
  const backdrop = document.querySelector<HTMLElement>(`[data-drawer-backdrop="${id}"]`);
  if (!drawer || !backdrop) {
    return null;
  }
  let returnFocus: HTMLElement | null = null;

  const open = (): void => {
    onOpen?.();
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setState(drawer, backdrop, true);
    requestAnimationFrame(() => drawer.focus({ preventScroll: true }));
  };

  const close = (restoreFocus = true): void => {
    if (!isOpen(drawer)) {
      return;
    }
    setState(drawer, backdrop, false);
    if (restoreFocus && returnFocus?.isConnected && !returnFocus.closest("[inert]")) {
      returnFocus.focus();
    }
  };

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const opener = target?.closest<HTMLElement>("[data-drawer-open]");
    if (opener?.dataset.drawerOpen === id) {
      open();
    } else if (opener && isOpen(drawer) && drawer.contains(opener)) {
      close(false);
    } else if (target?.closest(`[data-drawer-close="${id}"]`)) {
      close();
    }
  });
  backdrop.addEventListener("click", () => close());
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      close();
    }
  });

  return { open, close: () => close() };
}
