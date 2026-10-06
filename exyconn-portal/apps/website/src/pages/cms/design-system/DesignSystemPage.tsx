import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Alert, Box, Button, CircularProgress, Paper } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useCmsDesignSystemsQuery,
  useCreateCmsDesignSystemMutation,
} from '@exyconn/shell/graphql/generated';
import { DesignSystemForm } from '../../website/forms/cms-design-system';
import { useCurrentSite, useSitePath } from '../site';

/** Website › Design System: the current site's colours, type, radii, shadows and spacing. */
export function DesignSystemPage() {
  const t = useT();
  const notify = useNotify();
  const navigate = useNavigate();
  const to = useSitePath();
  const { site } = useCurrentSite();
  const { data, loading, error, refetch } = useCmsDesignSystemsQuery({
    variables: { siteId: site.id },
    fetchPolicy: 'cache-and-network',
  });
  const [create, creating] = useCreateCmsDesignSystemMutation();
  const designs = data?.cmsDesignSystems ?? [];
  // The one the site wears; a site that points at none shows its first.
  const design = designs.find((candidate) => candidate.id === site.designSystemId) ?? designs[0];

  const start = () => {
    create({
      variables: { input: { siteId: site.id, name: `${site.name} design system`, tokens: {} } },
    })
      .then(() => refetch())
      .catch((reason: unknown) =>
        notify(errorMessage(reason, 'Could not create the design system'), 'error'),
      );
  };

  let body;
  if (design) {
    body = (
      <DesignSystemForm
        key={design.id}
        design={design}
        basePath={to('design-system')}
        onCancel={() => navigate(to())}
        onDone={() => {
          refetch().catch((reason: unknown) =>
            notify(errorMessage(reason, 'Reload failed'), 'error'),
          );
        }}
      />
    );
  } else if (loading) {
    body = (
      <Box sx={{ display: 'grid', placeItems: 'center', py: 6 }}>
        <CircularProgress aria-label={t('Loading the design system')} />
      </Box>
    );
  } else if (error) {
    body = <Alert severity="error">{error.message}</Alert>;
  } else {
    body = (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" disabled={creating.loading} onClick={start}>
            {t('Create one')}
          </Button>
        }
      >
        {t('This site has no design system yet.')}
      </Alert>
    );
  }

  return (
    <>
      <PageHeader
        title="Design System"
        subtitle="Colours, type and shape of {site}, as CSS custom properties"
        subtitleValues={{ site: site.name }}
      />
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        {body}
      </Paper>
    </>
  );
}
