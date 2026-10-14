import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewWorkflowDialog } from '../../../../../src/admin/workflows/list/NewWorkflowDialog';
import type { WorkflowDetailsValues } from '../../../../../src/admin/workflows/forms/workflow-details';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';

const hooks = vi.hoisted(() => ({
  create: vi.fn(),
  notify: vi.fn(),
  options: undefined as unknown,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCreateWhatsappWorkflowMutation: (options: unknown) => {
    hooks.options = options;
    return [hooks.create];
  },
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => hooks.notify,
}));

const VALUES: WorkflowDetailsValues = vi.hoisted(() => ({
  key: 'faq',
  name: 'FAQ',
  description: 'Common questions',
  keywords: ['help'],
  order: 3,
}));

vi.mock('../../../../../src/admin/workflows/WorkflowDetailsDialog', () => ({
  WorkflowDetailsDialog: (
    props: Readonly<{
      open: boolean;
      title: string;
      isEdit: boolean;
      initial: WorkflowDetailsValues;
      onSubmit: (values: WorkflowDetailsValues) => Promise<void>;
      onClose: () => void;
    }>,
  ) =>
    props.open ? (
      <div>
        <p>{`${props.title} edit=${String(props.isEdit)} order=${props.initial.order}`}</p>
        <button type="button" onClick={() => props.onSubmit(VALUES)}>
          Submit
        </button>
        <button type="button" onClick={props.onClose}>
          Close
        </button>
      </div>
    ) : null,
}));

function UrlProbe() {
  return <p data-testid="url">{useCurrentUrl()}</p>;
}

function renderDialog(open = true) {
  const onClose = vi.fn();
  renderWithProviders(
    <>
      <NewWorkflowDialog open={open} demoId="demo-1" nextOrder={5} onClose={onClose} />
      <UrlProbe />
    </>,
    { route: '/admin/bot-workflows' },
  );
  return { onClose, user: userEvent.setup() };
}

afterEach(() => vi.resetAllMocks());

describe('NewWorkflowDialog', () => {
  it('starts an empty, new workflow at the end of the menu', () => {
    renderDialog();
    expect(screen.getByText('New workflow edit=false order=5')).toBeInTheDocument();
    expect(hooks.options).toEqual({
      refetchQueries: ['WhatsappWorkflows', 'WhatsappWorkflow', 'WhatsappDemoCatalog'],
    });
  });

  it('renders nothing while closed', () => {
    renderDialog(false);
    expect(screen.queryByRole('button', { name: 'Submit' })).not.toBeInTheDocument();
  });

  it('creates the workflow in the demo and opens it in the editor', async () => {
    hooks.create.mockResolvedValue({
      data: { createWhatsappWorkflow: { id: 'wf-7', name: 'FAQ' } },
    });
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(screen.getByTestId('url')).toHaveTextContent('/admin/bot-workflows/wf-7'),
    );
    expect(hooks.create).toHaveBeenCalledWith({
      variables: { input: { demoId: 'demo-1', ...VALUES } },
    });
    expect(hooks.notify).toHaveBeenCalledWith('Workflow "{name}" created', 'success', {
      name: 'FAQ',
    });
  });

  it('stays put when the server returns no workflow', async () => {
    hooks.create.mockResolvedValue({ data: null });
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(hooks.create).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('url')).toHaveTextContent(/^\/admin\/bot-workflows$/);
    expect(hooks.notify).not.toHaveBeenCalled();
  });

  it('says why a create failed', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    hooks.create.mockRejectedValue(new Error('Key already used'));
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() => expect(hooks.notify).toHaveBeenCalledWith('Key already used', 'error'));
    expect(consoleError).toHaveBeenCalledWith('Could not create the workflow', expect.any(Error));
    consoleError.mockRestore();
  });

  it('falls back to a generic message for a failure that is not an Error', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    hooks.create.mockRejectedValue('offline');
    const { user } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Submit' }));
    await waitFor(() =>
      expect(hooks.notify).toHaveBeenCalledWith('Could not create the workflow', 'error'),
    );
    consoleError.mockRestore();
  });

  it('closes on request', async () => {
    const { user, onClose } = renderDialog();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
