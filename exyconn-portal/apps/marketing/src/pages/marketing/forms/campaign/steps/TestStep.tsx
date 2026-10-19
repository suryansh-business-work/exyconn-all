import { useT } from '@exyconn/i18n';
import { Alert, Flex, Grid } from '@exyconn/shell/components/ui';
import { CampaignTestForm } from '../../campaign-test';
import { PreviewPane } from '../design/PreviewPane';
import { QualityChecksPanel } from '../studio/QualityChecksPanel';
import type { CampaignPreviewState } from '../design/useCampaignPreview';
import type { PreviewRecord } from '../personalize/PreviewAsField';
import type { useQualityChecks } from '../studio/useQualityChecks';

interface TestStepProps {
  campaignId: string | null;
  preview: CampaignPreviewState;
  previewRecord: PreviewRecord | null;
  checks: ReturnType<typeof useQualityChecks>;
  save: () => Promise<unknown>;
}

/** A test to a colleague, the personalised preview, and every check before the real send. */
export function TestStep({
  campaignId,
  preview,
  previewRecord,
  checks,
  save,
}: Readonly<TestStepProps>) {
  const t = useT();
  if (!campaignId) {
    return (
      <Alert severity="info">
        {t('Name the campaign so it can be saved; then it can be tested.')}
      </Alert>
    );
  }
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: 5 }}>
        <Flex direction="column" spacing={3}>
          <CampaignTestForm campaignId={campaignId} record={previewRecord} beforeSend={save} />
          <QualityChecksPanel
            checks={checks.report?.checks ?? null}
            loading={checks.loading}
            error={checks.error}
            onRun={checks.run}
          />
        </Flex>
      </Grid>
      <Grid size={{ xs: 12, lg: 7 }}>
        <PreviewPane state={preview} />
      </Grid>
    </Grid>
  );
}
