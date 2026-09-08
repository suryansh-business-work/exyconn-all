import { CircularProgress, Flex, Text } from '@exyconn/shell/components/ui';
import { AiJobStatus } from '@exyconn/shell/graphql/generated';

interface AiJobProgressProps {
  status: AiJobStatus;
  /** When the job was handed to the worker. Null on a job nobody has run yet. */
  queuedAt?: string | null;
}

/**
 * The line a job shows while it is still on its way.
 *
 * QUEUED means two different things — a job nobody has run, and one waiting on the worker
 * — and only `queuedAt` separates them, so a draft never claims to be running.
 */
export function AiJobProgress({ status, queuedAt }: Readonly<AiJobProgressProps>) {
  if (status === AiJobStatus.Running) {
    return <ProgressLine text="Running… the model is answering." />;
  }
  if (status === AiJobStatus.Queued && queuedAt) {
    return <ProgressLine text="Queued… waiting for the AI worker to pick this up." />;
  }
  return null;
}

function ProgressLine({ text }: Readonly<{ text: string }>) {
  return (
    <Flex direction="row" spacing={1} alignItems="center">
      <CircularProgress size={16} />
      <Text size="sm" color="text.secondary">
        {text}
      </Text>
    </Flex>
  );
}
