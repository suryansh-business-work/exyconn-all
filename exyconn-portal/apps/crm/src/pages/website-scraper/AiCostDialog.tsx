import { useFormatters, useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@exyconn/shell/components/ui';
import { DetailFact, DetailFactGrid } from '@exyconn/shell/components/data/DetailFact';
import type { AiEstimate } from './useAiAnalysis';

interface AiCostDialogProps {
  estimate: AiEstimate | null;
  onProceed: () => void;
  onCancel: () => void;
}

/** The price of handing the page to the AI, shown before anything is spent. */
export function AiCostDialog({ estimate, onProceed, onCancel }: Readonly<AiCostDialogProps>) {
  const t = useT();
  const { formatNumber, formatCurrency } = useFormatters();
  return (
    <Dialog open={Boolean(estimate)} onClose={onCancel} fullWidth maxWidth="xs">
      <DialogTitle>{t('Send this page to the AI?')}</DialogTitle>
      {estimate && (
        <DialogContent>
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              {t('An estimate: the real cost depends on how long the answer is.')}
            </Typography>
            <DetailFactGrid>
              <DetailFact label="Model">{estimate.model}</DetailFact>
              <DetailFact label="Estimated cost">
                {formatCurrency(estimate.costUsd, { currency: 'USD', maximumFractionDigits: 4 })}
              </DetailFact>
              <DetailFact label="Input tokens">≈ {formatNumber(estimate.inputTokens)}</DetailFact>
              <DetailFact label="Output tokens">≈ {formatNumber(estimate.outputTokens)}</DetailFact>
            </DetailFactGrid>
            {!estimate.priced && (
              <Alert severity="warning">
                {t('No price on file for this model in Tech > AI Pricing, so the cost shows as 0.')}
              </Alert>
            )}
            {estimate.truncated && (
              <Alert severity="info">
                {t('The page is long: the AI reads only its first 60,000 characters.')}
              </Alert>
            )}
          </Stack>
        </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onCancel}>{t('Cancel')}</Button>
        <Button variant="contained" onClick={onProceed}>
          {t('Proceed')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
