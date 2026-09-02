import { Button, Text } from '@exyconn/shell/components/ui';
import { TrainingStatus } from '@exyconn/shell/graphql/generated';

interface TrainingStatusActionProps {
  status: TrainingStatus;
  onAdvance: (next: TrainingStatus) => void;
}

/** The single next step available on a training, so the row stays a one-click action. */
export function TrainingStatusAction({ status, onAdvance }: Readonly<TrainingStatusActionProps>) {
  if (status === TrainingStatus.Assigned) {
    return (
      <Button size="small" onClick={() => onAdvance(TrainingStatus.InProgress)}>
        Start
      </Button>
    );
  }
  if (status === TrainingStatus.InProgress) {
    return (
      <Button size="small" onClick={() => onAdvance(TrainingStatus.Completed)}>
        Mark complete
      </Button>
    );
  }
  return (
    <Text size="caption" color="text.secondary">
      Done
    </Text>
  );
}
