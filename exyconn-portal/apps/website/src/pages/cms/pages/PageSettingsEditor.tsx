import { useT } from '@exyconn/i18n';
import { Alert, Box, CircularProgress } from '@exyconn/shell/components/ui';
import { useCmsPageQuery } from '@exyconn/shell/graphql/generated';
import { CmsPageSettingsForm } from '../../website/forms/cms-page-settings';

interface PageSettingsEditorProps {
  siteId: string;
  /** The page to edit; null creates one. */
  pageId: string | null;
  onDone: () => void;
  onCancel: () => void;
  onCreated?: (id: string) => void;
}

/** The page settings form, with the full page (SEO included) loaded first when editing. */
export function PageSettingsEditor({
  siteId,
  pageId,
  onDone,
  onCancel,
  onCreated,
}: Readonly<PageSettingsEditorProps>) {
  const t = useT();
  const { data, loading, error } = useCmsPageQuery({
    variables: { id: pageId ?? '' },
    skip: !pageId,
    fetchPolicy: 'network-only',
  });

  if (!pageId) {
    return (
      <CmsPageSettingsForm
        siteId={siteId}
        initial={null}
        onDone={onDone}
        onCancel={onCancel}
        onCreated={onCreated}
      />
    );
  }
  if (data) {
    return (
      <CmsPageSettingsForm
        key={data.cmsPage.id}
        siteId={siteId}
        initial={data.cmsPage}
        onDone={onDone}
        onCancel={onCancel}
      />
    );
  }
  if (loading) {
    return (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}>
        <CircularProgress aria-label={t('Loading the page')} />
      </Box>
    );
  }
  return <Alert severity="error">{error?.message ?? t('That page no longer exists.')}</Alert>;
}
