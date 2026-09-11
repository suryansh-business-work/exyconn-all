import { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { copyToClipboard } from '@exyconn/shell/utils/clipboard';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  AppLogFixPromptDocument,
  OpenAppLogsFixPromptDocument,
  useDeleteAppLogGroupMutation,
  useSetAppLogGroupStatusMutation,
  type AppLogFixPromptQuery,
  type AppLogFixPromptQueryVariables,
  type AppLogSource,
  type AppLogStatus,
  type OpenAppLogsFixPromptQuery,
  type OpenAppLogsFixPromptQueryVariables,
} from '@exyconn/shell/graphql/generated';
import { enumLabel } from './logs.constants';
import type { AppLogRow } from './logs-grid';

/**
 * What Tech does with a log: hand it to Claude, change its status, or delete it. Every outcome
 * is reported through the shared notifier; `onChanged` re-reads the grid and the tiles.
 */
export function useLogActions(onChanged: () => void) {
  const client = useApolloClient();
  const notify = useNotify();
  const confirm = useConfirm();
  const [setStatus] = useSetAppLogGroupStatusMutation();
  const [deleteGroup] = useDeleteAppLogGroupMutation();
  const [copying, setCopying] = useState(false);

  /** The prompt is built on the server, from the stored occurrences, then copied. */
  const copyPrompt = async (load: () => Promise<string>) => {
    setCopying(true);
    try {
      const copied = await copyToClipboard(await load());
      if (copied) {
        notify('Copied — paste it into Claude Code to fix it');
      } else {
        notify('Copy failed — the browser blocked the clipboard', 'error');
      }
    } catch (err) {
      notify(errorMessage(err, 'Could not build the prompt'), 'error');
    } finally {
      setCopying(false);
    }
  };

  const copyFixPrompt = (row: AppLogRow) =>
    copyPrompt(async () => {
      const { data } = await client.query<AppLogFixPromptQuery, AppLogFixPromptQueryVariables>({
        query: AppLogFixPromptDocument,
        variables: { id: row.id },
        fetchPolicy: 'network-only',
      });
      return data?.appLogFixPrompt ?? '';
    });

  const copyOpenErrors = (source: AppLogSource | null) =>
    copyPrompt(async () => {
      const { data } = await client.query<
        OpenAppLogsFixPromptQuery,
        OpenAppLogsFixPromptQueryVariables
      >({
        query: OpenAppLogsFixPromptDocument,
        variables: { source },
        fetchPolicy: 'network-only',
      });
      return data?.openAppLogsFixPrompt ?? '';
    });

  /** Resolves to whether the change went through. */
  const changeStatus = async (row: AppLogRow, status: AppLogStatus): Promise<boolean> => {
    try {
      await setStatus({ variables: { id: row.id, status } });
      notify(`Marked ${enumLabel(status).toLowerCase()}`);
      onChanged();
      return true;
    } catch (err) {
      notify(errorMessage(err, 'Could not update the log'), 'error');
      return false;
    }
  };

  /** Resolves to whether the log was deleted (false when cancelled or refused). */
  const remove = async (row: AppLogRow): Promise<boolean> => {
    const ok = await confirm({
      title: 'Delete log',
      message: `Delete "${row.message}" and all ${row.count} occurrences of it?`,
      confirmText: 'Delete',
    });
    if (!ok) {
      return false;
    }
    try {
      await deleteGroup({ variables: { id: row.id } });
      notify('Log deleted');
      onChanged();
      return true;
    } catch (err) {
      notify(errorMessage(err, 'Could not delete the log'), 'error');
      return false;
    }
  };

  return { copying, copyFixPrompt, copyOpenErrors, changeStatus, remove };
}

export type LogActions = ReturnType<typeof useLogActions>;
