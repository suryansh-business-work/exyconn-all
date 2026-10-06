import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Paper } from '@exyconn/shell/components/ui';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { CmsSiteForm } from '../../website/forms/cms-site';
import { sitePath, useCurrentSite } from '../site';
import { DomainsDnsPanel } from '../dns';

/** Website › Settings: the current site's domains, search defaults, layout and code. */
export function SiteSettingsPage() {
  const navigate = useNavigate();
  const { site, refetchSites } = useCurrentSite();
  const notify = useNotify();
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="How {site} is served"
        subtitleValues={{ site: site.name }}
      />
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <CmsSiteForm
          key={site.id}
          initial={site}
          onCancel={() => navigate(sitePath(site.slug))}
          onDone={() => {
            refetchSites().catch((error: unknown) =>
              notify(errorMessage(error, 'Reload failed'), 'error'),
            );
          }}
          onSaved={(saved) => {
            if (saved.slug !== site.slug)
              navigate(sitePath(saved.slug, 'settings'), { replace: true });
          }}
        />
      </Paper>
      <DomainsDnsPanel key={site.id} siteId={site.id} />
    </>
  );
}
