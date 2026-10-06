import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import {
  useCmsFragmentQuery,
  usePublishCmsFragmentMutation,
  useSaveCmsFragmentDraftMutation,
} from '@exyconn/shell/graphql/generated';
import { useSitePath } from '../site';
import { BuilderScreen } from '../builder/BuilderScreen';
import { BuilderState } from '../builder/BuilderState';
import { useBuilderResources } from '../builder/useBuilderResources';

/** The builder for a fragment at /website/s/:siteSlug/fragments/:id/edit (no revisions). */
export function FragmentBuilderPage() {
  const t = useT();
  const { id = '' } = useParams();
  const to = useSitePath();
  const fragment = useCmsFragmentQuery({
    variables: { id },
    skip: !id,
    fetchPolicy: 'network-only',
  });
  // A fragment cannot be placed inside itself, so its own block is left out.
  const { resources, loading, error } = useBuilderResources(id);
  const [saveDraft] = useSaveCmsFragmentDraftMutation();
  const [publish] = usePublishCmsFragmentMutation();
  const doc = fragment.data?.cmsFragment;

  if (!doc || !resources) {
    return (
      <BuilderState
        loading={fragment.loading || loading}
        error={fragment.error ?? error}
        label="fragment"
      />
    );
  }
  return (
    <BuilderScreen
      key={doc.id}
      title={doc.name}
      caption={t('{kind} fragment', {
        kind: t(doc.kind.charAt(0) + doc.kind.slice(1).toLowerCase()),
      })}
      status={doc.status}
      backPath={to('fragments')}
      initial={{ html: doc.draft?.html ?? '', css: doc.draft?.css ?? '' }}
      projectData={doc.draft?.projectData}
      resources={resources}
      saveDraft={(draft) => saveDraft({ variables: { id: doc.id, draft } })}
      publish={() => publish({ variables: { id: doc.id } })}
    />
  );
}
