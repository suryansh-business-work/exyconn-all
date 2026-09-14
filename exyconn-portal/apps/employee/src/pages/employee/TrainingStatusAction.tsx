import { useT } from '@exyconn/i18n';
import { Button, Text } from '@exyconn/shell/components/ui';
import { TrainingStatus } from '@exyconn/shell/graphql/generated';

interface TrainingStatusActionProps {
  status: TrainingStatus;
  onAdvance: (next: TrainingStatus) => void;
}

/** The single next step available on a training, so the row stays a one-click action. */
export function TrainingStatusAction({ status, onAdvance }: Readonly<TrainingStatusActionProps>) {
  const t = useT();
  if (status === TrainingStatus.Assigned) {
    return (
      <Button size="small" onClick={() => onAdvance(TrainingStatus.InProgress)}>
        {t('Start')}
      </Button>
    );
  }
  if (status === TrainingStatus.InProgress) {
    return (
      <Button size="small" onClick={() => onAdvance(TrainingStatus.Completed)}>
        {t('Mark complete')}
      </Button>
    );
  }
  return (
    <Text size="caption" color="text.secondary">
      {t('Done')}
    </Text>
  );
}
