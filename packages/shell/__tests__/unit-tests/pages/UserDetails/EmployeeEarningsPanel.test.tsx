import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { PayType, useEmployeeEarningsQuery } from '@/graphql/generated';
import { EmployeeEarningsPanel } from '@/pages/UserDetails/EmployeeEarningsPanel';
import { renderWithProviders } from '../../test-utils';
import { queryResult } from '../hookMocks';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useEmployeeEarningsQuery: vi.fn(),
}));

const hourly = {
  payType: PayType.Hourly,
  rate: 500,
  currency: 'INR',
  trackedMs: 2 * 3_600_000 + 30 * 60_000,
  amount: 1250,
};

/** The text box of the picker labelled `label`. */
const pickerInput = (label: string) =>
  screen.getByText(label, { selector: 'label' }).parentElement!.querySelector('input')!;

const lastVariables = () => vi.mocked(useEmployeeEarningsQuery).mock.lastCall?.[0]?.variables;

function show(result: ReturnType<typeof queryResult>) {
  vi.mocked(useEmployeeEarningsQuery).mockReturnValue(
    result as unknown as ReturnType<typeof useEmployeeEarningsQuery>,
  );
  return renderWithProviders(<EmployeeEarningsPanel employeeId="emp-1" />);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 5, 15, 10, 0));
  vi.mocked(useEmployeeEarningsQuery).mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EmployeeEarningsPanel', () => {
  it('asks for the whole current month, from its first moment to its last', () => {
    show(queryResult(undefined, { loading: true }));
    expect(lastVariables()).toEqual({
      employeeId: 'emp-1',
      from: new Date(2026, 5, 1).toISOString(),
      to: new Date(2026, 5, 30, 23, 59, 59, 999).toISOString(),
    });
    expect(pickerInput('From')).toHaveValue('06/01/2026');
    expect(pickerInput('To')).toHaveValue('06/30/2026');
    expect(
      screen.getByRole('heading', { name: 'Earnings' }).closest('[aria-busy]'),
    ).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Tracked hours')).not.toBeInTheDocument();
  });

  it('prices the tracked time at the hourly rate', () => {
    show(queryResult({ employeeEarnings: hourly }));
    expect(screen.getByText('Tracked hours').nextElementSibling).toHaveTextContent('2h 30m');
    expect(screen.getByText('Rate per hour').nextElementSibling).toHaveTextContent('500');
    expect(screen.getByText('Amount').nextElementSibling).toHaveTextContent('1,250');
  });

  it('explains where to set an hourly rate when the pay is not by the hour', () => {
    show(queryResult({ employeeEarnings: { ...hourly, payType: PayType.Fixed, rate: null } }));
    expect(screen.getByText('Earnings need an hourly pay rate')).toBeInTheDocument();
    expect(screen.queryByText('Amount')).not.toBeInTheDocument();
  });

  it('says why the earnings could not be read', () => {
    show(queryResult(undefined, { error: new Error('Not allowed') }));
    expect(screen.getByRole('alert')).toHaveTextContent('Not allowed');
  });

  it('re-reads the range when a day is picked, and ignores a half-typed one', () => {
    show(queryResult({ employeeEarnings: hourly }));
    fireEvent.change(pickerInput('From'), { target: { value: '06/10/2026' } });
    expect(lastVariables()?.from).toBe(new Date(2026, 5, 10).toISOString());
    fireEvent.change(pickerInput('To'), { target: { value: '06/20/2026' } });
    expect(lastVariables()?.to).toBe(new Date(2026, 5, 20, 23, 59, 59, 999).toISOString());

    const calls = vi.mocked(useEmployeeEarningsQuery).mock.calls.length;
    fireEvent.change(pickerInput('To'), { target: { value: '13/45/2026' } });
    expect(vi.mocked(useEmployeeEarningsQuery).mock.calls.length).toBeGreaterThanOrEqual(calls);
    expect(lastVariables()?.to).toBe(new Date(2026, 5, 20, 23, 59, 59, 999).toISOString());
  });
});
