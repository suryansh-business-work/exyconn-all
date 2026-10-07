import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfDatePicker, RhfDateTimePicker } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`);
/** Local midnight (or a local time) as the ISO string a picker stores. */
const localIso = (...parts: [number, number, number, number?, number?]) =>
  new Date(parts[0], parts[1], parts[2], parts[3] ?? 0, parts[4] ?? 0).toISOString();

const required = z.object({ day: z.string().min(1, 'Pick a day') });

describe('RhfDatePicker', () => {
  it('shows a stored ISO date and its hint', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ day: localIso(2026, 2, 4) }}>
        <RhfDatePicker name="day" label="Day" helperText="The first working day" />
      </FormHarness>,
    );

    expect(input('day')).toHaveValue('03/04/2026');
    expect(screen.getByText('The first working day')).toBeInTheDocument();
  });

  it('stores a completed date as an ISO string', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ day: '' }}>
        <RhfDatePicker name="day" label="Day" />
      </FormHarness>,
    );

    fireEvent.change(input('day')!, { target: { value: '04/15/2026' } });

    expect(formValues().day).toBe(localIso(2026, 3, 15));
  });

  it('stores a half-typed date as "not set" instead of throwing', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ day: localIso(2026, 2, 4) }}>
        <RhfDatePicker name="day" label="Day" />
      </FormHarness>,
    );

    fireEvent.change(input('day')!, { target: { value: '15 Apr 2026' } });

    expect(formValues().day).toBe('');
  });

  it('disables the days before minDate in the calendar', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ day: localIso(2026, 2, 12) }}>
        <RhfDatePicker name="day" label="Day" minDate={localIso(2026, 2, 10)} />
      </FormHarness>,
    );

    await userEvent.click(screen.getByRole('button', { name: /Choose date/ }));
    const grid = await screen.findByRole('grid');

    expect(within(grid).getByRole('gridcell', { name: '9' })).toBeDisabled();
    expect(within(grid).getByRole('gridcell', { name: '10' })).not.toBeDisabled();
  });

  it('shows the validation message instead of the hint', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ day: '' }} resolver={zodResolver(required)}>
        <RhfDatePicker name="day" label="Day" helperText="The first working day" />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Pick a day')).toBeInTheDocument();
    expect(screen.queryByText('The first working day')).not.toBeInTheDocument();
  });
});

describe('RhfDateTimePicker', () => {
  it('shows a stored ISO timestamp with its time and hint', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ at: localIso(2026, 2, 4, 15, 30) }}>
        <RhfDateTimePicker name="at" label="At" helperText="When the work happened" />
      </FormHarness>,
    );

    expect(input('at')).toHaveValue('03/04/2026 03:30 PM');
    expect(screen.getByText('When the work happened')).toBeInTheDocument();
  });

  it('stores a completed timestamp as ISO, and a half-typed one as empty', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ at: '' }}>
        <RhfDateTimePicker name="at" label="At" maxDateTime={new Date(2030, 0, 1)} />
      </FormHarness>,
    );

    fireEvent.change(input('at')!, { target: { value: '04/15/2026 09:05 AM' } });
    expect(formValues().at).toBe(localIso(2026, 3, 15, 9, 5));

    fireEvent.change(input('at')!, { target: { value: 'tomorrow' } });
    expect(formValues().at).toBe('');
  });

  it('shows the validation message instead of the hint', async () => {
    const schema = z.object({ at: z.string().min(1, 'Pick a time') });
    renderWithProviders(
      <FormHarness defaultValues={{ at: '' }} resolver={zodResolver(schema)}>
        <RhfDateTimePicker name="at" label="At" helperText="When the work happened" />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Pick a time')).toBeInTheDocument();
    expect(screen.queryByText('When the work happened')).not.toBeInTheDocument();
  });
});
