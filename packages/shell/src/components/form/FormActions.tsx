import { useT } from '@exyconn/i18n';
import { Button, Stack } from '@/components/ui';

interface FormActionsProps {
  submitting: boolean;
  isEdit: boolean;
  onCancel: () => void;
  /** Overrides the default Create/Update submit label (e.g. "Send", "Block"). */
  submitLabel?: string;
}

/** Standard Cancel / Save footer shared by every module form. */
export function FormActions({ submitting, isEdit, onCancel, submitLabel }: FormActionsProps) {
  const t = useT();
  const label = submitLabel ?? (isEdit ? t('Update') : t('Create'));
  return (
    <Stack
      // Side by side at the bottom right on a desk; stacked and full width on a phone, where
      // the right-hand corner is the one place a thumb cannot comfortably reach. The submit
      // comes first in the stacked order for the same reason.
      direction={{ xs: 'column-reverse', sm: 'row' }}
      spacing={1.5}
      sx={{
        justifyContent: 'flex-end',
        pt: 1,
      }}
    >
      <Button
        type="button"
        color="inherit"
        onClick={onCancel}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {t('Cancel')}
      </Button>
      <Button
        type="submit"
        variant="contained"
        disabled={submitting}
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
        {submitting ? t('Saving…') : label}
      </Button>
    </Stack>
  );
}
