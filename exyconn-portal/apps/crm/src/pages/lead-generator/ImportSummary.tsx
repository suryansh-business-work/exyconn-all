import { Link as RouterLink } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Stack, Text } from '@exyconn/shell/components/ui';
import type { LeadImportResult } from './leadTypes';

interface ImportSummaryProps {
  summary: LeadImportResult;
  onClose: () => void;
}

/** What "Add to CRM" did: how many companies were filed and why any were skipped. */
export function ImportSummary({ summary, onClose }: Readonly<ImportSummaryProps>) {
  const t = useT();
  return (
    <Alert
      severity={summary.created > 0 ? 'success' : 'info'}
      onClose={onClose}
      action={
        <Button component={RouterLink} to="/crm/companies" color="inherit" size="small">
          {t('View companies')}
        </Button>
      }
    >
      <Stack spacing={0.5}>
        <Text>
          {t('{created} companies added to the CRM, {skipped} skipped.', {
            created: summary.created,
            skipped: summary.skipped,
          })}
        </Text>
        {summary.skips.map((skip) => (
          <Text key={skip.placeId} size="caption">
            {t('{name}: {reason}', { name: skip.name, reason: skip.reason })}
          </Text>
        ))}
      </Stack>
    </Alert>
  );
}
