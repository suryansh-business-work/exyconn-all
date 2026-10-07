import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { render } from '@testing-library/react';
import type { ColDef } from 'ag-grid-community';
import {
  crud,
  dashboardProps,
  fetchRows,
  formatDate,
  page,
  resourceOptions,
} from './crud-page.mocks';

/** One stat card after the total: its label and the stats bucket it counts. */
export interface StatBucket {
  label: string;
  field: string;
  value: string;
}

/** What makes one register page different from the next. */
export interface CrudPageSpec {
  name: string;
  Page: ComponentType;
  Form: ComponentType<never>;
  title: string;
  entityLabel: string;
  exportFileName: string;
  /** The entity name `useCrudResource` toasts with. */
  label: string;
  columns: ColDef[];
  row: { id: string };
  confirm: { message: string; values: Record<string, string> };
  /** The page's `useListXStatsQuery` stand-in and the key its data sits under. */
  statsQuery: Mock;
  statsKey: string;
  totalLabel: string;
  buckets: StatBucket[];
  /** The page's delete mutation function, as `useDeleteXMutation` returns it. */
  deleteMutation: Mock;
  pagedDocument: unknown;
  pagedKey: string;
}

/** A TableStats answer, one entry per field, in which bucket `i` counts `i + 2` rows. */
function statsFor(buckets: readonly StatBucket[]) {
  const fields = [...new Set(buckets.map((bucket) => bucket.field))];
  return {
    total: 11,
    counts: fields.map((field) => ({
      field,
      buckets: [
        { value: 'SOMETHING_ELSE', count: 99 },
        ...buckets.flatMap((bucket, index) =>
          bucket.field === field ? [{ value: bucket.value, count: index + 2 }] : [],
        ),
      ],
    })),
    sums: [],
  };
}

/** The behaviour every compliance register page shares, run against one page. */
export function describeCrudPage(spec: Readonly<CrudPageSpec>) {
  const refetch = async () => undefined;
  const answer = (data: object | undefined, loading: boolean) =>
    spec.statsQuery.mockReturnValue({ data, loading, refetch });

  describe(spec.name, () => {
    beforeEach(() => {
      page.dashboard = null;
      page.resource = null;
      page.fetcher = null;
      answer(undefined, true);
      spec.deleteMutation.mockReset();
    });

    it('frames the register with its own title, columns, export name and date formatter', () => {
      render(<spec.Page />);
      const props = dashboardProps();
      expect(props).toMatchObject({
        title: spec.title,
        entityLabel: spec.entityLabel,
        exportFileName: spec.exportFileName,
        fetchRows,
        crud,
      });
      expect(props.subtitle).not.toBe('');
      expect(props.searchPlaceholder).toMatch(/^Search by /);
      expect(props.columnDefs).toBe(spec.columns);
      expect(props.context).toEqual({
        actions: { edit: crud.openEdit, delete: crud.remove },
        formatDate,
      });
    });

    it('counts each stat card from one stats answer', () => {
      answer({ [spec.statsKey]: statsFor(spec.buckets) }, false);
      render(<spec.Page />);
      const { stats, statsLoading } = dashboardProps();
      expect(stats.map((stat) => [stat.label, stat.value])).toEqual([
        [spec.totalLabel, '11'],
        ...spec.buckets.map((bucket, index) => [bucket.label, String(index + 2)]),
      ]);
      expect(statsLoading).toBe(false);
    });

    it('shows placeholders until the stats first answer, then keeps figures through a refetch', () => {
      const { rerender } = render(<spec.Page />);
      expect(dashboardProps().statsLoading).toBe(true);
      expect(dashboardProps().stats.every((stat) => stat.value === '0')).toBe(true);

      answer({ [spec.statsKey]: statsFor(spec.buckets) }, true);
      rerender(<spec.Page />);
      expect(dashboardProps().statsLoading).toBe(false);
    });

    it('deletes the row by id, confirming by name, and reloads its stats', async () => {
      spec.deleteMutation.mockResolvedValue({ data: {} });
      render(<spec.Page />);
      const options = resourceOptions();
      expect(options.label).toBe(spec.label);
      expect(options.refetch).toBe(refetch);
      expect(options.confirmMessage(spec.row)).toEqual(spec.confirm);
      await options.onDelete(spec.row);
      expect(spec.deleteMutation).toHaveBeenCalledWith({ variables: { id: spec.row.id } });
    });

    it('reads its grid rows from the paged query', () => {
      render(<spec.Page />);
      const paged = { rows: [spec.row], totalCount: 1 };
      expect(page.fetcher?.document).toBe(spec.pagedDocument);
      expect(page.fetcher?.select({ [spec.pagedKey]: paged })).toBe(paged);
    });

    it('opens its own form on the record, wired to close and to reload when done', () => {
      render(<spec.Page />);
      const form = dashboardProps().renderForm(spec.row);
      expect(form.type).toBe(spec.Form);
      expect(form.props).toEqual({ initial: spec.row, onCancel: crud.close, onDone: crud.onDone });
    });
  });
}
