import { useMemo } from 'react';
import type { CmsCatalogueEntry, CmsFragmentOption } from '@exyconn/live-editor';
import {
  useCmsAssetsQuery,
  useCmsComponentsQuery,
  useCmsDesignSystemQuery,
  useCmsFragmentsQuery,
} from '@exyconn/shell/graphql/generated';
import { useCurrentSite } from '../site';
import { canvasCss, canvasStylesheets } from './canvas-css';

/** The asset manager starts with the newest files of the library; uploads add to it. */
const ASSET_PRELOAD = 200;

export interface BuilderResources {
  components: CmsCatalogueEntry[];
  fragments: CmsFragmentOption[];
  canvasCss: string;
  canvasStyles: string[];
  assets: string[];
}

/**
 * What the builder needs before it can mount GrapesJS (it reads its blocks and canvas once):
 * the component catalogue, the site's fragments, its design system and its media.
 */
export function useBuilderResources(excludeFragmentId?: string) {
  const { site } = useCurrentSite();
  const components = useCmsComponentsQuery({ fetchPolicy: 'cache-first' });
  const fragments = useCmsFragmentsQuery({
    variables: { siteId: site.id },
    fetchPolicy: 'network-only',
  });
  const design = useCmsDesignSystemQuery({
    variables: { id: site.designSystemId },
    skip: site.designSystemId === '',
  });
  const assets = useCmsAssetsQuery({
    variables: { siteId: site.id, page: 0, pageSize: ASSET_PRELOAD },
    fetchPolicy: 'network-only',
  });

  const loading = components.loading || fragments.loading || design.loading || assets.loading;
  const error = components.error ?? fragments.error ?? design.error ?? assets.error;

  const resources = useMemo<BuilderResources | null>(() => {
    if (!components.data || !fragments.data || !assets.data) return null;
    const system = design.data?.cmsDesignSystem;
    return {
      components: components.data.cmsComponents.map((entry) => ({
        ...entry,
        defaultProps: (entry.defaultProps ?? {}) as Record<string, unknown>,
      })),
      fragments: fragments.data.cmsFragments
        .filter((fragment) => fragment.id !== excludeFragmentId)
        .map(({ id, name, kind }) => ({ id, name, kind })),
      canvasCss: canvasCss({
        tokens: system?.tokens ?? {},
        extraCss: system?.extraCss ?? '',
        globalCss: site.globalCss,
      }),
      canvasStyles: canvasStylesheets(system?.tokens ?? {}),
      assets: assets.data.cmsAssets.rows
        .filter((asset) => asset.mime.startsWith('image/'))
        .map((asset) => asset.url),
    };
  }, [
    components.data,
    fragments.data,
    assets.data,
    design.data,
    site.globalCss,
    excludeFragmentId,
  ]);

  // GrapesJS reads its canvas CSS once, so wait for the design system before mounting it.
  const designPending = design.loading && !design.data;
  return { resources: designPending ? null : resources, loading, error };
}
