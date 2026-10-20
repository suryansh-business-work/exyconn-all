import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UseGoogleClientButton } from '../../../../src/pages/environment-variables/UseGoogleClientButton';
import { renderWithProviders } from '../../test-utils';

const gql = vi.hoisted(() => ({ copy: vi.fn(), notify: vi.fn(), options: undefined as unknown }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUseGoogleSignInClientForGmailMutation: (options: unknown) => {
    gql.options = options;
    return [gql.copy, { loading: false }];
  },
}));

vi.mock('@exyconn/shell/components/feedback/NotificationProvider', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@exyconn/shell/components/feedback/NotificationProvider')
  >()),
  useNotify: () => gql.notify,
}));

describe('UseGoogleClientButton', () => {
  beforeEach(() => {
    gql.copy.mockReset();
    gql.notify.mockReset();
  });

  it('copies the Google sign-in client into Gmail and says so, reloading the panel', async () => {
    gql.copy.mockResolvedValue({ data: {} });
    renderWithProviders(<UseGoogleClientButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Use the Google sign-in client' }));

    expect(gql.copy).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith(
        'Gmail now uses the Google sign-in client',
        'success',
      ),
    );
    expect(gql.options).toMatchObject({ refetchQueries: [expect.anything()] });
  });

  it('says why when there is no Google sign-in client to use', async () => {
    gql.copy.mockImplementation(async () => {
      throw new Error('Save the Google sign-in client first');
    });
    renderWithProviders(<UseGoogleClientButton />);

    await userEvent.click(screen.getByRole('button', { name: 'Use the Google sign-in client' }));

    await waitFor(() =>
      expect(gql.notify).toHaveBeenCalledWith('Save the Google sign-in client first', 'error'),
    );
  });
});
