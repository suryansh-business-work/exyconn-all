import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  MarkAllNotificationsReadDocument,
  MarkNotificationReadDocument,
  MyNotificationsDocument,
  MyUnreadNotificationCountDocument,
} from '@/graphql/generated';
import { NotificationsPage } from '@/pages/Notifications';
import { renderWithProviders } from '../../test-utils';
import { answer } from '../../mockResult';

function notification(id: string, read: boolean, body = 'Your leave was approved') {
  return {
    __typename: 'Notification',
    id,
    kind: 'LEAVE_APPROVED',
    title: `Notice ${id}`,
    body,
    link: null,
    read,
    createdAt: '2026-10-01T09:30:00.000Z',
  };
}

const list = (...rows: ReturnType<typeof notification>[]) =>
  answer(MyNotificationsDocument, { myNotifications: rows });

const unreadCount = answer(MyUnreadNotificationCountDocument, { myUnreadNotificationCount: 0 });

describe('the notification centre', () => {
  it('says the reader is caught up when there is nothing at all', async () => {
    renderWithProviders(<NotificationsPage />, { mocks: [list().mock] });

    expect(await screen.findByText('Nothing here yet.')).toBeInTheDocument();
    expect(screen.getByText('You are all caught up')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
  });

  it('counts the unread, and marks which ones have been read', async () => {
    renderWithProviders(<NotificationsPage />, {
      mocks: [list(notification('n1', false), notification('n2', true, '')).mock],
    });

    expect(await screen.findByText('Notice n1')).toBeInTheDocument();
    expect(screen.getByText('1 unread')).toBeInTheDocument();
    expect(screen.getByText('Your leave was approved')).toBeInTheDocument();
    // A notification with no details says so rather than leaving a blank cell.
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Mark read' })).toHaveLength(1);
    expect(screen.getAllByText(/2026/)).toHaveLength(2);
  });

  it('marks one as read and reloads the list', async () => {
    const user = userEvent.setup();
    const markRead = answer(
      MarkNotificationReadDocument,
      { markNotificationRead: true },
      { id: 'n1' },
    );
    renderWithProviders(<NotificationsPage />, {
      mocks: [
        list(notification('n1', false)).mock,
        markRead.mock,
        unreadCount.mock,
        list(notification('n1', true)).mock,
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Mark read' }));

    expect(markRead.delivered()).toBe(true);
    expect(await screen.findByText('You are all caught up')).toBeInTheDocument();
    expect(screen.getByText('Read')).toBeInTheDocument();
  });

  it('marks everything read, says how many, and reloads', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />, {
      mocks: [
        list(notification('n1', false), notification('n2', false)).mock,
        answer(MarkAllNotificationsReadDocument, { markAllNotificationsRead: 2 }).mock,
        unreadCount.mock,
        list(notification('n1', true), notification('n2', true)).mock,
      ],
    });
    expect(await screen.findByText('2 unread')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark all read' }));

    expect(await screen.findByText('Marked 2 as read.')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('You are all caught up')).toBeInTheDocument());
  });

  it('reports none marked when the server gives back no count', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NotificationsPage />, {
      mocks: [
        list(notification('n1', false)).mock,
        answer(MarkAllNotificationsReadDocument, { markAllNotificationsRead: null }).mock,
        unreadCount.mock,
        list(notification('n1', false)).mock,
      ],
    });

    await user.click(await screen.findByRole('button', { name: 'Mark all read' }));

    expect(await screen.findByText('Marked 0 as read.')).toBeInTheDocument();
  });
});
