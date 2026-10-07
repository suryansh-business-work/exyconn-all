import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  MyPendingApprovalCountDocument,
  MyUnreadNotificationCountDocument,
} from '@/graphql/generated';
import { ApprovalsBell } from '@/layout/PortalLayout/ApprovalsBell';
import { NotificationBell } from '@/layout/PortalLayout/NotificationBell';
import { renderWithProviders } from '../../test-utils';
import { answer, failure } from '../../mockResult';

const pending = (count: number) =>
  answer(MyPendingApprovalCountDocument, { myPendingApprovalCount: count });

const unread = (count: number) =>
  answer(MyUnreadNotificationCountDocument, { myUnreadNotificationCount: count });

/** The bell plus the pages it can open, so a click is seen to land somewhere. */
function withPages(bell: React.ReactElement) {
  return (
    <Routes>
      <Route path="/" element={bell} />
      <Route path="/approvals" element={<h1>Approvals page</h1>} />
      <Route path="/notifications" element={<h1>Notifications page</h1>} />
    </Routes>
  );
}

describe('the approvals bell', () => {
  it('stays hidden for somebody with nothing to approve', async () => {
    const none = pending(0);
    const { container } = renderWithProviders(withPages(<ApprovalsBell />), {
      mocks: [none.mock],
    });

    await waitFor(() => expect(none.delivered()).toBe(true));
    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it('stays hidden when the count cannot be read', async () => {
    const { container } = renderWithProviders(withPages(<ApprovalsBell />), {
      mocks: [failure(MyPendingApprovalCountDocument)],
    });

    await act(async () => {});
    expect(container).toBeEmptyDOMElement();
  });

  it('shows how many decisions are waiting, and opens the queue', async () => {
    const user = userEvent.setup();
    renderWithProviders(withPages(<ApprovalsBell />), { mocks: [pending(3).mock] });

    const bell = await screen.findByRole('button', { name: '3 approvals waiting on you' });
    expect(bell).toHaveTextContent('3');

    await user.click(bell);

    expect(screen.getByRole('heading', { name: 'Approvals page' })).toBeInTheDocument();
  });
});

describe('the notification bell', () => {
  it('reads plainly as notifications while nothing is unread', () => {
    renderWithProviders(withPages(<NotificationBell />), { mocks: [unread(0).mock] });

    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('counts the unread ones in its name, and opens the notification centre', async () => {
    const user = userEvent.setup();
    renderWithProviders(withPages(<NotificationBell />), { mocks: [unread(120).mock] });

    const bell = await screen.findByRole('button', { name: '120 unread notifications' });
    // The badge caps what it draws; the name still says the real number.
    expect(bell).toHaveTextContent('99+');

    await user.click(bell);

    expect(screen.getByRole('heading', { name: 'Notifications page' })).toBeInTheDocument();
  });
});
