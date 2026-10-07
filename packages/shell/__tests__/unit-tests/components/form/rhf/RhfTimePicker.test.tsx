import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfTimePicker } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';
import { appSettingsMock } from '../settingsMock';

const input = (name: string) => document.querySelector<HTMLInputElement>(`input[name="${name}"]`);

function renderTime(value: unknown, props: { hoursOnly?: boolean; helperText?: string } = {}) {
  return renderWithProviders(
    <FormHarness defaultValues={{ start: value }}>
      <RhfTimePicker name="start" label="Start" {...props} />
    </FormHarness>,
  );
}

describe('RhfTimePicker', () => {
  it('shows a stored HH:mm on the 12-hour clock the default settings use', () => {
    renderTime('09:30', { helperText: 'When the shift starts' });

    expect(input('start')).toHaveValue('09:30 AM');
    expect(screen.getByText('When the shift starts')).toBeInTheDocument();
  });

  it('writes a picked time back as HH:mm', () => {
    renderTime('09:30');

    fireEvent.change(input('start')!, { target: { value: '11:45 PM' } });

    expect(formValues().start).toBe('23:45');
  });

  it('writes an emptied time back as an empty string', () => {
    renderTime('09:30');

    fireEvent.change(input('start')!, { target: { value: '' } });

    expect(formValues().start).toBe('');
  });

  it.each([[''], [null], ['not a time']])('shows nothing for a stored %j', (value) => {
    renderTime(value);

    expect(input('start')).toHaveValue('');
  });

  it('shows nothing for a field the form has no value for', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfTimePicker name="start" label="Start" />
      </FormHarness>,
    );

    expect(input('start')).toHaveValue('');
  });

  it('reads and writes a whole hour as a number with hoursOnly', () => {
    renderTime(14, { hoursOnly: true });

    expect(input('start')).toHaveValue('02 PM');
    expect(screen.queryByRole('spinbutton', { name: 'Minutes' })).not.toBeInTheDocument();

    fireEvent.change(input('start')!, { target: { value: '05 AM' } });
    expect(formValues().start).toBe(5);
  });

  it('follows a 24-hour time format set by the admin', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ start: '21:05' }}>
        <RhfTimePicker name="start" label="Start" />
      </FormHarness>,
      { mocks: [appSettingsMock('HH:mm')] },
    );

    await expect.poll(() => input('start')?.value).toBe('21:05');
    expect(screen.queryByRole('spinbutton', { name: 'Meridiem' })).not.toBeInTheDocument();
  });

  it('shows the validation message in place of the hint, translated', async () => {
    const schema = z.object({ start: z.string().min(1, 'Pick a start time') });
    renderWithProviders(
      <FormHarness defaultValues={{ start: '' }} resolver={zodResolver(schema)}>
        <RhfTimePicker name="start" label="Start" helperText="When the shift starts" />
      </FormHarness>,
      { messages: { 'Pick a start time': 'Elige una hora' } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Elige una hora')).toBeInTheDocument();
    expect(screen.queryByText('When the shift starts')).not.toBeInTheDocument();
  });
});
