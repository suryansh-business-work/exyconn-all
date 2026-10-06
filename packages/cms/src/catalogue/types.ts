/**
 * One dynamic component: a section of the website rendered by Astro on the server, which an
 * editor drops into a page and configures through its props. Data only — the website maps each
 * key to its Astro component (src/components/cms/registry.ts) and checks the two lists agree.
 */
export interface CmsComponentDef {
  /** Stable id, area-prefixed: 'home.hero', 'service.layout', 'chrome.header'. */
  key: string;
  label: string;
  /** Groups the editor's block panel: 'Home', 'Services', 'AI', 'Forms', 'Collections', 'Chrome'… */
  category: string;
  description: string;
  /**
   * Props a newly dropped instance starts with. The shape is also the editing form: strings,
   * numbers and booleans become fields, arrays repeatable lists, objects groups.
   */
  defaultProps: Record<string, unknown>;
  /** True when the component renders children dropped inside it (a container). */
  acceptsChildren?: boolean;
}
