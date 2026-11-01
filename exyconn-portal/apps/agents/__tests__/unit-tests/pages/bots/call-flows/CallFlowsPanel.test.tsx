import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CallFlowsPanel } from '../../../../../src/pages/bots/call-flows/CallFlowsPanel';
import type { CallFlowRow } from '../../../../../src/pages/bots/call-flows/callFlow.model';
import { renderWithProviders, useCurrentUrl } from '../../../test-utils';
import { flowRow } from '../calling-bot.fixtures';

interface StudioConfigStub {
  channel: string;
  name: string;
  workflowsPath: string;
  renderPreview: (bundle: unknown, startWorkflow: string) => ReactNode;
  forbidden: ReactNode;
}

const api = vi.hoisted(() => ({
  flows: { data: undefined as unknown, loading: false, error: undefined as unknown },
  available: undefined as boolean | undefined,
  flowOptions: null as unknown,
  availabilityOptions: null as unknown,
  config: null as StudioConfigStub | null,
  editor: null as { row: CallFlowRow; aiConfigured: boolean } | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCallingBotScenarioFlowsQuery: (options: unknown) => {
    api.flowOptions = options;
    return api.flows;
  },
  useCallingBotAvailabilityQuery: (options: unknown) => {
    api.availabilityOptions = options;
    const data =
      api.available === undefined
        ? undefined
        : { callingBotAvailability: { available: api.available } };
    return { data };
  },
}));
vi.mock('@exyconn/bot-studio/studio', () => ({
  StudioProvider: ({
    config,
    children,
  }: Readonly<{ config: StudioConfigStub; children: ReactNode }>) => {
    api.config = config;
    return <>{children}</>;
  },
}));
vi.mock('@exyconn/bot-studio/widget', () => ({
  WidgetPreview: ({ startWorkflow }: Readonly<{ startWorkflow: string }>) => (
    <p>{`Widget playing ${startWorkflow}`}</p>
  ),
}));
vi.mock('../../../../../src/pages/bots/call-flows/CallFlowEditor', () => ({
  CallFlowEditor: (props: Readonly<{ row: CallFlowRow; aiConfigured: boolean }>) => {
    api.editor = props;
    return <p>{`Editing ${props.row.title}`}</p>;
  },
}));

const ROWS = [
  flowRow(),
  flowRow({ id: 'sc-2', title: 'Loan reminder', description: 'An EMI is due.', flow: {} }),
];

function Url() {
  return <output aria-label="url">{useCurrentUrl()}</output>;
}

const renderAt = (route = '/agents/calling-bot/call-flows') =>
  renderWithProviders(
    <>
      <CallFlowsPanel />
      <Url />
    </>,
    { route },
  );

beforeEach(() => {
  api.flows = { data: { callingBotScenarios: ROWS }, loading: false, error: undefined };
  api.available = true;
  api.config = null;
  api.editor = null;
});

describe('CallFlowsPanel', () => {
  it('reports a failed load', () => {
    api.flows = { data: undefined, loading: false, error: new Error('Server down') };
    renderAt();
    expect(screen.getByRole('alert')).toHaveTextContent('Server down');
  });

  it('holds placeholders while the examples load, always asking the network', () => {
    api.flows = { data: undefined, loading: true, error: undefined };
    const { container } = renderAt();
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(api.flowOptions).toEqual({ fetchPolicy: 'cache-and-network' });
    expect(api.availabilityOptions).toEqual({ fetchPolicy: 'cache-and-network' });
  });

  it('asks for an example first when there is none', () => {
    api.flows = { data: { callingBotScenarios: [] }, loading: false, error: undefined };
    renderAt();
    expect(screen.getByText('No examples yet')).toBeInTheDocument();
    expect(api.editor).toBeNull();
  });

  it('keeps showing the loaded examples when a refresh fails', () => {
    api.flows = { data: { callingBotScenarios: ROWS }, loading: true, error: new Error('Blip') };
    renderAt();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('Editing Clinic booking')).toBeInTheDocument();
  });

  it('lists every example, marks which have a flow, and edits the first with live AI', () => {
    renderAt();
    const list = within(screen.getByRole('list', { name: 'Examples' }));
    const [first, second] = list.getAllByRole('button');
    expect(first).toHaveTextContent(
      'Clinic bookingBook a dental check-up for next week.Prompt only',
    );
    expect(first).toHaveClass('Mui-selected');
    expect(second).toHaveTextContent('Loan reminderAn EMI is due.Flow');
    expect(api.editor).toMatchObject({ row: ROWS[0], aiConfigured: true });
    expect(screen.queryByText(/Showcase mode/)).not.toBeInTheDocument();
  });

  it('opens the example named in the address, and switches examples there', async () => {
    renderAt('/agents/calling-bot/call-flows?example=sc-2');
    expect(screen.getByText('Editing Loan reminder')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Clinic booking/ }));
    expect(screen.getByText('Editing Clinic booking')).toBeInTheDocument();
    expect(screen.getByLabelText('url')).toHaveTextContent(
      '/agents/calling-bot/call-flows?example=sc-1',
    );
  });

  it('falls back to the first example for an unknown one in the address', () => {
    renderAt('/agents/calling-bot/call-flows?example=gone');
    expect(screen.getByText('Editing Clinic booking')).toBeInTheDocument();
  });

  it('runs in showcase mode until the calling bot is available', () => {
    api.available = undefined;
    renderAt();
    expect(screen.getByText(/Showcase mode: design flows and rehearse them/)).toBeInTheDocument();
    expect(api.editor?.aiConfigured).toBe(false);
  });

  it('runs the studio for the website channel, previewing in the widget', () => {
    renderAt();
    expect(api.config).toMatchObject({
      channel: 'website',
      name: 'Calling bot',
      workflowsPath: '/agents/calling-bot/call-flows',
    });
    render(<>{api.config?.renderPreview({}, 'call')}</>);
    expect(screen.getByText('Widget playing call')).toBeInTheDocument();
    renderWithProviders(<>{api.config?.forbidden}</>);
    expect(screen.getByText('No access to the AI agents')).toBeInTheDocument();
  });
});
