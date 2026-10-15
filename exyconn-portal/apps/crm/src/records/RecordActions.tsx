import { Stack } from '@exyconn/shell/components/ui';
import type { CrmObject } from '@exyconn/shell/graphql/generated';
import { ExportRecordsButton } from './export';
import { ImportRecordsButton } from './import';
import type { RecordQuerySnapshot } from './list';

interface RecordActionsProps {
  object: CrmObject;
  /** The current view's query and visible columns, which the export follows. */
  query: RecordQuerySnapshot;
  fileName: string;
  /** Refreshes the list and its stats after rows were imported. */
  onImported: () => void;
}

/** A record list's CSV actions: import with column mapping, and export of the current view. */
export function RecordActions({
  object,
  query,
  fileName,
  onImported,
}: Readonly<RecordActionsProps>) {
  return (
    <Stack direction="row" spacing={1}>
      <ImportRecordsButton object={object} onImported={onImported} />
      <ExportRecordsButton
        object={object}
        query={query}
        columns={query.columns}
        fileName={fileName}
      />
    </Stack>
  );
}
