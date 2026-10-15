import { useMemo } from 'react';
import type { ColDef } from 'ag-grid-community';
import { useT } from '@exyconn/i18n';
import { useSettings } from '@exyconn/shell/hooks/useSettings';
import type { CrmSortInput } from '@exyconn/shell/graphql/generated';
import type { CrmPropertyInfo, CrmRecordRow, ValueFormatters } from '../schema';
import { buildColumnDefs, columnChoices, visibleColumnIds } from './buildColumns';

/**
 * A list's column model for its current view, plus what the Columns dialog needs: every column
 * it could show, the ones it shows now and the page's defaults.
 */
export function useRecordColumns<TRow extends CrmRecordRow>(
  pageColumns: readonly ColDef<TRow>[],
  properties: readonly CrmPropertyInfo[],
  columns: readonly string[],
  sorts: readonly CrmSortInput[],
) {
  const t = useT();
  const { formatDate, formatNumber } = useSettings();
  const formatters = useMemo<ValueFormatters>(
    () => ({ formatDate, formatNumber, yes: t('Yes'), no: t('No') }),
    [formatDate, formatNumber, t],
  );
  const choices = useMemo(() => columnChoices(pageColumns, properties), [pageColumns, properties]);
  const visible = useMemo(
    () => visibleColumnIds(pageColumns, choices, columns),
    [pageColumns, choices, columns],
  );
  const defaults = useMemo(
    () => visibleColumnIds(pageColumns, choices, []),
    [pageColumns, choices],
  );
  const columnDefs = useMemo(
    () => buildColumnDefs({ pageColumns, properties, visible: columns, sorts, formatters }),
    [pageColumns, properties, columns, sorts, formatters],
  );
  // What an export takes: the property keys of the columns on screen, in order.
  const exportColumns = useMemo(() => {
    const keys = new Set(properties.map((property) => property.key));
    return visible.filter((id) => keys.has(id));
  }, [properties, visible]);
  return { columnDefs, choices, visible, defaults, exportColumns };
}
