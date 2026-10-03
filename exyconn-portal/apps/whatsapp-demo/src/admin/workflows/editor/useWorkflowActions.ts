/**
 * Save draft, Publish and Discard draft for the open workflow. Each result is adopted as the
 * editor's new baseline and the list and chat catalog queries are refetched, so every screen
 * shows the same version. Errors reach the person as a snackbar and Tech > Logs via the
 * console capture.
 */
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useDiscardWhatsappWorkflowDraftMutation,
  usePublishWhatsappWorkflowMutation,
  useSaveWhatsappWorkflowDraftMutation,
} from '@exyconn/shell/graphql/generated';
import { WORKFLOW_QUERIES, type WorkflowRow } from '../model/api';
import type { WorkflowEditor } from './useWorkflowEditor';

const REFRESH = { refetchQueries: WORKFLOW_QUERIES, awaitRefetchQueries: true } as const;

export function useWorkflowActions(
  workflow: WorkflowRow | null | undefined,
  editor: WorkflowEditor,
) {
  const notify = useNotify();
  const confirm = useConfirm();
  const [saveDraft, saveState] = useSaveWhatsappWorkflowDraftMutation(REFRESH);
  const [publish, publishState] = usePublishWhatsappWorkflowMutation(REFRESH);
  const [discard, discardState] = useDiscardWhatsappWorkflowDraftMutation(REFRESH);

  const fail = (error: unknown, fallback: string) => {
    console.error(fallback, error);
    notify(errorMessage(error, fallback), 'error');
  };

  /** Saves the working copy; true when it is now on the server. */
  const persist = async (): Promise<boolean> => {
    if (!workflow || !editor.meta) {
      return false;
    }
    try {
      const result = await saveDraft({
        variables: { id: workflow.id, input: { ...editor.meta, graph: editor.graph } },
      });
      const saved = result.data?.saveWhatsappWorkflowDraft;
      if (saved) {
        editor.adopt(saved);
      }
      return true;
    } catch (error) {
      fail(error, 'Could not save the draft');
      return false;
    }
  };

  const onSave = async () => {
    if (await persist()) {
      notify('Draft saved', 'success');
    }
  };

  const onPublish = async () => {
    if (!workflow) {
      return;
    }
    const ok = await confirm({
      title: 'Publish workflow',
      message: 'Publish "{name}"? Every chat runs this version from now on.',
      messageValues: { name: editor.meta?.name ?? workflow.name },
      confirmText: 'Publish',
    });
    if (!ok || (editor.dirty && !(await persist()))) {
      return;
    }
    try {
      const result = await publish({ variables: { id: workflow.id } });
      const published = result.data?.publishWhatsappWorkflow;
      if (published) {
        editor.adopt(published);
        notify('Published version {version}', 'success', { version: published.version });
      }
    } catch (error) {
      fail(error, 'Could not publish the workflow');
    }
  };

  const onDiscard = async () => {
    if (!workflow) {
      return;
    }
    const ok = await confirm({
      title: 'Discard draft',
      message: 'Throw away every change since version {version} was published?',
      messageValues: { version: workflow.version },
      confirmText: 'Discard',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      const result = await discard({ variables: { id: workflow.id } });
      const restored = result.data?.discardWhatsappWorkflowDraft;
      if (restored) {
        editor.adopt(restored);
        editor.select(null);
        notify('Draft discarded', 'success');
      }
    } catch (error) {
      fail(error, 'Could not discard the draft');
    }
  };

  return {
    busy: saveState.loading || publishState.loading || discardState.loading,
    saving: saveState.loading,
    publishing: publishState.loading,
    onSave,
    onPublish,
    onDiscard,
  };
}
