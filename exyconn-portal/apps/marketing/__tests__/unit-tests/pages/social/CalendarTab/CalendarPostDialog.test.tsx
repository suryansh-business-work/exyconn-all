import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialNetwork } from '@exyconn/shell/graphql/generated';
import { CalendarPostDialog } from '../../../../../src/pages/social/CalendarTab/CalendarPostDialog';
import { renderWithProviders } from '../../../test-utils';
import { accountRow, postRow, ruleRow } from '../../../fixtures';

vi.mock('../../../../../src/pages/social/forms/social-post', async () => ({
  SocialPostForm: (await import('../composer-stub')).ComposerStub,
}));

const ACCOUNTS = [accountRow()];
const RULES = [ruleRow(SocialNetwork.Facebook)];

function renderDialog(target: Parameters<typeof CalendarPostDialog>[0]['target']) {
  const onClose = vi.fn();
  const onSaved = vi.fn();
  renderWithProviders(
    <CalendarPostDialog
      target={target}
      accounts={ACCOUNTS}
      rules={RULES}
      onClose={onClose}
      onSaved={onSaved}
    />,
  );
  return { onClose, onSaved };
}

describe('CalendarPostDialog', () => {
  it('stays closed with nothing to show', () => {
    renderDialog(null);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('plans a new post on the day it was opened from', () => {
    renderDialog({
      post: null,
      schedule: { accountIds: ['fb-1'], scheduledAt: '2026-09-20T04:30:00.000Z' },
    });

    expect(screen.getByRole('heading', { name: 'Schedule a post' })).toBeInTheDocument();
    expect(screen.getByText('1 accounts, 1 rules, new')).toBeInTheDocument();
    expect(screen.getByText('Planned for fb-1 at 2026-09-20T04:30:00.000Z')).toBeInTheDocument();
  });

  it('edits the post it was opened from, handing back cancel and save', async () => {
    const { onClose, onSaved } = renderDialog({ post: postRow({ id: 'post-7' }) });

    expect(screen.getByRole('heading', { name: 'Edit post' })).toBeInTheDocument();
    expect(screen.getByText('1 accounts, 1 rules, edit post-7')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel form' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish form' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
