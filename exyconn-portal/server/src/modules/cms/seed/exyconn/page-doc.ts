import type { CmsSeedPage } from '../types';
import { place } from './pages/place';

/** A catalogue component in a page document; without `props` it wears its catalogue defaults. */
export interface CmsSeedComponentNode {
  component: string;
  props?: Record<string, unknown>;
  children?: CmsSeedNode[];
}

/** One node of a page document's body: a placed component, or literal HTML around components. */
export type CmsSeedNode = string | CmsSeedComponentNode;

/**
 * A seeded page as content: what a page says (pages/**.json), apart from how every page is put
 * together. All of them are published pages on the default layout with no CSS of their own.
 */
export interface CmsSeedPageDoc {
  key: string;
  path: string;
  title: string;
  seo: CmsSeedPage['seo'];
  body: CmsSeedNode[];
}

const nodeHtml = (node: CmsSeedNode): string =>
  typeof node === 'string' ? node : place(node.component, node.props, bodyHtml(node.children));

function bodyHtml(nodes: CmsSeedNode[] = []): string {
  return nodes.map(nodeHtml).join('');
}

/** The seed page a page document describes. */
export function seedPage(doc: CmsSeedPageDoc): CmsSeedPage {
  return {
    key: doc.key,
    path: doc.path,
    kind: 'PAGE',
    title: doc.title,
    layout: 'default',
    seo: doc.seo,
    html: bodyHtml(doc.body),
    css: '',
  };
}
