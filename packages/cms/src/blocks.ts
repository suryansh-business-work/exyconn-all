/**
 * What a CMS page or fragment compiles to, and what the website renders, in order.
 *
 * The editor (GrapesJS) works in HTML. Anything that is not plain HTML — a server-rendered
 * section of the website, or a reusable fragment such as the header — sits in that HTML as a
 * placeholder element, and compiling turns the HTML into this tree. An `html` segment may be
 * unbalanced (an opening tag before a component, its closing tag after): the website writes the
 * segments out one after another, so the document they make together is what the editor saw.
 */
export type CmsBlock = CmsHtmlBlock | CmsComponentBlock | CmsFragmentBlock;

export interface CmsHtmlBlock {
  kind: 'html';
  html: string;
}

export interface CmsComponentBlock {
  kind: 'component';
  /** A key of the component catalogue (CMS_COMPONENTS), e.g. 'home.hero'. */
  key: string;
  props: Record<string, unknown>;
  /** What a container component renders in its slot. Empty for a leaf. */
  children: CmsBlock[];
}

export interface CmsFragmentBlock {
  kind: 'fragment';
  fragmentId: string;
}

/** A compiled page or fragment: the blocks, and the CSS the editor produced for them. */
export interface CmsCompiled {
  blocks: CmsBlock[];
  css: string;
}

/** The placeholder for a server-rendered component: `<exy-component data-key data-props>`. */
export const COMPONENT_TAG = 'exy-component';
/** The placeholder for a fragment: `<exy-fragment data-fragment-id>`. */
export const FRAGMENT_TAG = 'exy-fragment';
