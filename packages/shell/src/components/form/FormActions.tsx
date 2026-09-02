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
  const label = submitLabel ?? (isEdit ? 'Update' : 'Create');
  return (
    <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ pt: 1 }}>
      <Button type="button" color="inherit" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" variant="contained" disabled={submitting}>
        {submitting ? 'Saving…' : label}
      </Button>
    </Stack>
  );
}
