import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { QuickCreateSelect, type CreatedRecord } from '../../../../src/records/quick-create';
import { renderWithProviders } from '../../test-utils';

const logger = vi.hoisted(() => ({ warn: vi.fn() }));
vi.mock('@exyconn/shell/logging/portalLogger', () => ({ portalLogger: logger }));

const schema = z.object({ companyId: z.string().min(1, 'Pick a company') });
type Values = z.infer<typeof schema>;

interface HarnessProps {
  onRefresh: () => Promise<unknown>;
  onCreated?: (created: CreatedRecord) => void;
  initial?: string;
  helperText?: string;
  watch?: (values: Values) => void;
}

function Harness({ onRefresh, onCreated, initial, helperText, watch }: Readonly<HarnessProps>) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { companyId: initial },
  });
  const submit = form.handleSubmit((values) => watch?.(values));
  return (
    <FormProvider {...form}>
      <form onSubmit={submit}>
        <QuickCreateSelect
          name="companyId"
          label="Company"
          options={[{ value: 'c-1', label: 'Acme' }]}
          createLabel="Create Company"
          renderCreate={(done, cancel) => (
            <>
              <button type="button" onClick={() => done({ id: 'c-9', name: 'Globex' })}>
                Make Globex
              </button>
              <button type="button" onClick={cancel}>
                Never mind
              </button>
            </>
          )}
          onRefresh={onRefresh}
          onCreated={onCreated}
          helperText={helperText}
        />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

async function openList() {
  await userEvent.click(screen.getByRole('combobox', { name: /Company/ }));
  return screen.getByRole('listbox');
}

describe('QuickCreateSelect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers Create, None and the options, and picks an option', async () => {
    const watch = vi.fn();
    renderWithProviders(
      <Harness onRefresh={() => Promise.resolve()} watch={watch} helperText="Who it is for" />,
    );
    expect(screen.getByText('Who it is for')).toBeInTheDocument();

    const list = await openList();
    expect(within(list).getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Create Company',
      'None',
      'Acme',
    ]);
    await userEvent.click(within(list).getByRole('option', { name: 'Acme' }));
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(watch).toHaveBeenCalledWith({ companyId: 'c-1' }));
  });

  it('shows the validation error in place of the hint', async () => {
    renderWithProviders(
      <Harness onRefresh={() => Promise.resolve()} initial="" helperText="Hint" />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    expect(await screen.findByText('Pick a company')).toBeInTheDocument();
    expect(screen.queryByText('Hint')).not.toBeInTheDocument();
  });

  it('opens the create form and picks the new record once the list is refreshed', async () => {
    const onRefresh = vi.fn().mockResolvedValue({});
    const onCreated = vi.fn();
    const watch = vi.fn();
    renderWithProviders(<Harness onRefresh={onRefresh} onCreated={onCreated} watch={watch} />);

    await userEvent.click(within(await openList()).getByRole('option', { name: 'Create Company' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Make Globex' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalledWith({ id: 'c-9', name: 'Globex' }));
    expect(onRefresh).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(watch).toHaveBeenCalledWith({ companyId: 'c-9' }));
  });

  it('picks the new record without an onCreated listener', async () => {
    const watch = vi.fn();
    renderWithProviders(<Harness onRefresh={() => Promise.resolve()} watch={watch} />);
    await userEvent.click(within(await openList()).getByRole('option', { name: 'Create Company' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Make Globex' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(watch).toHaveBeenCalledWith({ companyId: 'c-9' }));
  });

  it('keeps the value when the create form is cancelled', async () => {
    const watch = vi.fn();
    renderWithProviders(<Harness onRefresh={vi.fn()} initial="c-1" watch={watch} />);
    await userEvent.click(within(await openList()).getByRole('option', { name: 'Create Company' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Never mind' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(watch).toHaveBeenCalledWith({ companyId: 'c-1' }));
  });

  it('logs a failed refresh and leaves the value alone', async () => {
    const onCreated = vi.fn();
    const failure = new Error('offline');
    renderWithProviders(
      <Harness onRefresh={() => Promise.reject(failure)} onCreated={onCreated} />,
    );
    await userEvent.click(within(await openList()).getByRole('option', { name: 'Create Company' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Make Globex' }));

    await waitFor(() =>
      expect(logger.warn).toHaveBeenCalledWith(
        'crm: refreshing the list after a quick create failed',
        failure,
      ),
    );
    expect(onCreated).not.toHaveBeenCalled();
  });
});
