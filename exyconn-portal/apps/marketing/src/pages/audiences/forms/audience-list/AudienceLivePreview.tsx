import { useState } from 'react';
import { useFormatters, useT } from '@exyconn/i18n';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Flex,
  Text,
} from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import type { AudienceListInput } from '@exyconn/shell/graphql/generated';
import { BuilderSection } from './BuilderSection';
import { useAudiencePreview } from './useAudiencePreview';
import { AudienceCountsGrid } from '../../AudienceCountsGrid';
import { AudienceRecipientsGrid } from '../../AudienceRecipientsGrid';

interface AudienceLivePreviewProps {
  input: AudienceListInput;
}

/**
 * The live counts and, pinned to the bottom of the screen, the one number that matters:
 * how many unique addresses a campaign to this audience would actually reach.
 */
export function AudienceLivePreview({ input }: Readonly<AudienceLivePreviewProps>) {
  const t = useT();
  const { formatNumber, formatDateTime } = useFormatters();
  const preview = useAudiencePreview(input);
  const [showRecipients, setShowRecipients] = useState(false);
  const eligible = preview.counts ? formatNumber(preview.counts.eligible) : '—';
  const status = preview.updating
    ? t('Updating counts…')
    : preview.resolvedAt &&
      t('Last refreshed {time}', { time: formatDateTime(preview.resolvedAt) });

  return (
    <>
      <BuilderSection
        title="Live audience preview"
        hint="Counts come from the CRM and refresh as you change the settings."
      >
        {preview.error && (
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={preview.retry}>
                {t('Retry')}
              </Button>
            }
          >
            {t(preview.error)}
          </Alert>
        )}
        <AudienceCountsGrid counts={preview.counts} stale={preview.updating} />
      </BuilderSection>
      <Card
        variant="outlined"
        sx={{ position: 'sticky', bottom: 0, zIndex: 2, bgcolor: 'background.paper' }}
      >
        <CardContent>
          <Flex
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'center' }}
            gap={1}
          >
            <Box role="status" aria-live="polite">
              <Text size="sm" color="text.secondary" sx={{ display: 'block' }}>
                {t('Final eligible recipients')}
              </Text>
              <Flex direction="row" alignItems="center" gap={1}>
                <Text size="lg" weight="bold" sx={{ opacity: preview.updating ? 0.55 : 1 }}>
                  {eligible}
                </Text>
                {preview.updating && <CircularProgress size={16} aria-hidden />}
              </Flex>
              <Text size="caption" color="text.secondary" sx={{ display: 'block' }}>
                {status ||
                  t(
                    'Unique email addresses eligible for the campaign after filtering, deduplication and exclusions.',
                  )}
              </Text>
            </Box>
            <Button
              variant="outlined"
              startIcon={<VisibilityIcon />}
              onClick={() => setShowRecipients(true)}
            >
              {t('Preview recipients')}
            </Button>
          </Flex>
        </CardContent>
      </Card>
      <CrudDialog
        open={showRecipients}
        title={t('Recipients')}
        onClose={() => setShowRecipients(false)}
      >
        {showRecipients && <AudienceRecipientsGrid target={{ draft: input }} />}
      </CrudDialog>
    </>
  );
}
