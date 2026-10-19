import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VOICE_NODE_TYPES } from '@exyconn/wa-flow';
import { CallFlowEditor } from '../../../../../src/pages/demos/call-flows/CallFlowEditor';
import { renderWithProviders } from '../../../test-utils';
import { flowRow } from '../calling-bot.fixtures';

const studio = vi.hoisted(() => ({
  save: vi.fn(),
  saving: false,
  saveOptions: null as unknown,
  confirm: vi.fn(),
  notify: vi.fn(),
  adopt: vi.fn(),
  tidy: vi.fn(),
  guard: vi.fn(),
  errors: 0,
  dirty: true,
  stored: null as unknown,
  workspace: null as Record<string, unknown> | null,
  preview: null as Record<string, unknown> | null,
}));

vi.mock('@exyconn/bot-studio/studio', () => ({
  FlowProvider: ({ children }: Readonly<{ children: ReactNode }>) => <>{children}</>,
  FlowWorkspace: (
    props: Readonly<{
      header: (tools: { errors: number; tidy: () => void }) => ReactNode;
      preview: ReactNode;
      previewOpen: boolean;
      onClosePreview: () => void;
    }>,
  ) => {
    studio.workspace = props;
    return (
      <section aria-label="workspace">
        {props.header({ errors: studio.errors, tidy: studio.tidy })}
        {props.previewOpen && props.preview}
        <button type="button" onClick={props.onClosePreview}>
          close preview panel
        </button>
      </section>
    );
  },
  PreviewPane: (props: Readonly<{ startWorkflow: string; onClose: () => void }>) => {
    studio.preview = props;
    return (
      <aside aria-label="rehearsal">
        <button type="button" onClick={props.onClose}>
          stop rehearsal
        </button>
      </aside>
    );
  },
  useGraphEditor: (stored: { graph: unknown }) => {
    studio.stored = stored;
    return { graph: stored.graph, dirty: studio.dirty, adopt: studio.adopt };
  },
  useUnloadGuard: studio.guard,
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useSaveCallingBotScenarioFlowMutation: (options: unknown) => {
    studio.saveOptions = options;
    return [studio.save, { loading: studio.saving }];
  },
}));
vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useConfirm: () => studio.confirm,
}));
vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useNotify: () => studio.notify,
}));

const press = (name: string) => userEvent.click(screen.getByRole('button', { name }));
const savedFlow = { id: 'sc-1', flow: null, callScript: 'New script', updatedAt: 'later' };

let consoleError: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  studio.save.mockReset().mockResolvedValue({ data: { saveCallingBotScenarioFlow: savedFlow } });
  studio.confirm.mockReset().mockResolvedValue(true);
  studio.notify.mockReset();
  studio.adopt.mockReset();
  studio.guard.mockReset();
  studio.saving = false;
  studio.errors = 0;
  studio.dirty = true;
  studio.preview = null;
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError.mockRestore();
});

describe('CallFlowEditor', () => {
  it('opens the example’s flow in the voice workspace and guards unsaved edits', () => {
    renderWithProviders(<CallFlowEditor row={flowRow()} aiConfigured />);
    expect(studio.stored).toMatchObject({ revision: 'sc-1:2026-10-01T10:00:00.000Z' });
    expect(studio.workspace).toMatchObject({
      workflowKeys: ['call'],
      aiConfigured: true,
      types: VOICE_NODE_TYPES,
      previewOpen: false,
    });
    expect(studio.saveOptions).toEqual({
      refetchQueries: ['CallingBotScenarioFlows'],
      awaitRefetchQueries: true,
    });
    expect(studio.guard).toHaveBeenCalledWith(true);
    expect(screen.getByText('No flow yet: a starter is shown')).toBeInTheDocument();
  });

  it('hands the workspace’s Tidy and problem count to the header', async () => {
    studio.errors = 2;
    renderWithProviders(<CallFlowEditor row={flowRow({ flow: {} })} aiConfigured={false} />);
    expect(screen.getByText('2 problems')).toBeInTheDocument();
    await press('Tidy');
    expect(studio.tidy).toHaveBeenCalledTimes(1);
  });

  it('saves the graph and adopts what the server stored', async () => {
    renderWithProviders(<CallFlowEditor row={flowRow()} aiConfigured />);
    await press('Save');
    await waitFor(() => expect(studio.notify).toHaveBeenCalledWith('Call flow saved', 'success'));
    expect(studio.save).toHaveBeenCalledWith({
      variables: { id: 'sc-1', flow: expect.objectContaining({ start: 'greet' }) },
    });
    expect(studio.adopt).toHaveBeenCalledWith({
      revision: 'sc-1:later',
      graph: expect.objectContaining({ start: 'greet' }),
    });
  });

  it('changes nothing when the save answers without the example', async () => {
    studio.save.mockResolvedValue({ data: null });
    renderWithProviders(<CallFlowEditor row={flowRow()} aiConfigured />);
    await press('Save');
    await waitFor(() => expect(studio.save).toHaveBeenCalledTimes(1));
    expect(studio.adopt).not.toHaveBeenCalled();
    expect(studio.notify).not.toHaveBeenCalled();
  });

  it('logs and reports a failed save', async () => {
    const failure = new Error('Flow has a loop');
    studio.save.mockRejectedValue(failure);
    renderWithProviders(<CallFlowEditor row={flowRow()} aiConfigured />);
    await press('Save');
    await waitFor(() => expect(studio.notify).toHaveBeenCalledWith('Flow has a loop', 'error'));
    expect(consoleError).toHaveBeenCalledWith('Could not save the call flow', failure);
    expect(studio.adopt).not.toHaveBeenCalled();
  });

  it('removes the flow after asking, naming the example', async () => {
    renderWithProviders(<CallFlowEditor row={flowRow({ flow: {} })} aiConfigured />);
    await press('Remove flow');
    await waitFor(() => expect(studio.notify).toHaveBeenCalledWith('Call flow removed', 'success'));
    expect(studio.confirm).toHaveBeenCalledWith(
      expect.objectContaining({ messageValues: { name: 'Clinic booking' }, destructive: true }),
    );
    expect(studio.save).toHaveBeenCalledWith({ variables: { id: 'sc-1', flow: null } });
  });

  it('keeps the flow when the removal is cancelled', async () => {
    studio.confirm.mockResolvedValue(false);
    renderWithProviders(<CallFlowEditor row={flowRow({ flow: {} })} aiConfigured />);
    await press('Remove flow');
    await waitFor(() => expect(studio.confirm).toHaveBeenCalledTimes(1));
    expect(studio.save).not.toHaveBeenCalled();
  });

  it('reports a failed removal like a failed save', async () => {
    studio.save.mockRejectedValue('offline');
    renderWithProviders(<CallFlowEditor row={flowRow({ flow: {} })} aiConfigured />);
    await press('Remove flow');
    await waitFor(() =>
      expect(studio.notify).toHaveBeenCalledWith('Could not save the call flow', 'error'),
    );
  });

  it('logs a confirm dialog that fails to open', async () => {
    const failure = new Error('No confirm provider');
    studio.confirm.mockRejectedValue(failure);
    renderWithProviders(<CallFlowEditor row={flowRow({ flow: {} })} aiConfigured />);
    await press('Remove flow');
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith('Could not remove the call flow', failure),
    );
    expect(studio.save).not.toHaveBeenCalled();
  });

  it('rehearses the flow as text and stops from the pane or the workspace', async () => {
    renderWithProviders(<CallFlowEditor row={flowRow()} aiConfigured />);
    expect(screen.queryByRole('complementary', { name: 'rehearsal' })).not.toBeInTheDocument();
    await press('Rehearse');
    expect(screen.getByRole('complementary', { name: 'rehearsal' })).toBeInTheDocument();
    expect(studio.preview).toMatchObject({
      startWorkflow: 'call',
      bundle: expect.objectContaining({ demo: expect.objectContaining({ key: 'call-sc-1' }) }),
    });
    await press('stop rehearsal');
    expect(screen.queryByRole('complementary', { name: 'rehearsal' })).not.toBeInTheDocument();
    await press('Rehearse');
    await press('close preview panel');
    expect(screen.queryByRole('complementary', { name: 'rehearsal' })).not.toBeInTheDocument();
  });

  it('shows the call script of a saved flow, and closes it', async () => {
    renderWithProviders(<CallFlowEditor row={flowRow({ flow: {} })} aiConfigured />);
    await press('Call script');
    expect(await screen.findByRole('dialog', { name: 'Call script' })).toHaveTextContent(
      'Say hello. Offer a slot.',
    );
    await press('Close');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
