import { Grid } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { ExtensionSessions } from './ExtensionSessions';
import { GoogleConnectionCard } from './GoogleConnectionCard';
import { LatestReleaseCard } from './LatestReleaseCard';

/** Meeting Assistant → Chrome extension: get it, install it, and manage its connections. */
export function ExtensionPage() {
  return (
    <>
      <PageHeader
        title="Google Meet AI Assistant"
        subtitle="The Chrome extension that records your calls and writes the notes"
      />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <LatestReleaseCard />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <GoogleConnectionCard />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <ExtensionSessions />
        </Grid>
      </Grid>
    </>
  );
}
