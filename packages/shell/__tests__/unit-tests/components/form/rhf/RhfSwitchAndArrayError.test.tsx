import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import { act, fireEvent, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FieldValues, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { I18nProvider } from '@exyconn/i18n';
import { RhfFieldArrayError, RhfSwitch } from '@/components/form/rhf';
import { useFieldCopy } from '@/components/form/rhf/useFieldCopy';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

describe('RhfSwitch', () => {
  it('reflects the stored boolean and writes the toggle back', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ active: false }}>
        <RhfSwitch name="active" label="Active" />
      </FormHarness>,
      { messages: { Active: 'Activo' } },
    );

    const toggle = screen.getByRole('switch', { name: 'Activo' });
    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAttribute('name', 'active');
    expect(toggle).not.toHaveAttribute('aria-describedby');

    await userEvent.click(toggle);

    expect(toggle).toBeChecked();
    expect(formValues().active).toBe(true);
  });

  it('shows and announces the message when a required switch is left off', async () => {
    const schema = z.object({
      agree: z.literal(true, { error: 'Accept the contract to continue' }),
    });
    renderWithProviders(
      <FormHarness defaultValues={{}} resolver={zodResolver(schema)}>
        <RhfSwitch name="agree" label="I agree" />
      </FormHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Accept the contract to continue');
    expect(alert).toHaveAttribute('id', 'agree-error');
    expect(screen.getByRole('switch', { name: 'I agree' })).toHaveAttribute(
      'aria-describedby',
      'agree-error',
    );
  });
});

const linesSchema = z.object({
  lines: z.array(z.object({ text: z.string() })).min(1, 'Add at least one line'),
});

describe('RhfFieldArrayError', () => {
  it('shows nothing while the array is valid', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ lines: [{ text: 'a' }] }}>
        <RhfFieldArrayError name="lines" />
      </FormHarness>,
    );

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows the rule on the empty array itself, translated', async () => {
    renderWithProviders(
      <FormHarness defaultValues={{ lines: [] }} resolver={zodResolver(linesSchema)}>
        <RhfFieldArrayError name="lines" />
      </FormHarness>,
      { messages: { 'Add at least one line': 'Añade al menos una línea' } },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Añade al menos una línea');
  });

  it('reads the rule from root once the array has rows', async () => {
    // Untyped paths: React Hook Form keeps an array rule under `<name>.root`, which its types omit.
    let form: UseFormReturn<FieldValues> | undefined;
    renderWithProviders(
      <FormHarness<FieldValues>
        defaultValues={{ lines: [{ text: 'a' }, { text: 'a' }] }}
        onMethods={(methods) => {
          form = methods;
        }}
      >
        <RhfFieldArrayError name="lines" />
      </FormHarness>,
    );

    act(() => {
      form?.setError('lines.root', { message: 'Two lines cannot be the same' });
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('Two lines cannot be the same');
  });
});

describe('useFieldCopy', () => {
  it('translates a plain string and passes anything else through untouched', () => {
    const { result } = renderHook(() => useFieldCopy(), {
      wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
        <I18nProvider locale="es" messages={{ Name: 'Nombre' }}>
          {children}
        </I18nProvider>
      ),
    });
    const node = <strong>Bold hint</strong>;

    expect(result.current('Name')).toBe('Nombre');
    expect(result.current(node)).toBe(node);
    expect(result.current(undefined)).toBeUndefined();
  });
});
