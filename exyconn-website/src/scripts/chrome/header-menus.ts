/**
 * The desktop dropdowns follow the disclosure pattern: a button that shows and hides a
 * panel of ordinary links. Opening one closes the others; Escape, a click elsewhere or
 * tabbing out of the dropdown closes it, and Escape puts focus back on its button.
 */
interface Dropdown {
  button: HTMLElement;
  panel: HTMLElement;
  wrapper: HTMLElement;
}

const dropdowns: Dropdown[] = [
  ...document.querySelectorAll<HTMLElement>("[data-nav-menu]"),
].flatMap((wrapper) => {
  const button = wrapper.querySelector<HTMLElement>("[aria-controls]");
  const panel = document.getElementById(button?.getAttribute("aria-controls") ?? "");
  return button && panel ? [{ button, panel, wrapper }] : [];
});

const setOpen = (dropdown: Dropdown, open: boolean): void => {
  dropdown.panel.hidden = !open;
  dropdown.button.setAttribute("aria-expanded", String(open));
};

for (const dropdown of dropdowns) {
  dropdown.button.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = dropdown.button.getAttribute("aria-expanded") !== "true";
    for (const other of dropdowns) {
      setOpen(other, other === dropdown && open);
    }
  });

  dropdown.wrapper.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dropdown.button.getAttribute("aria-expanded") === "true") {
      setOpen(dropdown, false);
      dropdown.button.focus();
    }
  });

  // Only when focus lands somewhere else: a click on the panel's padding moves it nowhere.
  dropdown.wrapper.addEventListener("focusout", (event) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !dropdown.wrapper.contains(next)) {
      setOpen(dropdown, false);
    }
  });
}

document.addEventListener("click", (event) => {
  for (const dropdown of dropdowns) {
    if (!(event.target instanceof Node && dropdown.panel.contains(event.target))) {
      setOpen(dropdown, false);
    }
  }
});
