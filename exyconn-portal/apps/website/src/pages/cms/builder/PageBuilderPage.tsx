import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Box, Drawer, Text } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  usePublishCmsPageMutation,
  useSaveCmsPageDraftMutation,
  useCmsPageQuery,
} from '@exyconn/shell/graphql/generated';
import { useCurrentSite, useSitePath } from '../site';
import { PageRevisionsDrawer, PageSettingsEditor, usePreviewPage, usePreviewUrl } from '../pages';
import { BuilderScreen } from './BuilderScreen';
import { BuilderState } from './BuilderState';
import { useBuilderResources } from './useBuilderResources';

/** The page builder at /website/s/:siteSlug/pages/:id/edit. */
export function PageBuilderPage() {
  const t = useT();
  const { id = '' } = useParams();
  const to = useSitePath();
  const { site } = useCurrentSite();
  const page = useCmsPageQuery({ variables: { id }, skip: !id, fetchPolicy: 'network-only' });
  const { resources, loading, error } = useBuilderResources();
  const [saveDraft] = useSaveCmsPageDraftMutation();
  const [publish] = usePublishCmsPageMutation();
  const preview = usePreviewPage();
  const previewUrl = usePreviewUrl();
  const loadPreviewUrl = useCallback(() => previewUrl(id), [previewUrl, id]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [revisionsOpen, setRevisionsOpen] = useState(false);
  // Bumped when a revision is restored, so the canvas reopens on the restored draft.
  const [generation, setGeneration] = useState(0);
  const doc = page.data?.cmsPage;
  const notify = useNotify();
  const reportReload = (reason: unknown) =>
    notify(errorMessage(reason, 'Could not reload the page'), 'error');

  if (!doc || !resources) {
    return (
      <BuilderState loading={page.loading || loading} error={page.error ?? error} label="page" />
    );
  }

  return (
    <BuilderScreen
      key={`${doc.id}-${generation}`}
      title={doc.title}
      caption={t('Page {path}', { path: doc.path })}
      status={doc.status}
      backPath={to('pages')}
      initial={{ html: doc.draft?.html ?? '', css: doc.draft?.css ?? '' }}
      projectData={doc.draft?.projectData}
      resources={resources}
      saveDraft={(draft) => saveDraft({ variables: { id: doc.id, draft } })}
      publish={() => publish({ variables: { id: doc.id } })}
      onPreview={(saveFirst) => preview(doc.id, saveFirst)}
      loadPreviewUrl={loadPreviewUrl}
      onSettings={() => setSettingsOpen(true)}
      onRevisions={() => setRevisionsOpen(true)}
    >
      <Drawer
        anchor="right"
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        sx={{ zIndex: (theme) => theme.zIndex.modal }}
      >
        <Box
          sx={{ width: { xs: '100vw', sm: 520 }, p: 2 }}
          role="region"
          aria-label={t('Page settings')}
        >
          <Text weight="bold" size="lg" component="h2" sx={{ mb: 2 }}>
            {t('Page settings')}
          </Text>
          <PageSettingsEditor
            siteId={site.id}
            pageId={doc.id}
            onCancel={() => setSettingsOpen(false)}
            onDone={() => {
              setSettingsOpen(false);
              page.refetch().catch(reportReload);
            }}
          />
        </Box>
      </Drawer>
      <PageRevisionsDrawer
        pageId={revisionsOpen ? doc.id : null}
        onClose={() => setRevisionsOpen(false)}
        onRestored={() => {
          setRevisionsOpen(false);
          page
            .refetch()
            .then(() => setGeneration((value) => value + 1))
            .catch(reportReload);
        }}
      />
    </BuilderScreen>
  );
}
