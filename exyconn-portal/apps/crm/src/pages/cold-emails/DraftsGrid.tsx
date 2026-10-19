import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColDef } from 'ag-grid-community';
import ForwardToInboxIcon from '@mui/icons-material/ForwardToInbox';
import { useFormatters, useT } from '@exyconn/i18n';
import { dateColumn, textColumn, usePagedFetcher, valueColumn } from '@exyconn/crud';
import { Box } from '@exyconn/shell/components/ui';
import { EmptyState } from '@exyconn/shell/components/feedback/EmptyState';
import { ServerDataGrid, type GridFetcher } from '@exyconn/shell/components/data/ServerDataGrid';
import {
  ColdEmailDraftsDocument,
  ColdEmailStatus,
  CrmTimelineObject,
  type ColdEmailDraftRowFieldsFragment,
  type ColdEmailDraftsQuery,
  type TableQueryInput,
} from '@exyconn/shell/graphql/generated';
import { coldEmailPath } from '../../records/cold-email';

type Row = ColdEmailDraftRowFieldsFragment;

/** Nothing typed into the search, filters or archive switch: an empty page means no drafts. */
const isUnfiltered = (input: TableQueryInput) =>
  !input.search && !input.filters?.length && !input.archived;

/** Every cold email drafted, most recently changed first; a row opens its versions. */
export function DraftsGrid() {
  const t = useT();
  const navigate = useNavigate();
  const { formatDateTime, formatNumber } = useFormatters();
  const [empty, setEmpty] = useState(false);
  const paged = usePagedFetcher(
    ColdEmailDraftsDocument,
    (data: ColdEmailDraftsQuery) => data.coldEmailDrafts,
  );
  // The shared grid keys "Delete selected" and export off `list`, so the wrapper keeps it.
  const fetchRows: GridFetcher<Row> = useMemo(
    () =>
      Object.assign(
        async (input: TableQueryInput) => {
          const page = await paged(input);
          setEmpty(page.totalCount === 0 && isUnfiltered(input));
          return page;
        },
        { list: paged.list },
      ),
    [paged],
  );
  const columns: ColDef<Row>[] = useMemo(
    () => [
      textColumn<Row>('recordName', 'Record'),
      valueColumn<Row>('object', 'Type', (row) =>
        row.object === CrmTimelineObject.Contact ? t('Contact') : t('Company'),
      ),
      textColumn<Row>('toEmail', 'To'),
      valueColumn<Row>('variantCount', 'Versions', (row) => formatNumber(row.variantCount)),
      textColumn<Row>('status', 'Status', (row) =>
        row.status === ColdEmailStatus.Sent ? t('Sent') : t('Draft'),
      ),
      textColumn<Row>('createdByName', 'Drafted by'),
      dateColumn<Row>('updatedAt', 'Last updated'),
    ],
    [formatNumber, t],
  );

  return (
    <>
      {empty && (
        <EmptyState
          icon={<ForwardToInboxIcon />}
          title="No cold emails yet"
          description="Draft one from a contact or company page with Draft a cold email."
        />
      )}
      <Box sx={{ display: empty ? 'none' : 'block' }}>
        <ServerDataGrid
          columnDefs={columns}
          fetchRows={fetchRows}
          onRowClick={(row) => navigate(coldEmailPath(row.id))}
          context={{ actions: {}, formatDate: formatDateTime }}
          searchPlaceholder="Search by record, address, goal or who drafted it…"
        />
      </Box>
    </>
  );
}
