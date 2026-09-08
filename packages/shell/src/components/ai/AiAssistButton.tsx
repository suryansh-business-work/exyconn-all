import { useState } from 'react';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Flex,
  Text,
} from '@/components/ui';
import { useNotify } from '../feedback/NotificationProvider';
import { errorMessage } from '../../utils/errorMessage';
import { useAiDraftMutation, useAiSummariseMutation } from '../../graphql/generated';
import { AiAssistPreview } from './AiAssistPreview';
import type { AiAssistButtonProps, AiAssistTask } from './aiAssist.types';

/** What the dialog is called, per task. Configuration, not copy a caller has to pass. */
const TITLES: Record<AiAssistTask['action'], string> = {
  SUMMARISE: 'Summarise with AI',
  DRAFT: 'Draft with AI',
};

/**
 * A button that asks the AI module to summarise or draft something, and hands the answer
 * back to the caller.
 *
 * It lives in the shell rather than in the AI app so any module can offer AI help on text
 * it already has, without learning the AI schema: pass the text and a task, take the
 * result in `onResult`. The run is a real AI job, so it lands in the AI history, counts
 * against the workspace's budget and is attributed to whoever pressed the button.
 */
export function AiAssistButton({
  task,
  text,
  onResult,
  label = 'AI assist',
  disabled = false,
}: Readonly<AiAssistButtonProps>) {
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState('');
  const [summarise, { loading: summarising }] = useAiSummariseMutation();
  const [draft, { loading: drafting }] = useAiDraftMutation();
  const loading = summarising || drafting;
  const source = text.trim();

  const close = () => {
    setOpen(false);
    setResult('');
  };

  const run = async () => {
    try {
      if (task.action === 'SUMMARISE') {
        const { data } = await summarise({ variables: { text: source, style: task.style } });
        setResult(data?.aiSummarise ?? '');
        return;
      }
      const { data } = await draft({ variables: { kind: task.kind, context: source } });
      setResult(data?.aiDraft ?? '');
    } catch (error) {
      notify(errorMessage(error, 'The AI request could not be completed'), 'error');
    }
  };

  const accept = () => {
    onResult(result);
    close();
  };

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={<AutoAwesomeIcon />}
        onClick={() => setOpen(true)}
        disabled={disabled || !source}
      >
        {label}
      </Button>

      <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{TITLES[task.action]}</DialogTitle>
        <DialogContent dividers>
          <Flex direction="column" spacing={2}>
            <AiAssistPreview label="Sent to the model" body={source} />
            {loading && (
              <Flex direction="row" spacing={1} alignItems="center">
                <CircularProgress size={18} />
                <Text size="sm">Asking the model…</Text>
              </Flex>
            )}
            {result && <AiAssistPreview label="Result" body={result} />}
            {!result && !loading && (
              <Alert severity="info">
                This runs as an AI job: it is recorded in the AI module and counts against the
                workspace&rsquo;s AI budget.
              </Alert>
            )}
          </Flex>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button onClick={run} disabled={loading}>
            {result ? 'Try again' : 'Run'}
          </Button>
          <Button variant="contained" onClick={accept} disabled={!result}>
            Use this
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
