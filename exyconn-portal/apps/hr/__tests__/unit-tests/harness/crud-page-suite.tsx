import type { ReactElement } from 'react';
import type { DocumentNode } from 'graphql';
import type { ColDef } from 'ag-grid-community';
import { beforeEach, describe, expect, it, type Mock } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import { renderWithProviders } from '../test-utils';
import { dashboardProps, paged } from './crud-dashboard';
import { answerRowDelete, runRowAction, statLines } from './crud-page';

/** The hoisted GraphQL hook doubles a page test hands the suite. */
export interface PageMocks {
  /** Returned by the page's `useListXxxStatsQuery`. */
  stats: Mock;
  /** The page's delete mutation function. */
  remove: Mock;
  /** The stats query's refetch, which every reload calls. */
  refetch: Mock;
}

/** What makes one server-paged HR register different from the next. */
export interface CrudPageCase {
  page: ReactElement;
  mocks: PageMocks;
  /** Field of the stats query result, e.g. `listBenefitsStats`. */
  statsKey: string;
  stats: TableStatsShape;
  /** The tiles for `stats`, as "label: value". */
  lines: string[];
  /** The tiles before the stats answer. */
  emptyLines: string[];
  document: DocumentNode;
  /** Field of the paged query result, e.g. `listBenefitsPaged`. */
  pageKey: string;
  columns: ColDef[];
  meta: { title: string; exportFileName: string; entityLabel: string; searchPlaceholder: string };
  /** A grid row; only its id matters to the suite, the rest is shown to the form. */
  row: { id: string; [field: string]: unknown };
  /** The confirm prompt the delete asks for `row`. */
  confirm: string;
  /** The label the delete toast names, e.g. "Benefit" in "Benefit deleted". */
  entity: string;
}

const NOON_UTC = '2026-03-04T12:00:00.000Z';

/** The behaviour every CrudDashboard page shares: tiles, grid wiring, form and delete flows. */
export function describeCrudPage(name: string, spec: Readonly<CrudPageCase>): void {
  const { mocks } = spec;

  describe(name, () => {
    beforeEach(() => {
      mocks.refetch.mockReset().mockResolvedValue({});
      mocks.remove.mockReset().mockResolvedValue({ data: {} });
      mocks.stats.mockReset().mockReturnValue({
        data: { [spec.statsKey]: spec.stats },
        loading: false,
        refetch: mocks.refetch,
      });
    });

    it('counts the tiles from the stats query', () => {
      renderWithProviders(spec.page);

      expect(statLines()).toEqual(spec.lines);
      expect(dashboardProps().statsLoading).toBe(false);
    });

    it('marks the tiles loading, at zero, until the stats first answer', () => {
      mocks.stats.mockReturnValue({ data: undefined, loading: true, refetch: mocks.refetch });
      renderWithProviders(spec.page);

      expect(statLines()).toEqual(spec.emptyLines);
      expect(dashboardProps().statsLoading).toBe(true);
    });

    it('keeps the tiles on screen while the stats refresh', () => {
      mocks.stats.mockReturnValue({
        data: { [spec.statsKey]: spec.stats },
        loading: true,
        refetch: mocks.refetch,
      });
      renderWithProviders(spec.page);

      expect(dashboardProps().statsLoading).toBe(false);
    });

    it('drives the server grid with the paged query, the columns and the date formatter', () => {
      renderWithProviders(spec.page);
      const page = { totalCount: 1, rows: [spec.row] };

      expect(paged.document).toBe(spec.document);
      expect(paged.select?.({ [spec.pageKey]: page } as never)).toBe(page);
      expect(dashboardProps().columnDefs).toBe(spec.columns);
      expect(dashboardProps()).toMatchObject(spec.meta);
      expect(dashboardProps().context.formatDate(NOON_UTC)).toBe('04 Mar 2026');
    });

    it('opens the form blank for a new record and with the row for an edit', async () => {
      renderWithProviders(spec.page);

      await userEvent.click(screen.getByRole('button', { name: 'Open new form' }));
      expect(screen.getByText('Blank form')).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
      expect(screen.queryByText('Blank form')).not.toBeInTheDocument();
      expect(mocks.refetch).not.toHaveBeenCalled();

      await runRowAction('edit', spec.row);
      expect(screen.getByText(`Form for ${JSON.stringify(spec.row)}`)).toBeInTheDocument();
      await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));
      expect(screen.queryByText(/^Form for/)).not.toBeInTheDocument();
      expect(mocks.refetch).toHaveBeenCalledTimes(1);
    });

    it('deletes the row by its id once the delete is confirmed', async () => {
      renderWithProviders(spec.page);

      await answerRowDelete(spec.row, spec.confirm);

      expect(mocks.remove).toHaveBeenCalledWith({ variables: { id: spec.row.id } });
      expect(await screen.findByText(`${spec.entity} deleted`)).toBeInTheDocument();
      expect(mocks.refetch).toHaveBeenCalledTimes(1);
    });

    it('leaves the row alone when the delete is cancelled', async () => {
      renderWithProviders(spec.page);

      await answerRowDelete(spec.row, spec.confirm, 'Cancel');

      expect(mocks.remove).not.toHaveBeenCalled();
      expect(mocks.refetch).not.toHaveBeenCalled();
    });

    it('says why a delete failed and does not reload', async () => {
      mocks.remove.mockRejectedValueOnce(new Error('The record is locked'));
      renderWithProviders(spec.page);

      await answerRowDelete(spec.row, spec.confirm);

      expect(await screen.findByText('The record is locked')).toBeInTheDocument();
      expect(mocks.refetch).not.toHaveBeenCalled();
    });
  });
}
