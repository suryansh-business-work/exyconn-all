import { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { downloadTextFile } from '@exyconn/shell/utils/file';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  ExportTechConfigsDocument,
  useImportTechConfigsMutation,
  type ExportTechConfigsQuery,
  type TechImportResult,
} from '@exyconn/shell/graphql/generated';

const JSON_TYPE = 'application/json';

/** The hook reports every failure itself; anything reaching here is unexpected. */
export const logTransferError = (err: unknown) =>
  portalLogger.warn('Environment Variables transfer failed', err);

/** `environment-variables-smtp-2026-10-26.json`; `…-all-…` for everything. */
const fileName = (scope: string) =>
  `environment-variables-${scope}-${new Date().toISOString().slice(0, 10)}.json`;

/**
 * Export and import of Environment Variables as JSON. Exports carry every secret in full, so
 * they are fetched fresh (never cached) and handed straight to the browser as a file.
 */
export function useConfigTransfer(section: string | null) {
  const client = useApolloClient();
  const notify = useNotify();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<TechImportResult | null>(null);
  const [importConfigs] = useImportTechConfigsMutation({ refetchQueries: 'active' });

  const exportJson = async (ids: string[] | null, scope: string) => {
    setBusy(true);
    try {
      const { data } = await client.query<ExportTechConfigsQuery>({
        query: ExportTechConfigsDocument,
        variables: { section, ids },
        fetchPolicy: 'no-cache',
      });
      downloadTextFile(fileName(scope), JSON_TYPE, data?.exportTechConfigs ?? '');
      notify(
        'Exported. The file holds every secret in full: keep it safe and delete it after use.',
        'warning',
      );
    } catch (err) {
      notify(errorMessage(err, 'Could not export'), 'error');
    } finally {
      setBusy(false);
    }
  };

  const importJson = async (file: File) => {
    setBusy(true);
    try {
      const { data } = await importConfigs({ variables: { section, json: await file.text() } });
      setResult(data?.importTechConfigs ?? null);
      notify('Import finished');
    } catch (err) {
      notify(errorMessage(err, 'Could not import'), 'error');
    } finally {
      setBusy(false);
    }
  };

  return { busy, result, clearResult: () => setResult(null), exportJson, importJson };
}
