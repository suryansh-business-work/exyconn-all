import { useT } from '@exyconn/i18n';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Text } from '@/components/ui';
import { RichHtmlView } from '@/components/content/RichHtmlView';
import { PanelSkeleton } from '@/components/feedback/skeletons';
import { useMyLegalAssignmentBodyQuery } from '@/graphql/generated';

interface Props {
  /** The assignment being read; null keeps the dialog closed. */
  assignment: { id: string; title: string } | null;
  onClose: () => void;
}

/** Reads the text of a contract, policy or document handed to the signed-in person. */
export function LegalReaderDialog({ assignment, onClose }: Readonly<Props>) {
  const t = useT();
  const { data, loading, error } = useMyLegalAssignmentBodyQuery({
    variables: { id: assignment?.id ?? '' },
    skip: !assignment,
  });
  if (!assignment) {
    return null;
  }
  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{assignment.title}</DialogTitle>
      <DialogContent>
        {loading && !data && <PanelSkeleton />}
        {error && <Text color="error">{error.message}</Text>}
        {data && <RichHtmlView html={data.myLegalAssignmentBody} label={t('Document text')} />}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('Close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
