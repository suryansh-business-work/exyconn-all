import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { RhfSecretField } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

/** What the field reported through the notifier. */
const notify = vi.hoisted(() => vi.fn());

vi.mock('@/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/feedback/NotificationProvider')>()),
  useNotify: () => notify,
}));

/** A saved value the server hands back, built at runtime so no key literal lives here. */
const savedValue = ['saved', 'value', 42].join('-');

type FieldProps = Parameters<typeof RhfSecretField>[0];

function renderField(props: Partial<FieldProps> = {}, apiKey = '') {
  notify.mockReset();
  renderWithProviders(
    <FormHarness defaultValues={{ apiKey }}>
      <RhfSecretField name="apiKey" label="API key" {...props} />
    </FormHarness>,
  );
}

const field = () => screen.getByLabelText('API key');

describe('RhfSecretField', () => {
  it('hides what is typed until the eye shows it, and hides it again', async () => {
    renderField({ helperText: 'From the provider dashboard' });

    await userEvent.type(field(), 'typed');
    expect(field()).toHaveAttribute('type', 'password');
    expect(formValues().apiKey).toBe('typed');
    expect(screen.getByText('From the provider dashboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show API key' }));
    expect(field()).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide API key' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Hide API key' }));
    expect(field()).toHaveAttribute('type', 'password');
  });

  it('fetches a saved key for the eye, without marking the form changed', async () => {
    const onReveal = vi.fn().mockResolvedValue(savedValue);
    renderField({ stored: true, onReveal, helperText: 'Replaced while hidden' });

    expect(field()).toHaveAttribute('placeholder', '••••••••••••');
    expect(
      screen.getByText('Saved. Use the eye to see it, or type a new one to replace it.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Replaced while hidden')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show API key' }));

    await waitFor(() => expect(field()).toHaveValue(savedValue));
    expect(field()).toHaveAttribute('type', 'text');
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Replaced while hidden')).toBeInTheDocument();
  });

  it('does not fetch the saved key once something is typed', async () => {
    const onReveal = vi.fn();
    renderField({ stored: true, onReveal }, 'new-value');

    await userEvent.click(screen.getByRole('button', { name: 'Show API key' }));

    expect(onReveal).not.toHaveBeenCalled();
    expect(field()).toHaveValue('new-value');
  });

  it('shows an unset value as an empty field', () => {
    notify.mockReset();
    renderWithProviders(
      <FormHarness defaultValues={{ apiKey: null }}>
        <RhfSecretField name="apiKey" label="API key" />
      </FormHarness>,
    );

    expect(field()).toHaveValue('');
  });

  it('keeps the caller’s hint for a saved key the eye cannot fetch', () => {
    renderField({ stored: true, helperText: 'Ask an admin to change it' });

    expect(screen.getByText('Ask an admin to change it')).toBeInTheDocument();
  });

  it('says so and stays hidden when the saved key cannot be loaded', async () => {
    const onReveal = vi.fn().mockRejectedValue(new Error('Forbidden'));
    renderField({ stored: true, onReveal });

    await userEvent.click(screen.getByRole('button', { name: 'Show API key' }));

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Could not load the saved {label}', 'error', {
        label: 'API key',
      }),
    );
    expect(field()).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: 'Show API key' })).toBeEnabled();
  });

  it('frees the eye even when the failure cannot be reported', async () => {
    const onReveal = vi.fn().mockRejectedValue(new Error('Forbidden'));
    renderField({ stored: true, onReveal });
    notify.mockImplementationOnce(() => {
      throw new Error('The notifier is gone');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Show API key' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Show API key' })).toBeEnabled());
    expect(field()).toHaveAttribute('type', 'password');
  });

  it('shows a validation message in place of the hint', async () => {
    const schema = z.object({ apiKey: z.string().min(1, 'Enter the key') });
    notify.mockReset();
    renderWithProviders(
      <FormHarness defaultValues={{ apiKey: '' }} resolver={zodResolver(schema)}>
        <RhfSecretField name="apiKey" label="API key" helperText="From the dashboard" />
      </FormHarness>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByText('Enter the key')).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('RhfSecretField Test button', () => {
  it('reports what worked', async () => {
    const onTest = vi.fn().mockResolvedValue('The key works');
    renderField({ onTest });

    await userEvent.click(screen.getByRole('button', { name: 'Test the API key' }));

    await waitFor(() => expect(notify).toHaveBeenCalledWith('The key works', 'success'));
    expect(screen.getByRole('button', { name: 'Test the API key' })).toBeEnabled();
  });

  it('is disabled while the test runs', async () => {
    let finish: (message: string) => void = () => undefined;
    const onTest = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          finish = resolve;
        }),
    );
    renderField({ onTest });

    await userEvent.click(screen.getByRole('button', { name: 'Test the API key' }));
    expect(screen.getByRole('button', { name: 'Test the API key' })).toBeDisabled();

    finish('ok');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Test the API key' })).toBeEnabled(),
    );
  });

  it('reports why the key failed, or a general failure without a reason', async () => {
    const onTest = vi
      .fn()
      .mockRejectedValueOnce(new Error('Invalid key'))
      .mockRejectedValueOnce('nope');
    renderField({ onTest });
    const button = screen.getByRole('button', { name: 'Test the API key' });

    await userEvent.click(button);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('Invalid key', 'error'));

    await userEvent.click(button);
    await waitFor(() => expect(notify).toHaveBeenCalledWith('The API key test failed', 'error'));
  });

  it('frees the button even when the outcome cannot be reported', async () => {
    const onTest = vi.fn().mockResolvedValue('ok');
    renderField({ onTest });
    notify.mockImplementation(() => {
      throw new Error('The notifier is gone');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Test the API key' }));

    await waitFor(() => expect(notify).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('button', { name: 'Test the API key' })).toBeEnabled();
  });
});
