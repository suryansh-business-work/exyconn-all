import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { Paper } from '@exyconn/shell/components/ui';
import { useCurrentSite } from '../site';
import { MediaLibrary } from './MediaLibrary';

/** Website › Media: the current site's images and PDFs. */
export function MediaPage() {
  const { site } = useCurrentSite();
  return (
    <>
      <PageHeader
        title="Media"
        subtitle="Images and PDFs for {site}"
        subtitleValues={{ site: site.name }}
      />
      <Paper variant="outlined" sx={{ p: 2 }}>
        <MediaLibrary siteId={site.id} />
      </Paper>
    </>
  );
}
