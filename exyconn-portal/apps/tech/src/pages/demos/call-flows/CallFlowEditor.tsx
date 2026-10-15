import { useMemo, useState } from 'react';
import { VOICE_NODE_TYPES } from '@exyconn/wa-flow';
import {
  FlowProvider,
  FlowWorkspace,
  PreviewPane,
  useGraphEditor,
  useUnloadGuard,
} from '@exyconn/bot-studio/studio';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useSaveCallingBotScenarioFlowMutation } from '@exyconn/shell/graphql/generated';
import { CallFlowHeader } from './CallFlowHeader';
import { CallScriptDialog } from './CallScriptDialog';
import { REHEARSAL_KEY, flowOf, rehearsalBundle, type CallFlowRow } from './callFlow.model';

/** A call flow is one graph: a Jump has nowhere else to go. */
const FLOW_KEYS = [REHEARSAL_KEY];
const REFRESH = { refetchQueries: ['CallingBotScenarioFlows'], awaitRefetchQueries: true };

/** One example's call flow in the React Flow editor, saved straight to the example. */
export function CallFlowEditor({
  row,
  aiConfigured,
}: Readonly<{ row: CallFlowRow; aiConfigured: boolean }>) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [save, saving] = useSaveCallingBotScenarioFlowMutation(REFRESH);
  const stored = useMemo(
    () => ({ revision: `${row.id}:${row.updatedAt}`, graph: flowOf(row) }),
    [row],
  );
  const editor = useGraphEditor(stored);
  const [rehearsing, setRehearsing] = useState(false);
  const [scriptOpen, setScriptOpen] = useState(false);
  useUnloadGuard(editor.dirty);

  const persist = async (flow: unknown, done: string) => {
    try {
      const result = await save({ variables: { id: row.id, flow } });
      const saved = result.data?.saveCallingBotScenarioFlow;
      if (saved) {
        editor.adopt({
          revision: `${saved.id}:${saved.updatedAt}`,
          graph: flowOf({ ...row, ...saved }),
        });
        notify(done, 'success');
      }
    } catch (error) {
      console.error('Could not save the call flow', error);
      notify(errorMessage(error, 'Could not save the call flow'), 'error');
    }
  };
  const onSave = () => {
    persist(editor.graph, 'Call flow saved').catch((error: unknown) =>
      console.error('Could not save the call flow', error),
    );
  };
  const onRemove = async () => {
    const ok = await confirm({
      title: 'Remove call flow',
      message: 'Remove the flow of "{name}"? Its calls go back to following the prompt alone.',
      messageValues: { name: row.title },
      confirmText: 'Remove',
      destructive: true,
    });
    if (ok) {
      await persist(null, 'Call flow removed');
    }
  };

  const preview = rehearsing && (
    <PreviewPane
      bundle={rehearsalBundle(row, editor.graph)}
      startWorkflow={REHEARSAL_KEY}
      onClose={() => setRehearsing(false)}
    />
  );

  return (
    <FlowProvider>
      <FlowWorkspace
        editor={editor}
        workflowKeys={FLOW_KEYS}
        aiConfigured={aiConfigured}
        types={VOICE_NODE_TYPES}
        preview={preview}
        previewOpen={rehearsing}
        onClosePreview={() => setRehearsing(false)}
        header={({ errors, tidy }) => (
          <CallFlowHeader
            title={row.title}
            hasFlow={Boolean(row.flow)}
            dirty={editor.dirty}
            errors={errors}
            busy={saving.loading}
            onTidy={tidy}
            onRehearse={() => setRehearsing(true)}
            onScript={() => setScriptOpen(true)}
            onSave={onSave}
            onRemove={() => {
              onRemove().catch((error: unknown) =>
                console.error('Could not remove the call flow', error),
              );
            }}
          />
        )}
      />
      <CallScriptDialog
        open={scriptOpen}
        script={row.callScript}
        onClose={() => setScriptOpen(false)}
      />
    </FlowProvider>
  );
}
