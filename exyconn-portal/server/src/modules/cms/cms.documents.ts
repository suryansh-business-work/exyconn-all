import {
  CmsCompileError,
  cmsComponent,
  compileHtml,
  fragmentIdsOf,
  type CmsBlock,
  type CmsCompiled,
} from '@exyconn/cms';
import { badRequest } from '../../utils/errors';
import { CmsFragmentModel } from './models';

/** What the editor saves: GrapesJS's project (to reopen it) and the HTML and CSS it produced. */
export interface CmsDraftInput {
  projectData?: unknown;
  html: string;
  css: string;
}

const MAX_HTML = 2_000_000;
const MAX_CSS = 1_000_000;

/** Checks a draft's size before it is stored: a runaway paste must not fill the database. */
export function assertDraft(draft: CmsDraftInput): void {
  if (draft.html.length > MAX_HTML || draft.css.length > MAX_CSS) {
    badRequest('This page is too large to save. Split it into fragments.');
  }
}

function unknownComponents(blocks: readonly CmsBlock[]): string[] {
  const missing = new Set<string>();
  const visit = (list: readonly CmsBlock[]) => {
    for (const block of list) {
      if (block.kind === 'component') {
        if (!cmsComponent(block.key)) {
          missing.add(block.key);
        }
        visit(block.children);
      }
    }
  };
  visit(blocks);
  return [...missing];
}

/**
 * Compiles a draft into what visitors see, refusing anything the website could not render: a
 * malformed placeholder, a component the catalogue does not know, a fragment of another site,
 * or a fragment placed inside itself.
 */
export async function compileDraft(
  draft: CmsDraftInput,
  siteId: string,
  selfFragmentId?: string,
): Promise<CmsCompiled> {
  let compiled: CmsCompiled;
  try {
    compiled = compileHtml(draft.html, draft.css);
  } catch (error) {
    if (error instanceof CmsCompileError) {
      badRequest(error.message);
    }
    throw error;
  }
  const missing = unknownComponents(compiled.blocks);
  if (missing.length > 0) {
    badRequest(`Unknown component: ${missing.join(', ')}.`);
  }
  const fragmentIds = fragmentIdsOf(compiled.blocks);
  if (selfFragmentId && fragmentIds.includes(selfFragmentId)) {
    badRequest('A fragment cannot contain itself.');
  }
  if (fragmentIds.length > 0) {
    const found = await CmsFragmentModel.countDocuments({
      _id: { $in: fragmentIds.filter((id) => /^[a-f\d]{24}$/i.test(id)) },
      siteId,
    });
    if (found !== fragmentIds.length) {
      badRequest('A fragment on this page no longer exists on this site.');
    }
  }
  return compiled;
}

/** The status after an edit: DRAFT until first published, then CHANGED. */
export function statusAfterEdit(published: unknown): 'DRAFT' | 'CHANGED' {
  return published ? 'CHANGED' : 'DRAFT';
}
