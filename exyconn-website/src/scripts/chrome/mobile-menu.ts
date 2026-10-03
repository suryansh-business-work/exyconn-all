/** The phone menu: a drawer (see drawer.ts) that also closes when a link or search is chosen. */
import { bindDrawer } from "./drawer";

const menu = bindDrawer("mobileMenu");

for (const link of document.querySelectorAll("#mobileMenu a, #mobileMenu [data-search-open]")) {
  link.addEventListener("click", () => menu?.close());
}
