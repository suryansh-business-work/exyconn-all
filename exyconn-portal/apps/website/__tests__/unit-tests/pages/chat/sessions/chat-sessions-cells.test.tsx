import type { ComponentType } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { WebsiteChatStatus } from '@exyconn/shell/graphql/generated';
import {
  AssigneeCell,
  ClosesInCell,
  LastMessageCell,
  UnreadCell,
  VisitorCell,
} from '../../../../../src/pages/chat/sessions/chat-sessions-cells';
import type { ChatSessionRow } from '../../../../../src/pages/chat/sessions/chat-sessions-grid';
import { renderWithProviders } from '../../../test-utils';
import { sessionRow } from './fixtures';

type Cell = ComponentType<Readonly<ICellRendererParams<ChatSessionRow>>>;

const formatRelative = vi.fn((iso: string) => `relative ${iso}`);

/** Renders one cell the way ag-grid would, inside a box the test can check for emptiness. */
function renderCell(CellComponent: Cell, data?: ChatSessionRow) {
  const params = {
    data,
    context: { formatRelative },
  } as unknown as ICellRendererParams<ChatSessionRow>;
  const { container } = renderWithProviders(
    <div data-testid="cell">
      <CellComponent {...params} />
    </div>,
  );
  return within(container).getByTestId('cell');
}

afterEach(() => {
  formatRelative.mockClear();
  vi.useRealTimers();
});

describe('VisitorCell', () => {
  it('shows the name with the email and phone underneath', () => {
    renderCell(VisitorCell, sessionRow());
    expect(screen.getByText('Asha Rao')).toBeInTheDocument();
    expect(screen.getByText('asha@example.test · +91 98450 00000')).toBeInTheDocument();
  });

  it('leaves out contact details the visitor did not give', () => {
    renderCell(VisitorCell, sessionRow({ email: '' }));
    expect(screen.getByText('+91 98450 00000')).toBeInTheDocument();
  });

  it('renders nothing while the row loads', () => {
    expect(renderCell(VisitorCell)).toBeEmptyDOMElement();
  });
});

describe('LastMessageCell', () => {
  it('shows the latest message and how long ago it came', () => {
    renderCell(LastMessageCell, sessionRow());
    expect(screen.getByText('Do you build chatbots?')).toBeInTheDocument();
    expect(screen.getByText('relative 2026-10-07T09:30:00.000Z')).toBeInTheDocument();
  });

  it('says so when the chat has no messages yet', () => {
    renderCell(LastMessageCell, sessionRow({ lastMessagePreview: '', lastMessageAt: null }));
    expect(screen.getByText('No messages yet')).toBeInTheDocument();
    expect(formatRelative).not.toHaveBeenCalled();
  });

  it('renders nothing while the row loads', () => {
    expect(renderCell(LastMessageCell)).toBeEmptyDOMElement();
  });
});

describe('UnreadCell', () => {
  it('badges the unread count with a spoken label', () => {
    renderCell(UnreadCell, sessionRow());
    expect(screen.getByLabelText('3 unread')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('caps the badge at 99+', () => {
    renderCell(UnreadCell, sessionRow({ staffUnread: 150 }));
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('shows nothing when everything is read or the row is loading', () => {
    expect(renderCell(UnreadCell, sessionRow({ staffUnread: 0 }))).toBeEmptyDOMElement();
    expect(renderCell(UnreadCell)).toBeEmptyDOMElement();
  });
});

describe('AssigneeCell', () => {
  it('names the assignee and marks a chat mirrored into Slack', () => {
    renderCell(AssigneeCell, sessionRow({ assigneeName: 'Mina', slackLinked: true }));
    expect(screen.getByText('Mina')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mirrored to a Slack thread' })).toBeInTheDocument();
  });

  it('says "Unassigned" and shows no Slack mark otherwise', () => {
    renderCell(AssigneeCell, sessionRow());
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Mirrored to a Slack thread' })).toBeNull();
  });

  it('renders nothing while the row loads', () => {
    expect(renderCell(AssigneeCell)).toBeEmptyDOMElement();
  });
});

describe('ClosesInCell', () => {
  it('shows when an open chat closes and refreshes it every minute', () => {
    vi.useFakeTimers();
    renderCell(ClosesInCell, sessionRow());
    expect(screen.getByText('relative 2026-10-07T10:00:00.000Z')).toBeInTheDocument();

    const before = formatRelative.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(formatRelative.mock.calls.length).toBeGreaterThan(before);
  });

  it('shows nothing for a closed chat, one with no expiry, or a loading row', () => {
    expect(
      renderCell(ClosesInCell, sessionRow({ status: WebsiteChatStatus.Closed })),
    ).toBeEmptyDOMElement();
    expect(renderCell(ClosesInCell, sessionRow({ expiresAt: null }))).toBeEmptyDOMElement();
    expect(renderCell(ClosesInCell)).toBeEmptyDOMElement();
    expect(formatRelative).not.toHaveBeenCalled();
  });
});
