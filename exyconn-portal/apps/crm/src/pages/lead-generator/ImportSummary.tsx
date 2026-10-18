import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Link, Stack, Text } from '@exyconn/shell/components/ui';
import type { LeadImportResult } from './leadTypes';

interface ImportSummaryProps {
  summary: LeadImportResult;
  onClose: () => void;
}

const companyPath = (companyId: string) => `/companies/${companyId}`;

/** What "Add to CRM" did: companies filed, existing ones updated, and why any were skipped. */
export function ImportSummary({ summary, onClose }: Readonly<ImportSummaryProps>) {
  const t = useT();
  const changed = summary.created + summary.merged > 0;
  return (
    <Alert
      severity={changed ? 'success' : 'info'}
      onClose={onClose}
      action={
        <Button component={RouterLink} to="/companies" color="inherit" size="small">
          {t('View companies')}
        </Button>
      }
    >
      <Stack spacing={0.5}>
        <Text>
          {t('{created} companies added to the CRM, {merged} updated, {skipped} skipped.', {
            created: summary.created,
            merged: summary.merged,
            skipped: summary.skipped,
          })}
        </Text>
        {summary.merges.map((merge) => (
          <Text key={merge.placeId} size="caption">
            <Link component={RouterLink} to={companyPath(merge.companyId)} color="inherit">
              {merge.name}
            </Link>
            {t(': added {fields}', {
              fields: [...new Set(merge.added.map((extra) => t(extra.label)))].join(', '),
            })}
          </Text>
        ))}
        {summary.skips.map((skip) => (
          <Text key={skip.placeId} size="caption">
            {skip.companyId ? (
              <Link component={RouterLink} to={companyPath(skip.companyId)} color="inherit">
                {skip.name}
              </Link>
            ) : (
              skip.name
            )}
            {t(': {reason}', { reason: skip.reason })}
          </Text>
        ))}
      </Stack>
    </Alert>
  );
}
