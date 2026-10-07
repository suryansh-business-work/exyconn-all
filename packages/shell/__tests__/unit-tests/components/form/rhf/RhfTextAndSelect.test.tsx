import { describe, expect, it } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfMultiSelect, RhfSelect, RhfTextField } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

const ROLES = [
  { value: 'ADMIN', label: 'Administrator' },
  { value: 'HR', label: 'People team' },
];

describe('RhfTextField', () => {
  it('writes what is typed into the form, with a translated label and hint', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ title: '' }}>
        <RhfTextField name="title" label="Title" helperText="Shown on the card" />
      </FormHarness>,
      { messages: { Title: 'Título', 'Shown on the card': 'Se muestra en la tarjeta' } },
    );

    await userEvent.type(screen.getByLabelText('Título'), 'Quarterly plan');

    expect(formValues().title).toBe('Quarterly plan');
    expect(screen.getByText('Se muestra en la tarjeta')).toBeInTheDocument();
  });

  it('treats a missing value as empty and passes other props through', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfTextField name="title" label="Title" placeholder="Untitled" />
      </FormHarness>,
    );

    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Title')).toHaveAttribute('placeholder', 'Untitled');
  });

  it('shows the validation message instead of the hint', async () => {
    const schema = z.object({ title: z.string().min(1, 'Title is required') });
    renderWithProviders(
      <FormHarness defaultValues={{ title: '' }} resolver={zodResolver(schema)}>
        <RhfTextField name="title" label="Title" helperText="Shown on the card" />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByText('Shown on the card')).not.toBeInTheDocument();
  });
});

describe('RhfSelect', () => {
  it('stores the value of the chosen option', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ role: 'ADMIN' }}>
        <RhfSelect name="role" label="Role" options={ROLES} helperText="What they can do" />
      </FormHarness>,
    );

    expect(screen.getByRole('combobox', { name: /Role/ })).toHaveTextContent('Administrator');
    await userEvent.click(screen.getByRole('combobox', { name: /Role/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'People team' }),
    );

    expect(formValues().role).toBe('HR');
    expect(screen.getByText('What they can do')).toBeInTheDocument();
  });

  it('starts empty for a missing value and shows the validation message', async () => {
    const schema = z.object({ role: z.string({ error: 'Pick a role' }) });
    renderWithProviders(
      <FormHarness defaultValues={{}} resolver={zodResolver(schema)}>
        <RhfSelect name="role" label="Role" options={ROLES} />
      </FormHarness>,
    );

    expect(document.querySelector('input[name="role"]')).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Pick a role')).toBeInTheDocument();
  });
});

describe('RhfMultiSelect', () => {
  it('renders the stored values as chips, by label, and keeps an unknown value as-is', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ roles: ['HR', 'LEGACY'] }}>
        <RhfMultiSelect name="roles" label="Roles" options={ROLES} helperText="Pick any" />
      </FormHarness>,
    );

    const combobox = screen.getByRole('combobox', { name: /Roles/ });
    expect(within(combobox).getByText('People team')).toBeInTheDocument();
    expect(within(combobox).getByText('LEGACY')).toBeInTheDocument();
    expect(screen.getByText('Pick any')).toBeInTheDocument();
  });

  it('adds a picked option to the list', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfMultiSelect name="roles" label="Roles" options={ROLES} />
      </FormHarness>,
    );

    await userEvent.click(screen.getByRole('combobox', { name: /Roles/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Administrator' }),
    );
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'People team' }),
    );

    expect(formValues().roles).toEqual(['ADMIN', 'HR']);
  });

  it('shows the validation message instead of the hint', async () => {
    const schema = z.object({ roles: z.array(z.string()).min(1, 'Pick at least one role') });
    renderWithProviders(
      <FormHarness defaultValues={{ roles: [] }} resolver={zodResolver(schema)}>
        <RhfMultiSelect name="roles" label="Roles" options={ROLES} helperText="Pick any" />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Pick at least one role')).toBeInTheDocument();
    expect(screen.queryByText('Pick any')).not.toBeInTheDocument();
  });
});
