import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { z } from 'zod';
import { schemaOfResolver, zodResolver } from '@/components/form/zodResolver';
import { RhfTextField, RhfWorkDays } from '@/components/form/rhf';
import { renderWithProviders } from '../../test-utils';
import { FormHarness } from './formHarness';

const schema = z.object({
  title: z.string().min(1).describe('What people will see'),
  summary: z.string(),
});

describe('the shell zodResolver', () => {
  it('remembers the schema it validates with, and knows no other resolver', () => {
    expect(schemaOfResolver(zodResolver(schema))).toBe(schema);
    expect(schemaOfResolver(() => ({ values: {}, errors: {} }))).toBeUndefined();
    expect(schemaOfResolver(undefined)).toBeUndefined();
  });

  it('lets a field star itself and show its hint from the schema', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ title: '', summary: '' }} resolver={zodResolver(schema)}>
        <RhfTextField name="title" label="Title" />
        <RhfTextField name="summary" label="Summary" />
      </FormHarness>,
    );

    expect(screen.getByRole('textbox', { name: /^Title/ })).toBeRequired();
    expect(screen.getByText('What people will see')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Summary' })).not.toBeRequired();
  });

  it('lets what the field was given win over the schema', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ title: '' }} resolver={zodResolver(schema)}>
        <RhfTextField name="title" label="Title" required={false} helperText="Given hint" />
      </FormHarness>,
    );

    expect(screen.getByRole('textbox', { name: 'Title' })).not.toBeRequired();
    expect(screen.getByText('Given hint')).toBeInTheDocument();
  });

  it('stars a field whose label is not an input of its own', () => {
    const days = z.object({ workDays: z.array(z.number()).min(1) });
    renderWithProviders(
      <FormHarness defaultValues={{ workDays: [] }} resolver={zodResolver(days)}>
        <RhfWorkDays name="workDays" label="Work days" />
      </FormHarness>,
    );

    expect(screen.getByText('Work days')).toHaveTextContent('Work days *');
  });
});
