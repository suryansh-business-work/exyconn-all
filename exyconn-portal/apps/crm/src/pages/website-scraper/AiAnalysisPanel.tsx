import { useFormatters, useT } from '@exyconn/i18n';
import { Alert, LinearProgress, Stack, Typography } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { WebScrapeFieldsFragment } from '@exyconn/shell/graphql/generated';
import { AiInstructionForm } from './forms/ai-instruction';
import { AiCostDialog } from './AiCostDialog';
import { useAiAnalysis } from './useAiAnalysis';

const logFailure = (error: unknown) => portalLogger.warn('crm: website scraper AI step', error);

/** The last answer the AI gave about this page, with what it cost and when. */
function AiAnswer({ scrape }: Readonly<{ scrape: WebScrapeFieldsFragment }>) {
  const t = useT();
  const { formatCurrency, formatDateTime } = useFormatters();
  const cost = formatCurrency(scrape.aiCostUsd ?? 0, {
    currency: 'USD',
    maximumFractionDigits: 4,
  });
  return (
    <Stack spacing={1}>
      <Typography variant="subtitle2">{t('AI answer')}</Typography>
      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
        {scrape.aiResponse}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {t('Cost {cost} · {time}', { cost, time: formatDateTime(scrape.analyzedAt) })}
      </Typography>
    </Stack>
  );
}

/** "Send to AI": an instruction, its price confirmed first, then the answer. */
export function AiAnalysisPanel({ scrape }: Readonly<{ scrape: WebScrapeFieldsFragment }>) {
  const t = useT();
  const ai = useAiAnalysis(scrape.id);
  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1">{t('Send to AI')}</Typography>
      <AiInstructionForm
        initialInstruction={scrape.aiInstruction}
        busy={ai.busy}
        onSubmit={(instruction) => {
          ai.requestEstimate(instruction).catch(logFailure);
        }}
      />
      {ai.analyzing && <LinearProgress aria-label={t('The AI is reading the page')} />}
      {ai.error && <Alert severity="error">{ai.error}</Alert>}
      {scrape.aiResponse && <AiAnswer scrape={scrape} />}
      <AiCostDialog
        estimate={ai.pending?.estimate ?? null}
        onCancel={ai.cancel}
        onProceed={() => {
          ai.proceed().catch(logFailure);
        }}
      />
    </Stack>
  );
}
