import { Grid, Stack } from '@exyconn/shell/components/ui';
import { useClientHubLinksQuery } from '@exyconn/shell/graphql/generated';
import { HubPageHeader } from '../HubPageHeader';
import { HubListState } from '../HubListState';
import { LinkCard } from './LinkCard';

/** Important links our team keeps for the client: sites, drives, design files, dashboards. */
export function LinksPage() {
  const { data, loading, error } = useClientHubLinksQuery();
  const links = data?.clientHubLinks ?? [];
  return (
    <Stack spacing={3}>
      <HubPageHeader
        title="Important links"
        subtitle="The addresses you need for your work with us, all in one place."
      />
      <HubListState
        loading={loading && !data}
        error={data ? null : error}
        errorText="Could not load the links"
        isEmpty={links.length === 0}
        emptyTitle="No links yet"
        emptyDescription="Links our team shares with you appear here."
      >
        <Grid container spacing={2}>
          {links.map((link) => (
            <Grid key={link.id} size={{ xs: 12, md: 6 }}>
              <LinkCard link={link} />
            </Grid>
          ))}
        </Grid>
      </HubListState>
    </Stack>
  );
}
