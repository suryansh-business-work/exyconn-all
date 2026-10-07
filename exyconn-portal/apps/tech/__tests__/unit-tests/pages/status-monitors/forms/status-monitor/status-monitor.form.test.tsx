import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusCategory } from '@exyconn/shell/graphql/generated';
import { StatusMonitorForm } from '../../../../../../src/pages/status-monitors/forms/status-monitor';
import { renderWithProviders } from '../../../../test-utils';
import { MONITOR } from './status-monitor.fixtures';

const gql = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), notify: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateStatusMonitorMutation: () => [gql.create],
  useUpdateStatusMonitorMutation: () => [gql.update],
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => gql.notify,
}));

const onDone = vi.fn();
const onCancel = vi.fn();

const fill = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));

describe('StatusMonitorForm', () => {
  beforeEach(() => {
    gql.create.mockReset().mockResolvedValue({ data: {} });
    gql.update.mockReset().mockResolvedValue({ data: {} });
    gql.notify.mockReset();
    onDone.mockReset();
    onCancel.mockReset();
  });

  it('requires a key, a name and a URL before creating', async () => {
    renderWithProviders(<StatusMonitorForm initial={null} onDone={onDone} onCancel={onCancel} />);
    await press('Create');
    expect(await screen.findByText('Key is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('URL is required')).toBeInTheDocument();
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('creates a shown portal monitor from the typed fields', async () => {
    renderWithProviders(<StatusMonitorForm initial={null} onDone={onDone} onCancel={onCancel} />);
    expect(screen.getByRole('switch', { name: 'Show on the status page' })).toBeChecked();
    fill('Service name', 'Tools API');
    fill('Key', 'tools-api');
    fill('URL to probe', 'https://tools-api.example.com/health');
    fill('Order', '2');
    await press('Create');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.create).toHaveBeenCalledWith({
      variables: {
        input: {
          key: 'tools-api',
          name: 'Tools API',
          description: '',
          category: StatusCategory.Portal,
          url: 'https://tools-api.example.com/health',
          isActive: true,
          order: 2,
        },
      },
    });
    expect(gql.notify).toHaveBeenCalledWith('{entity} created', 'success', {
      entity: 'Status monitor',
    });
  });

  it('updates a saved monitor with a new category and visibility', async () => {
    renderWithProviders(
      <StatusMonitorForm initial={MONITOR} onDone={onDone} onCancel={onCancel} />,
    );
    expect(screen.getByLabelText('Service name')).toHaveValue('Tools API');
    await userEvent.click(screen.getByRole('combobox', { name: /Category/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Desktop App' }),
    );
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument());
    await userEvent.click(screen.getByRole('switch', { name: 'Show on the status page' }));
    await press('Update');
    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'mon-1',
        input: {
          key: 'tools-api',
          name: 'Tools API',
          description: 'The public tools backend',
          category: StatusCategory.DesktopApp,
          url: 'https://tools-api.example.com/health',
          isActive: true,
          order: 4,
        },
      },
    });
    expect(gql.create).not.toHaveBeenCalled();
  });

  it('keeps the form open and reports a save the server refuses', async () => {
    gql.update.mockRejectedValue(new Error('Key already in use'));
    renderWithProviders(
      <StatusMonitorForm initial={MONITOR} onDone={onDone} onCancel={onCancel} />,
    );
    await press('Update');
    await waitFor(() => expect(gql.notify).toHaveBeenCalledWith('Key already in use', 'error'));
    expect(onDone).not.toHaveBeenCalled();
  });

  it('refuses a negative display order', async () => {
    renderWithProviders(
      <StatusMonitorForm initial={MONITOR} onDone={onDone} onCancel={onCancel} />,
    );
    fill('Order', '-1');
    await press('Update');
    expect(await screen.findByText('Order cannot be negative')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('hands control back on Cancel', async () => {
    renderWithProviders(<StatusMonitorForm initial={null} onDone={onDone} onCancel={onCancel} />);
    await press('Cancel');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
