/** One entry of the dynamic-component catalogue, as the builder needs it. */
export interface CmsCatalogueEntry {
  key: string;
  label: string;
  category: string;
  description: string;
  defaultProps: Record<string, unknown>;
  acceptsChildren: boolean;
}

/** A fragment of the site the page can place. */
export interface CmsFragmentOption {
  id: string;
  name: string;
  kind: string;
}

/** What the builder asks the host when an editor opens a component's settings. */
export interface CmsEditRequest {
  key: string;
  label: string;
  props: Record<string, unknown>;
  /** Writes new props back into the component on the canvas. */
  apply: (props: Record<string, unknown>) => void;
}

export interface CmsPluginOptions {
  components: readonly CmsCatalogueEntry[];
  fragments: readonly CmsFragmentOption[];
  /** Opens the host's props form for a component. */
  onEditComponent: (request: CmsEditRequest) => void;
}
