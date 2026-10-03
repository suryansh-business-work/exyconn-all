/** Shapes of the data inner-page components take. Pages build these from src/lib, Tina or the API. */
export type { Crumb, FaqItem } from "../../lib/inner/structured-data";
export type { ArchitectureLayer } from "../../lib/inner/architecture";
export type { TocEntry } from "../../lib/inner/headings";
export type { PageFamily, SceneConfig } from "../../scripts/stage3d/inner/config";

export interface InnerAction {
  label: string;
  href: string;
  /** Opens in a new tab, announced to screen readers. */
  external?: boolean;
}

/** A date both machine-readable and already formatted for the reader (date-fns, market locale). */
export interface DisplayDate {
  iso: string;
  text: string;
}

/** `data-*` attributes passed through to a component's root, e.g. FilterBar's `data-filter-item`. */
export type DataAttributes = Readonly<{
  [key: `data-${string}`]: string | number | boolean | undefined;
}>;
