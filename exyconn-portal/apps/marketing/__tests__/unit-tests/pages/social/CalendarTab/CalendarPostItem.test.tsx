import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DEFAULT_FORMAT_SETTINGS, formatTime } from '@exyconn/i18n';
import { SocialMediaPostStatus, SocialNetwork } from '@exyconn/shell/graphql/generated';
import { CalendarPostItem } from '../../../../../src/pages/social/CalendarTab/CalendarPostItem';
import { renderWithProviders } from '../../../test-utils';
import { postRow } from '../../../fixtures';

const AT = '2026-09-20T10:00:00.000Z';
const time = formatTime(AT, DEFAULT_FORMAT_SETTINGS);

describe('CalendarPostItem', () => {
  it('opens a post still to go out for editing', async () => {
    const onEdit = vi.fn();
    const post = postRow({ scheduledAt: AT });
    renderWithProviders(<CalendarPostItem post={post} onEdit={onEdit} />);

    const button = screen.getByRole('button', {
      name: `Edit post: Facebook ${time} · Scheduled`,
    });
    expect(button).toHaveAttribute('title', 'Scheduled: Our autumn launch');
    await userEvent.click(button);

    expect(onEdit).toHaveBeenCalledWith(post);
  });

  it('shows a draft or failed post in its own words, still editable', () => {
    renderWithProviders(
      <>
        <CalendarPostItem
          post={postRow({ id: 'f', status: SocialMediaPostStatus.Failed, scheduledAt: AT })}
          onEdit={vi.fn()}
        />
        <CalendarPostItem
          post={postRow({ id: 'd', status: SocialMediaPostStatus.Draft, scheduledAt: AT })}
          onEdit={vi.fn()}
        />
      </>,
    );

    expect(
      screen.getByRole('button', { name: `Edit post: Facebook ${time} · Failed` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Edit post: Facebook ${time} · Scheduled` }),
    ).toBeInTheDocument();
  });

  it('links a published post to the network, by when it went out', () => {
    const post = postRow({
      status: SocialMediaPostStatus.Published,
      network: SocialNetwork.Linkedin,
      publishedAt: AT,
      scheduledAt: null,
      permalink: 'https://linkedin.example/post/1',
    });
    renderWithProviders(<CalendarPostItem post={post} onEdit={vi.fn()} />);

    const link = screen.getByRole('link', {
      name: `Open on the network: LinkedIn ${time} · Published`,
    });
    expect(link).toHaveAttribute('href', 'https://linkedin.example/post/1');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('only shows a post being published right now', () => {
    const post = postRow({ status: SocialMediaPostStatus.Publishing, scheduledAt: AT });
    renderWithProviders(<CalendarPostItem post={post} onEdit={vi.fn()} />);

    expect(screen.getByText(`Facebook ${time} · Publishing`)).toHaveAttribute(
      'title',
      'Publishing: Our autumn launch',
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
