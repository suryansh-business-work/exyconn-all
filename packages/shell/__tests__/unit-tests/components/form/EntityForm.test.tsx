import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { I18nProvider } from '@exyconn/i18n';
import { NotificationProvider } from '@/components/feedback/NotificationProvider';
import { EntityForm } from '@/components/form/EntityForm';
import { FormActions } from '@/components/form/FormActions';
import { useEntitySave, type UseEntitySaveOptions } from '@/components/form/useEntitySave';
import { RhfTextField } from '@/components/form/rhf';
import { renderWithProviders } from '../../test-utils';

interface Lead {
  id: string;
  name: string;
}

const schema = z.object({ name: z.string().min(1, 'Name is required') });

function LeadForm({
  onSubmit,
  onCancel,
  submitLabel,
}: Readonly<{
  onSubmit: (v: { name: string }) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}>) {
  const methods = useForm({ defaultValues: { name: '' }, resolver: zodResolver(schema) });
  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel={submitLabel}
    >
      <RhfTextField name="name" label="Name" />
    </EntityForm>
  );
}

describe('EntityForm', () => {
  it('submits valid values and shows "Saving…" while the save runs', async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderWithProviders(<LeadForm onSubmit={onSubmit} onCancel={vi.fn()} submitLabel="Send" />);

    await userEvent.type(screen.getByLabelText('Name'), 'Acme');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(await screen.findByRole('button', { name: /Saving…/ })).toBeInTheDocument();
    expect(onSubmit).toHaveBeenCalledWith({ name: 'Acme' }, expect.anything());
    act(() => finish());
    expect(await screen.findByRole('button', { name: 'Send' })).toBeInTheDocument();
  });

  it('blocks an invalid submit with the field message, and cancels', async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(<LeadForm onSubmit={onSubmit} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('FormActions', () => {
  it('labels the submit Create or Update, and runs onCancel', async () => {
    const onCancel = vi.fn();
    const { rerender } = renderWithProviders(
      <FormActions submitting={false} isEdit={false} onCancel={onCancel} />,
    );
    expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('type', 'submit');

    rerender(<FormActions submitting={false} isEdit onCancel={onCancel} />);
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

function wrapper({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <I18nProvider
      locale="es"
      messages={{
        Lead: 'Cliente potencial',
        '{entity} created': '{entity} creado',
        '{entity} updated': '{entity} actualizado',
      }}
    >
      <NotificationProvider>{children}</NotificationProvider>
    </I18nProvider>
  );
}

function setup(patch: Partial<UseEntitySaveOptions<{ name: string }, Lead>> = {}) {
  const options: UseEntitySaveOptions<{ name: string }, Lead> = {
    label: 'Lead',
    initial: null,
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    onDone: vi.fn(),
    ...patch,
  };
  return { options, ...renderHook(() => useEntitySave(options), { wrapper }) };
}

describe('useEntitySave', () => {
  it('creates a new record, announces it in the reader language and hands back control', async () => {
    const { options, result } = setup();
    expect(result.current.isEdit).toBe(false);

    await act(() => result.current.onSubmit({ name: 'Acme' }));

    expect(options.create).toHaveBeenCalledWith({ name: 'Acme' });
    expect(options.update).not.toHaveBeenCalled();
    expect(options.onDone).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('Cliente potencial creado')).toBeInTheDocument();
  });

  it('updates the row being edited, filling a label placeholder', async () => {
    const row = { id: 'lead-1', name: 'Acme' };
    const { options, result } = setup({
      initial: row,
      label: 'Administrator for {organization}',
      labelValues: { organization: 'Acme' },
    });
    expect(result.current.isEdit).toBe(true);

    await act(() => result.current.onSubmit({ name: 'Acme Ltd' }));

    expect(options.update).toHaveBeenCalledWith(row, { name: 'Acme Ltd' });
    expect(options.create).not.toHaveBeenCalled();
    expect(await screen.findByText('Administrator for Acme actualizado')).toBeInTheDocument();
  });

  it('reports a failed save and keeps the dialog open', async () => {
    const { options, result } = setup({
      create: vi.fn().mockRejectedValue(new Error('Email already used')),
    });

    await act(() => result.current.onSubmit({ name: 'Acme' }));

    expect(options.onDone).not.toHaveBeenCalled();
    expect(await screen.findByText('Email already used')).toBeInTheDocument();
  });

  it('falls back to a generic message for a non-Error rejection', async () => {
    const { result } = setup({ create: vi.fn().mockRejectedValue('boom') });

    await act(() => result.current.onSubmit({ name: 'Acme' }));

    await waitFor(() => expect(screen.getByText('Save failed')).toBeInTheDocument());
  });
});
