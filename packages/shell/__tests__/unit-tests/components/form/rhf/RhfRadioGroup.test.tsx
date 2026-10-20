import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfRadioGroup, type RadioChoice } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

const MODES: RadioChoice[] = [
  {
    value: 'LIVE',
    label: 'Live',
    description: 'Re-reads the rules before every send',
    recommended: true,
  },
  { value: 'FIXED', label: 'Fixed' },
];

describe('RhfRadioGroup', () => {
  it('labels the group, explains each option and flags the recommended one', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ mode: 'FIXED' }}>
        <RhfRadioGroup name="mode" label="Update mode" options={MODES} helperText="Pick one">
          <p>Example below the group</p>
        </RhfRadioGroup>
      </FormHarness>,
      { messages: { Recommended: 'Recomendado' } },
    );
    const group = screen.getByRole('radiogroup', { name: 'Update mode' });
    expect(group).toHaveAccessibleDescription('Pick one');
    expect(screen.getByRole('radio', { name: /Live/ })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Fixed' })).toBeChecked();
    expect(screen.getByText('Re-reads the rules before every send')).toBeInTheDocument();
    expect(screen.getAllByText('Recomendado')).toHaveLength(1);
    expect(screen.getByText('Example below the group')).toBeInTheDocument();
  });

  it('writes the chosen value back to the form', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ mode: 'FIXED' }}>
        <RhfRadioGroup name="mode" label="Update mode" options={MODES} />
      </FormHarness>,
    );
    await userEvent.click(screen.getByRole('radio', { name: /Live/ }));
    expect(formValues().mode).toBe('LIVE');
  });

  it('selects nothing when the field is unset, and announces a validation error', async () => {
    const schema = z.object({ mode: z.enum(['LIVE', 'FIXED'], { error: 'Choose a mode' }) });
    renderWithProviders(
      <FormHarness defaultValues={{}} resolver={zodResolver(schema)}>
        <RhfRadioGroup name="mode" label="Update mode" options={MODES} helperText="Pick one" />
      </FormHarness>,
    );
    expect(
      screen.getAllByRole('radio').filter((radio) => (radio as HTMLInputElement).checked),
    ).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Choose a mode');
    expect(screen.queryByText('Pick one')).not.toBeInTheDocument();
  });
});
