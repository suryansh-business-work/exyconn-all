import { useState } from 'react';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import {
  useImportClutchCompaniesMutation,
  type ImportClutchCompaniesMutation,
} from '@exyconn/shell/graphql/generated';

export type ClutchImportResult = ImportClutchCompaniesMutation['importClutchCompanies'];

/** Files the chosen companies of a run into the CRM and keeps what happened for the summary. */
export function useClutchImport(runId: string) {
  const notify = useNotify();
  const [result, setResult] = useState<ClutchImportResult | null>(null);
  const [importCompanies, { loading }] = useImportClutchCompaniesMutation({
    refetchQueries: ['ClutchRun'],
  });

  const run = async (keys: string[]) => {
    try {
      const { data } = await importCompanies({ variables: { runId, keys } });
      const outcome = data?.importClutchCompanies ?? null;
      setResult(outcome);
      notify('{count} added to the CRM', 'success', { count: outcome?.created ?? 0 });
    } catch (err) {
      notify(errorMessage(err, 'Could not add them to the CRM'), 'error');
    }
  };

  return { run, loading, result, clear: () => setResult(null) };
}
