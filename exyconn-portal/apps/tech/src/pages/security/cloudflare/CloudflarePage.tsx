import { useSearchParams } from 'react-router-dom';
import { Alert, Box, MenuItem, TextField } from '@exyconn/shell/components/ui';
import { PageHeader } from '@exyconn/shell/components/layout/PageHeader';
import { useT } from '@exyconn/i18n';
import { useDnsDomainsQuery } from '@exyconn/shell/graphql/generated';
import { DomainDnsView } from './DomainDnsView';

export const CLOUDFLARE_PATH = '/tech/security/cloudflare';

/**
 * Tech > Security > Cloudflare — move a domain's DNS from GoDaddy to Cloudflare. The domains
 * come from the GoDaddy account and the chosen one is kept in the URL, so a link opens the
 * same domain. Credentials live in Tech > Environment Variables (GoDaddy, Cloudflare).
 */
export function CloudflarePage() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const { data, loading, error } = useDnsDomainsQuery();
  const domains = data?.dnsDomains ?? [];
  const domain = params.get('domain') ?? domains[0]?.domain ?? '';

  return (
    <Box>
      <PageHeader
        title="Cloudflare"
        subtitle="Compare a domain's DNS on GoDaddy and Cloudflare, shift the records, and switch its nameservers"
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}
      <TextField
        select
        label={t('Domain')}
        value={domains.some((row) => row.domain === domain) ? domain : ''}
        onChange={(event) => setParams({ domain: event.target.value })}
        disabled={loading || domains.length === 0}
        helperText={
          !loading && domains.length === 0 && !error
            ? t('No domains on the GoDaddy account.')
            : undefined
        }
        sx={{ mb: 2, minWidth: { xs: '100%', sm: 320 } }}
      >
        {domains.map((row) => (
          <MenuItem key={row.domain} value={row.domain}>
            {row.domain}
          </MenuItem>
        ))}
      </TextField>
      {domain && <DomainDnsView key={domain} domain={domain} />}
    </Box>
  );
}
