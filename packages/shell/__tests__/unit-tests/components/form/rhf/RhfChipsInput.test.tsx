import { describe, expect, it } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfChipsInput } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

describe('RhfChipsInput', () => {
  it('adds a typed value as a chip on Enter', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ skills: ['Go'] }}>
        <RhfChipsInput name="skills" label="Skills" />
      </FormHarness>,
    );

    await user.type(screen.getByRole('combobox', { name: 'Skills' }), 'Rust{Enter}');

    expect(formValues().skills).toEqual(['Go', 'Rust']);
    expect(screen.getByRole('button', { name: 'Rust' })).toBeInTheDocument();
  });

  it('removes a chip from the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <FormHarness defaultValues={{ skills: ['Go', 'Rust'] }}>
        <RhfChipsInput name="skills" label="Skills" />
      </FormHarness>,
    );

    const chip = screen.getByRole('button', { name: 'Go' });
    await user.click(chip.querySelector('.MuiChip-deleteIcon'));

    expect(formValues().skills).toEqual(['Rust']);
  });

  it('treats a missing list as empty and tells the person how to add one', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfChipsInput name="skills" label="Skills" />
      </FormHarness>,
      { messages: { 'Type a value and press Enter': 'Escribe y pulsa Intro' } },
    );

    expect(screen.getByText('Escribe y pulsa Intro')).toBeInTheDocument();
    expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(0);
    expect(formValues().skills).toBeUndefined();
  });

  it('shows the page hint over the default one, and the error over both', async () => {
    const schema = z.object({ skills: z.array(z.string()).min(1, 'Add at least one skill') });
    renderWithProviders(
      <FormHarness defaultValues={{ skills: [] }} resolver={zodResolver(schema)}>
        <RhfChipsInput name="skills" label="Skills" helperText="What they are good at" />
      </FormHarness>,
    );

    expect(screen.getByText('What they are good at')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Add at least one skill')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Skills' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });
});
