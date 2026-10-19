import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfWorkDays } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

const day = (name: string) => screen.getByRole('button', { name });

describe('RhfWorkDays', () => {
  it('shows the seven days Monday first, pressed for the ones already worked', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ workDays: [1, 3] }}>
        <RhfWorkDays name="workDays" label="Work days" helperText="Pick the days" />
      </FormHarness>,
    );
    const group = screen.getByRole('group', { name: 'Work days' });
    expect(group).toHaveAccessibleDescription('Pick the days');
    const names = screen
      .getAllByRole('button')
      .filter((button) => button.hasAttribute('aria-pressed'))
      .map((button) => button.textContent);
    expect(names).toEqual([
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(day('Monday')).toHaveAttribute('aria-pressed', 'true');
    expect(day('Tuesday')).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles days on and off, keeping the value in week order', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ workDays: [5] }}>
        <RhfWorkDays name="workDays" label="Work days" />
      </FormHarness>,
    );
    await user.click(day('Sunday'));
    await user.click(day('Monday'));
    expect(formValues().workDays).toEqual([1, 5, 0]);
    await user.click(day('Friday'));
    expect(formValues().workDays).toEqual([1, 0]);
    expect(day('Friday')).toHaveAttribute('aria-pressed', 'false');
  });

  it('starts from no days when the field is unset, with no hint to describe', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfWorkDays name="workDays" label="Work days" />
      </FormHarness>,
    );
    expect(screen.getByRole('group', { name: 'Work days' })).not.toHaveAttribute(
      'aria-describedby',
    );
    await user.click(day('Wednesday'));
    expect(formValues().workDays).toEqual([3]);
  });

  it("shows the schema's message in place of the hint when the week is invalid", async () => {
    const schema = z.object({ workDays: z.array(z.number()).min(1, 'Pick at least one day') });
    renderWithProviders(
      <FormHarness defaultValues={{ workDays: [] }} resolver={zodResolver(schema)}>
        <RhfWorkDays name="workDays" label="Work days" helperText="Pick the days" />
      </FormHarness>,
      { messages: { 'Pick at least one day': 'Elige al menos un día' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const message = await screen.findByText('Elige al menos un día');
    expect(message).toHaveClass('Mui-error');
    expect(screen.queryByText('Pick the days')).not.toBeInTheDocument();
  });
});
