import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  FilterOp,
  ListSalarySlipsPagedDocument,
  ListUsersDocument,
  SlipStatus,
} from '@exyconn/shell/graphql/generated';
import { formatMoney } from '@exyconn/shell/utils/money';
import { PayrollSlipsTable } from '../../../../src/pages/payroll/PayrollSlipsTable';
import { renderWithProviders } from '../../test-utils';

const apollo = vi.hoisted(() => {
  const query = vi.fn();
  // One client for the whole test, as Apollo's provider gives: the table reloads when it changes.
  return { query, client: { query }, download: vi.fn() };
});

vi.mock('@apollo/client/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useApolloClient: () => apollo.client,
}));

vi.mock('@exyconn/shell/hooks/usePayslipDownload', () => ({
  usePayslipDownload: () => ({ download: apollo.download }),
}));

const slip = (id: string, employeeId: string, status: SlipStatus) => ({
  id,
  employeeId,
  month: 10,
  year: 2026,
  currency: 'INR',
  gross: 50000,
  deductions: 2500,
  net: 47500,
  status,
  issuedDate: '2026-10-31T12:00:00.000Z',
});

/** Answers the slip and user queries the table makes. */
function answer(slips: unknown, users: unknown = { listUsers: [{ id: 'e1', name: 'Asha Rao' }] }) {
  apollo.query.mockImplementation(({ query }: { query: unknown }) =>
    Promise.resolve({ data: query === ListUsersDocument ? users : slips }),
  );
}

const SLIPS = {
  listSalarySlipsPaged: {
    totalCount: 2,
    rows: [slip('s1', 'e1', SlipStatus.Paid), slip('s2', 'e-gone', SlipStatus.Generated)],
  },
};

function renderTable(month = 10, refreshKey = '2-1') {
  return renderWithProviders(
    <PayrollSlipsTable month={month} year={2026} refreshKey={refreshKey} />,
  );
}

describe('PayrollSlipsTable', () => {
  beforeEach(() => {
    apollo.query.mockReset();
    apollo.download.mockReset().mockResolvedValue(undefined);
    answer(SLIPS);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the month's slips fresh, up to a page of 200", async () => {
    renderTable();

    await screen.findByText('Asha Rao');
    expect(apollo.query).toHaveBeenCalledWith({
      query: ListSalarySlipsPagedDocument,
      fetchPolicy: 'network-only',
      variables: {
        input: {
          page: 0,
          pageSize: 200,
          filters: [
            { field: 'month', op: FilterOp.Equals, value: '10' },
            { field: 'year', op: FilterOp.Equals, value: '2026' },
          ],
        },
      },
    });
    expect(apollo.query).toHaveBeenCalledWith({ query: ListUsersDocument });
  });

  it('names each employee, falling back to the id of somebody no longer listed', async () => {
    renderTable();

    const asha = (await screen.findByText('Asha Rao')).closest('tr') as HTMLElement;
    expect(within(asha).getByText(formatMoney(50000, 'INR'))).toBeInTheDocument();
    expect(within(asha).getByText(formatMoney(2500, 'INR'))).toBeInTheDocument();
    expect(within(asha).getByText(formatMoney(47500, 'INR'))).toBeInTheDocument();
    expect(within(asha).getByText('PAID')).toBeInTheDocument();
    const gone = screen.getByText('e-gone').closest('tr') as HTMLElement;
    expect(within(gone).getByText('GENERATED')).toBeInTheDocument();
  });

  it('says the month has no slips yet', async () => {
    answer({ listSalarySlipsPaged: { totalCount: 0, rows: [] } });
    renderTable();

    expect(
      await screen.findByText('No slips for this month yet — run payroll.'),
    ).toBeInTheDocument();
  });

  it('downloads the PDF of the slip whose button was pressed', async () => {
    renderTable();

    const asha = (await screen.findByText('Asha Rao')).closest('tr') as HTMLElement;
    await userEvent.click(within(asha).getByRole('button', { name: 'download payslip' }));

    expect(apollo.download).toHaveBeenCalledWith('s1');
  });

  it('keeps the table usable when a download fails', async () => {
    apollo.download.mockRejectedValue(new Error('PDF service down'));
    renderTable();

    const asha = (await screen.findByText('Asha Rao')).closest('tr') as HTMLElement;
    await userEvent.click(within(asha).getByRole('button', { name: 'download payslip' }));

    expect(apollo.download).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
  });

  it('reloads the slips when the summary changes and on refresh', async () => {
    const { rerender } = renderTable();
    await screen.findByText('Asha Rao');

    rerender(<PayrollSlipsTable month={10} year={2026} refreshKey="2-2" />);
    await waitFor(() => expect(apollo.query).toHaveBeenCalledTimes(4));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Refresh table' })).toBeEnabled(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Refresh table' }));
    await waitFor(() => expect(apollo.query).toHaveBeenCalledTimes(6));
  });

  it('logs a load that failed and stops waiting', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    answer(undefined);
    renderTable();

    await waitFor(() =>
      expect(logged).toHaveBeenCalledWith(
        'Could not load the salary slips',
        expect.objectContaining({ message: 'The salary-slip list returned no data' }),
      ),
    );
    expect(
      await screen.findByText('No slips for this month yet — run payroll.'),
    ).toBeInTheDocument();
  });

  it('drops the answer of a load the month has moved on from', async () => {
    let finishOctober: (value: unknown) => void = () => undefined;
    apollo.query.mockImplementation(({ query, variables }) => {
      const october = query !== ListUsersDocument && variables.input.filters[0].value === '10';
      if (october) {
        return new Promise((resolve) => {
          finishOctober = resolve;
        });
      }
      const users = { listUsers: [{ id: 'e1', name: 'Asha Rao' }] };
      const rows = [slip('s9', 'e1', SlipStatus.Generated)];
      return Promise.resolve({
        data:
          query === ListUsersDocument ? users : { listSalarySlipsPaged: { totalCount: 1, rows } },
      });
    });
    const { rerender } = renderTable(10);

    rerender(<PayrollSlipsTable month={11} year={2026} refreshKey="2-1" />);
    expect(await screen.findByText('GENERATED')).toBeInTheDocument();
    finishOctober({ data: SLIPS });

    await waitFor(() => expect(screen.queryByText('PAID')).not.toBeInTheDocument());
    expect(screen.queryByText('e-gone')).not.toBeInTheDocument();
  });
});
