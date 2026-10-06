import type { CmsBlock } from "@exyconn/cms";
import type { Branding } from "../portal/types";
import type { CmsFragment, CmsPageDetail, CmsRenderContext } from "./types";

/** Everything a page's components can read besides their props (see CmsRenderContext). */
export function renderContext(
  siteId: string,
  branding: Branding,
  variables: Readonly<Record<string, string>>,
  params: Readonly<Record<string, string>>,
  fragments: readonly CmsFragment[],
  site: string,
  detail: CmsPageDetail | null
): CmsRenderContext {
  return {
    siteId,
    branding,
    variables,
    params,
    fragments: new Map<string, readonly CmsBlock[]>(fragments.map((f) => [f.id, f.blocks])),
    site,
    detail,
  };
}

/** The CSS every placed fragment brings, in the order given, without repeats. */
export function fragmentsCss(fragments: readonly CmsFragment[]): string {
  const seen = new Set<string>();
  return fragments
    .filter((fragment) => fragment.css !== "" && !seen.has(fragment.id) && seen.add(fragment.id))
    .map((fragment) => fragment.css)
    .join("\n");
}
