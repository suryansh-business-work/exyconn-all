import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BillingRangePicker } from '../../../../src/pages/tracker/BillingRangePicker';
import { renderWithProviders } from '../../test-utils';
import { PICKED } from './tracker.mocks';

vi.mock('@exyconn/ui/pickers', async (importOriginal) =>
  (await import('./tracker.mocks')).pickersModuleMock(importOriginal),
);

const range = { from: '2026-01-01T00:00:00.000Z', to: '2026-02-01T00:00:00.000Z' };
const picker = (label: string) => within(screen.getByRole('group', { name: label }));

describe('BillingRangePicker', () => {
  it('shows the period it was given in the From and To pickers', () => {
    renderWithProviders(<BillingRangePicker range={range} onChange={vi.fn()} />);
    expect(picker('From').getByRole('status')).toHaveTextContent(range.from);
    expect(picker('To').getByRole('status')).toHaveTextContent(range.to);
  });

  it('moves only the start when From changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<BillingRangePicker range={range} onChange={onChange} />);
    await userEvent.click(picker('From').getByRole('button', { name: 'Pick' }));
    expect(onChange).toHaveBeenCalledWith({ from: PICKED.toISOString(), to: range.to });
  });

  it('moves only the end when To changes', async () => {
    const onChange = vi.fn();
    renderWithProviders(<BillingRangePicker range={range} onChange={onChange} />);
    await userEvent.click(picker('To').getByRole('button', { name: 'Pick' }));
    expect(onChange).toHaveBeenCalledWith({ from: range.from, to: PICKED.toISOString() });
  });

  it('keeps the period while a date is half-typed or cleared', async () => {
    const onChange = vi.fn();
    renderWithProviders(<BillingRangePicker range={range} onChange={onChange} />);
    await userEvent.click(picker('From').getByRole('button', { name: 'Half-type' }));
    await userEvent.click(picker('To').getByRole('button', { name: 'Clear' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
