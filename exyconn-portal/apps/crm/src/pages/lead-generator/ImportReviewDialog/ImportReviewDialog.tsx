import { useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Text,
  useMediaQuery,
  useTheme,
} from '@exyconn/shell/components/ui';
import { LeadImportStatus } from '@exyconn/shell/graphql/generated';
import type { LeadImportPreview } from '../leadTypes';
import { CompanyLink } from './CompanyLink';
import { ExtraCompanyItem } from './ExtraCompanyItem';
import { ReviewSection } from './ReviewSection';

interface ImportReviewDialogProps {
  previews: LeadImportPreview[];
  /** Files the new ones and updates the chosen duplicates; an empty set means "Add new only". */
  onConfirm: (chosen: ReadonlySet<string>) => void;
  onCancel: () => void;
}

const byStatus = (previews: LeadImportPreview[], status: LeadImportStatus) =>
  previews.filter((preview) => preview.status === status);

/** The decision step before "Add to CRM" when some chosen businesses are already companies. */
export function ImportReviewDialog({
  previews,
  onConfirm,
  onCancel,
}: Readonly<ImportReviewDialogProps>) {
  const t = useT();
  const theme = useTheme();
  const phone = useMediaQuery(theme.breakpoints.down('sm'));
  const fresh = byStatus(previews, LeadImportStatus.New);
  const same = byStatus(previews, LeadImportStatus.Duplicate);
  const extra = byStatus(previews, LeadImportStatus.DuplicateWithExtra);
  const [chosen, setChosen] = useState<ReadonlySet<string>>(
    () => new Set(extra.map((preview) => preview.placeId)),
  );
  const toggle = (placeId: string) =>
    setChosen((current) => {
      const next = new Set(current);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });

  return (
    <Dialog
      open
      onClose={onCancel}
      fullWidth
      maxWidth="sm"
      fullScreen={phone}
      aria-labelledby="lead-import-review-title"
    >
      <DialogTitle id="lead-import-review-title">
        {t('Review before adding to the CRM')}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {fresh.length > 0 && (
            <ReviewSection title={t('New ({count}) — will be added', { count: fresh.length })}>
              {fresh.map((preview) => (
                <CompanyLink key={preview.placeId} preview={preview} />
              ))}
            </ReviewSection>
          )}
          {same.length > 0 && (
            <ReviewSection
              title={t('Already in the CRM ({count}) — nothing new, will be skipped', {
                count: same.length,
              })}
            >
              {same.map((preview) => (
                <CompanyLink key={preview.placeId} preview={preview} />
              ))}
            </ReviewSection>
          )}
          {extra.length > 0 && (
            <ReviewSection
              title={t('Already in the CRM with extra details ({count})', { count: extra.length })}
            >
              <Alert severity="info">
                <Text size="sm">
                  {t(
                    'These businesses already exist in the CRM. We found extra details — add them? Nothing is deleted or overwritten; only empty fields are filled and new emails/phones are added.',
                  )}
                </Text>
              </Alert>
              {extra.map((preview) => (
                <ExtraCompanyItem
                  key={preview.placeId}
                  preview={preview}
                  checked={chosen.has(preview.placeId)}
                  onToggle={toggle}
                />
              ))}
            </ReviewSection>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={onCancel}>{t('Cancel')}</Button>
        <Button
          variant="outlined"
          disabled={fresh.length === 0}
          onClick={() => onConfirm(new Set())}
        >
          {t('Add new only')}
        </Button>
        {extra.length > 0 && (
          <Button
            variant="contained"
            disabled={chosen.size === 0}
            onClick={() => onConfirm(chosen)}
          >
            {t('Add new and update selected')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
