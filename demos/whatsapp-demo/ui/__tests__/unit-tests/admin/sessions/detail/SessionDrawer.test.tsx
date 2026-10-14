import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappDemoEventType } from '@exyconn/shell/graphql/generated';
import { SessionDrawer } from '../../../../../src/admin/sessions/detail';
import { renderWithProviders } from '../../../test-utils';
import { demoEvent, demoRow, sessionRow } from '../../admin.fixtures';

const api = vi.hoisted(() => ({
  session: { data: undefined as unknown, loading: false, error: undefined as unknown },
  variables: null as unknown,
  refetch: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useWhatsappDemoSessionQuery: (options: { variables: unknown }) => {
    api.variables = options.variables;
    return { ...api.session, refetch: api.refetch };
  },
  useWhatsappDemosQuery: () => ({ data: { whatsappDemos: [demoRow()] } }),
}));

function mount(sessionId: string | null) {
  const onClose = vi.fn();
  renderWithProviders(<SessionDrawer sessionId={sessionId} onClose={onClose} />);
  return onClose;
}

beforeEach(() => {
  api.session = { data: undefined, loading: false, error: undefined };
  api.variables = null;
  api.refetch.mockReset().mockResolvedValue({});
});

describe('SessionDrawer', () => {
  it('stays closed, asking for nothing, while no session is chosen', () => {
    mount(null);
    expect(screen.queryByRole('heading', { name: 'Demo session' })).not.toBeInTheDocument();
    expect(api.variables).toBeNull();
  });

  it('loads the chosen session', () => {
    api.session = { data: undefined, loading: true, error: undefined };
    mount('sess-1');
    expect(screen.getByRole('heading', { name: 'Demo session' })).toBeInTheDocument();
    expect(api.variables).toEqual({ sessionId: 'sess-1' });
    expect(screen.getByRole('progressbar', { name: 'Loading the session' })).toBeInTheDocument();
  });

  it('reports a session that failed to load, with a retry', async () => {
    const user = userEvent.setup();
    api.session = { data: undefined, loading: false, error: new Error('Gone away') };
    mount('sess-1');
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load the session. Gone away');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(api.refetch).toHaveBeenCalledTimes(1);
  });

  it('says so when the session no longer exists', () => {
    api.session = { data: { whatsappDemoSession: null }, loading: false, error: undefined };
    mount('sess-1');
    expect(screen.getByText('This session no longer exists.')).toBeInTheDocument();
  });

  it('shows the summary, then the timeline named by industry', () => {
    api.session = {
      data: {
        whatsappDemoSession: {
          session: sessionRow(),
          events: [demoEvent({ type: WhatsappDemoEventType.DemoOpened, demoKey: 'clinic' })],
        },
      },
      loading: true,
      error: undefined,
    };
    mount('sess-1');
    expect(screen.getByText('Ravi Kumar')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Timeline' })).toBeInTheDocument();
    expect(screen.getByText('Industry opened')).toBeInTheDocument();
    expect(screen.getAllByText('Healthcare').length).toBeGreaterThan(0);
  });

  it('closes from its Close button', async () => {
    const user = userEvent.setup();
    api.session = { data: { whatsappDemoSession: null }, loading: false, error: undefined };
    const onClose = mount('sess-1');
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
