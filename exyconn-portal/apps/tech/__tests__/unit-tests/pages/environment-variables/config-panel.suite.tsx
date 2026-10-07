import type { ComponentType } from 'react';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../test-utils';
import {
  crud,
  crudState,
  forms,
  notify,
  resetHarness,
  resourceOptions,
  table,
  type StubRow,
} from './panel.harness';

/** The "Test connection" row action a panel offers, and what it says when the test passes. */
export interface ConnectionSpec {
  ariaLabel: string;
  /** The test mutation function, as `useTestXMutation` returns it. */
  mutation: Mock;
  /** What the mutation resolves with when the test passes. */
  result?: unknown;
  /** The arguments the panel toasts with on a pass. */
  success: unknown[];
}

/** What makes one credentials panel different from the next. */
export interface ConfigPanelSpec {
  name: string;
  Panel: ComponentType;
  /** The panel's `useListXQuery` stand-in and the key its rows sit under. */
  listQuery: Mock;
  listKey: string;
  /** The rows the list answers with; the first is the one the tests act on. */
  rows: StubRow[];
  /** Row id -> texts its cells must show. */
  cells: Record<string, string[]>;
  /** The delete mutation function, as `useDeleteXMutation` returns it. */
  deleteMutation: Mock;
  label: string;
  confirm: string;
  /** Values the confirm prompt names the first row by. Defaults to its label. */
  confirmValues?: Record<string, unknown>;
  title: string;
  actionLabel: string;
  emptyMessage: string;
  form: string;
  newTitle: string;
  editTitle: string;
  backLabel: string;
  connection?: ConnectionSpec;
}

function describeConnection(spec: Readonly<ConfigPanelSpec>, connection: ConnectionSpec) {
  const [row] = spec.rows;
  const clickTest = async () => {
    renderWithProviders(<spec.Panel />);
    const cells = within(screen.getByTestId(`row-${row.id}`));
    await userEvent.click(cells.getByRole('button', { name: connection.ariaLabel }));
  };

  it('tests the connection on the chosen row and reports that it passed', async () => {
    connection.mutation.mockResolvedValue(connection.result ?? { data: {} });
    await clickTest();
    await waitFor(() => expect(notify).toHaveBeenCalledWith(...connection.success));
    expect(connection.mutation).toHaveBeenCalledWith({ variables: { id: row.id } });
  });

  it('reports why the provider refused', async () => {
    connection.mutation.mockRejectedValue(new Error('The provider refused the credentials'));
    await clickTest();
    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('The provider refused the credentials', 'error'),
    );
  });

  it('falls back to a plain failure when the error carries no message', async () => {
    connection.mutation.mockRejectedValue('offline');
    await clickTest();
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Connection failed', 'error'));
  });
}

/** The behaviour every Environment Variables credentials panel shares, run against one panel. */
export function describeConfigPanel(spec: Readonly<ConfigPanelSpec>) {
  const refetch = vi.fn(async () => undefined);
  const [first] = spec.rows;

  describe(spec.name, () => {
    beforeEach(() => {
      resetHarness();
      spec.deleteMutation.mockReset();
      spec.connection?.mutation.mockReset();
      spec.listQuery.mockReturnValue({
        data: { [spec.listKey]: spec.rows },
        loading: false,
        refetch,
      });
    });

    it('lists every config under its heading, with secrets masked', () => {
      renderWithProviders(<spec.Panel />);
      expect(screen.getAllByRole('heading', { level: 1, name: spec.title })).not.toHaveLength(0);
      for (const [id, texts] of Object.entries(spec.cells)) {
        const cells = within(screen.getByTestId(`row-${id}`));
        for (const text of texts) {
          expect(cells.getAllByText(text)[0]).toBeInTheDocument();
        }
      }
      expect(table.props).toMatchObject({
        loading: false,
        onRefresh: refetch,
        onEdit: crud.openEdit,
        onDelete: crud.remove,
      });
    });

    it('says there is nothing yet while the list has not answered', () => {
      spec.listQuery.mockReturnValue({ data: undefined, loading: true, refetch });
      renderWithProviders(<spec.Panel />);
      expect(screen.getByText(spec.emptyMessage)).toBeInTheDocument();
      expect(table.props?.loading).toBe(true);
    });

    it('starts a new config from the header action', async () => {
      renderWithProviders(<spec.Panel />);
      await userEvent.click(screen.getByRole('button', { name: spec.actionLabel }));
      expect(crud.openCreate).toHaveBeenCalledTimes(1);
    });

    it('deletes by id after a prompt that names the config, then reloads the list', async () => {
      spec.deleteMutation.mockResolvedValue({ data: {} });
      renderWithProviders(<spec.Panel />);
      const options = resourceOptions();
      expect(options.label).toBe(spec.label);
      expect(options.refetch).toBe(refetch);
      expect(options.confirmMessage(first)).toEqual({
        message: spec.confirm,
        values: spec.confirmValues ?? { label: first.label },
      });
      await options.onDelete(first);
      expect(spec.deleteMutation).toHaveBeenCalledWith({ variables: { id: first.id } });
    });

    it('opens a blank form for a new config, and goes back to the list', async () => {
      crudState.open = true;
      renderWithProviders(<spec.Panel />);
      expect(screen.getByRole('heading', { level: 1, name: spec.newTitle })).toBeInTheDocument();
      expect(forms[spec.form]).toMatchObject({
        initial: null,
        onCancel: crud.close,
        onDone: crud.onDone,
      });
      await userEvent.click(screen.getByRole('button', { name: spec.backLabel }));
      expect(crud.close).toHaveBeenCalledTimes(1);
    });

    it('opens the form on the config being edited', () => {
      crudState.open = true;
      crudState.editing = first;
      renderWithProviders(<spec.Panel />);
      expect(screen.getByRole('heading', { level: 1, name: spec.editTitle })).toBeInTheDocument();
      expect(forms[spec.form]?.initial).toBe(first);
      expect(screen.queryByTestId(`row-${first.id}`)).not.toBeInTheDocument();
    });

    if (spec.connection) {
      describeConnection(spec, spec.connection);
    }
  });
}
