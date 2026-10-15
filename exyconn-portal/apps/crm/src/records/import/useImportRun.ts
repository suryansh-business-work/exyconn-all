import { useCallback, useRef, useState } from 'react';
import { useT } from '@exyconn/i18n';
import {
  useImportCrmRecordsMutation,
  type CrmImportMode,
  type CrmObject,
  type ImportCrmRecordsMutation,
} from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { FIRST_DATA_LINE } from './csvFile';
import type { ImportRow } from './mapping';

/** The server takes at most this many rows per call. */
const CHUNK_SIZE = 500;

export type ImportIssue = ImportCrmRecordsMutation['importCrmRecords']['issues'][number];
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

const IDLE: ImportRunState = {
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

type ChunkResult = ImportCrmRecordsMutation['importCrmRecords'];

function addChunk(state: ImportRunState, size: number, result: ChunkResult): ImportRunState {
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
 * Sends the mapped rows to the importer 500 at a time, one call after another. Cancel stops
 * after the call in flight; a failed call stops the run. What was imported before either is
 * kept, and `onImported` runs after every call that succeeded so the list behind can refresh.
 */
export function useImportRun(object: CrmObject, onImported: () => void) {
  const t = useT();
  const [importRecords] = useImportCrmRecordsMutation();
  const [state, setState] = useState<ImportRunState>(IDLE);
  const cancelRef = useRef(false);

  const sendChunk = useCallback(
    async (mode: CrmImportMode, rows: ImportRow[], offset: number) => {
      const { data } = await importRecords({
        variables: {
          input: { object, mode, rows, firstRowNumber: FIRST_DATA_LINE + offset },
        },
      });
      if (!data) {
        throw new Error('The import returned no result');
      }
      return data.importCrmRecords;
    },
    [importRecords, object],
  );

  const start = useCallback(
    async (rows: ImportRow[], mode: CrmImportMode) => {
      cancelRef.current = false;
      setState({ ...IDLE, status: 'running', total: rows.length });
      for (let offset = 0; offset < rows.length; offset += CHUNK_SIZE) {
        if (cancelRef.current) {
          setState((current) => ({ ...current, status: 'done', cancelled: true }));
          return;
        }
        const chunk = rows.slice(offset, offset + CHUNK_SIZE);
        try {
          const result = await sendChunk(mode, chunk, offset);
          setState((current) => addChunk(current, chunk.length, result));
          onImported();
        } catch (failure) {
          portalLogger.error('CRM import chunk failed', failure);
          const error = errorMessage(failure, t('The import failed.'));
          setState((current) => ({ ...current, status: 'done', error }));
          return;
        }
      }
      setState((current) => ({ ...current, status: 'done' }));
    },
    [sendChunk, onImported, t],
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  return { state, start, cancel };
}
