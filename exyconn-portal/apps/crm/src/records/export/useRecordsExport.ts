import { useState } from 'react';
import { useApolloClient } from '@apollo/client/react';
import { formatISO } from 'date-fns';
import { useT } from '@exyconn/i18n';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { downloadCsv, toCsv } from '@exyconn/shell/utils/csv';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useObjectSchema } from '../schema';
import { fetchAllRecords, type ExportQuery } from './fetchRecords';
import { exportProperties, recordColumns } from './recordsCsv';

interface RecordsExportOptions {
  object: CrmObject;
  query: ExportQuery;
  fileName: string;
}

/** Fetches every matching record and saves it as a CSV the importer can read back. */
export function useRecordsExport({ object, query, fileName }: RecordsExportOptions) {
  const t = useT();
  const notify = useNotify();
  const client = useApolloClient();
  const { fields: properties } = useObjectSchema(object);
  const [busy, setBusy] = useState(false);

  const run = async (keys: readonly string[]) => {
    setBusy(true);
    try {
      const { rows, totalCount } = await fetchAllRecords(client, object, query);
      const columns = recordColumns(exportProperties(properties, keys), t);
      const stamp = formatISO(new Date(), { representation: 'date' });
      downloadCsv(`${fileName}-${stamp}`, toCsv(rows, columns));
      if (rows.length < totalCount) {
        notify(
          'Exported the first {count} of {total} rows. Narrow the filters to export the rest.',
          'warning',
          {
            count: rows.length,
            total: totalCount,
          },
        );
      } else {
        notify('Exported {count} rows.', 'success', { count: rows.length });
      }
    } catch (failure) {
      portalLogger.error('CRM export failed', failure);
      notify(errorMessage(failure, t('The export failed.')), 'error');
    } finally {
      setBusy(false);
    }
  };

  return { busy, ready: properties.length > 0, run };
}
