import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { HelpdeskTicketPage } from '../../../../src/pages/helpdesk';

interface TicketPageProps {
  backPath: string;
  topics?: string[];
}

const state = vi.hoisted(() => ({ props: null as TicketPageProps | null, settings: vi.fn() }));

/** The real ticket page reads the route and the ticket; the stand-in records its props. */
vi.mock('@exyconn/shell/pages/ticket-desk', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/pages/ticket-desk')>()),
  TicketDetailPage: (props: Readonly<TicketPageProps>) => {
    state.props = props;
    return null;
  },
}));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useItSettingsQuery: state.settings,
}));

describe('HelpdeskTicketPage', () => {
  beforeEach(() => {
    state.props = null;
    state.settings.mockReset();
  });

  it('shows one IT ticket with IT topics, going back to the helpdesk', () => {
    state.settings.mockReturnValue({ data: { itSettings: { ticketTopics: ['Laptop'] } } });
    render(<HelpdeskTicketPage />);
    expect(state.props).toEqual({ backPath: '/it/helpdesk', topics: ['Laptop'] });
  });

  it('leaves the topics to the shell until the settings load', () => {
    state.settings.mockReturnValue({ data: undefined });
    render(<HelpdeskTicketPage />);
    expect(state.props).toEqual({ backPath: '/it/helpdesk', topics: undefined });
  });
});
