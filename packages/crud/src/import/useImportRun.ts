import { useCallback, useRef, useState } from 'react';
import { useT } from '@exyconn/i18n';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { FIRST_DATA_LINE } from './importFile';
import type { ImportChunkResult, ImportIssue, ImportRow, ImportSource } from './import.types';

/** The server takes at most this many rows per call. */
export const CHUNK_SIZE = 500;

export type ImportStatus = 'idle' | 'running' | 'done';

export interface ImportRunState {
  status: ImportStatus;
  /** Rows the server has answered for so far. */
  done: number;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  issues: ImportIssue[];
  /** Set when a chunk failed outright (network, permission); the rows after it were not sent. */
  error: string | null;
  cancelled: boolean;
}

export const IDLE: ImportRunState = {
  status: 'idle',
  done: 0,
  total: 0,
  created: 0,
  updated: 0,
  skipped: 0,
  issues: [],
  error: null,
  cancelled: false,
};

export function addChunk(
  state: ImportRunState,
  size: number,
  result: ImportChunkResult,
): ImportRunState {
  return {
    ...state,
    done: state.done + size,
    created: state.created + result.created,
    updated: state.updated + result.updated,
    skipped: state.skipped + result.skipped,
    issues: [...state.issues, ...result.issues],
  };
}

/**
 * Sends the mapped rows 500 at a time, one call after another. Cancel stops after the call in
 * flight; a failed call stops the run. What was imported before either is kept, and
 * `onImported` runs after every call that succeeded so the list behind can refresh.
 */
export function useImportRun<Mode extends string>(
  source: ImportSource<Mode>,
  onImported: () => void,
) {
  const t = useT();
  const [state, setState] = useState<ImportRunState>(IDLE);
  const cancelRef = useRef(false);

  const start = useCallback(
    (rows: ImportRow[], mode: Mode) => {
      cancelRef.current = false;
      setState({ ...IDLE, status: 'running', total: rows.length });
      const sendFrom = async (offset: number): Promise<void> => {
        if (offset >= rows.length || cancelRef.current) {
          const cancelled = offset < rows.length;
          setState((current) => ({ ...current, status: 'done', cancelled }));
          return;
        }
        const chunk = rows.slice(offset, offset + CHUNK_SIZE);
        const result = await source.runChunk(chunk, mode, FIRST_DATA_LINE + offset);
        setState((current) => addChunk(current, chunk.length, result));
        onImported();
        await sendFrom(offset + CHUNK_SIZE);
      };
      sendFrom(0).catch((error_: unknown) => {
        portalLogger.error('An import chunk failed', error_, { title: source.title });
        const error = errorMessage(error_, t('The import failed.'));
        setState((current) => ({ ...current, status: 'done', error }));
      });
    },
    [source, onImported, t],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { state, start, cancel };
}
