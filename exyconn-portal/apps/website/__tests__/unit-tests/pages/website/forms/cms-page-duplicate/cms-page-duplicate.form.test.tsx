import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  DuplicatePageForm,
  type DuplicateSource,
} from '../../../../../../src/pages/website/forms/cms-page-duplicate';
import { renderWithProviders } from '../../../../test-utils';

const gql = vi.hoisted(() => ({ duplicate: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDuplicateCmsPageMutation: () => [gql.duplicate],
}));

const about: DuplicateSource = { id: 'page-1', path: '/about-us', title: 'About us' };

function setup(source: DuplicateSource | null) {
  const onClose = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<DuplicatePageForm source={source} onClose={onClose} onDone={onDone} />);
  return { user: userEvent.setup(), onClose, onDone };
}

describe('DuplicatePageForm', () => {
  beforeEach(() => {
    gql.duplicate.mockReset();
  });

  it('stays closed while no page is chosen', () => {
    setup(null);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('suggests a sibling path and copies the page there', async () => {
    gql.duplicate.mockResolvedValue({ data: { duplicateCmsPage: { id: 'page-2' } } });
    const { user, onDone } = setup(about);

    expect(screen.getByRole('dialog', { name: 'Duplicate About us' })).toBeInTheDocument();
    const path = screen.getByRole('textbox', { name: 'New path' });
    await waitFor(() => expect(path).toHaveValue('/about-us-copy'));
    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.duplicate).toHaveBeenCalledWith({
      variables: { id: 'page-1', path: '/about-us-copy' },
    });
    expect(await screen.findByText('Page copy created')).toBeInTheDocument();
  });

  it('suggests /home-copy for the home page', async () => {
    setup({ id: 'page-0', path: '/', title: 'Home' });
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'New path' })).toHaveValue('/home-copy'),
    );
  });

  it('rejects an empty or malformed path', async () => {
    const { user } = setup(about);
    const path = screen.getByRole('textbox', { name: 'New path' });
    await waitFor(() => expect(path).toHaveValue('/about-us-copy'));

    await user.clear(path);
    await user.click(screen.getByRole('button', { name: 'Duplicate' }));
    expect(await screen.findByText('Path is required')).toBeInTheDocument();

    await user.type(path, 'About Us');
    expect(
      await screen.findByText('Use a path like /about-us: lower-case letters, digits and dashes'),
    ).toBeInTheDocument();
    expect(gql.duplicate).not.toHaveBeenCalled();
  });

  it('shows why the copy failed', async () => {
    gql.duplicate.mockRejectedValue(new Error('That path is taken'));
    const { user, onDone } = setup(about);
    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'New path' })).toHaveValue('/about-us-copy'),
    );

    await user.click(screen.getByRole('button', { name: 'Duplicate' }));

    expect(await screen.findByText('That path is taken')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('closes on cancel', async () => {
    const { user, onClose } = setup(about);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});
