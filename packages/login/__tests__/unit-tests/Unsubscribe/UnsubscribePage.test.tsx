import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { brandingResult } from '../branding';

const gql = vi.hoisted(() => ({ unsubscribe: vi.fn(), branding: vi.fn() }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => gql.branding(),
  useUnsubscribeFromMarketingMutation: () => [gql.unsubscribe],
}));

const { UnsubscribePage, UNSUBSCRIBE_CONFIRMATION } =
  await import('../../../src/Unsubscribe/UnsubscribePage');

describe('UnsubscribePage', () => {
  beforeEach(() => {
    gql.unsubscribe.mockReset();
    gql.branding.mockReturnValue(brandingResult());
  });

  it('explains a link with no code and never calls the server', () => {
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe' });
    expect(screen.getByRole('heading', { name: 'Unsubscribe' })).toBeInTheDocument();
    expect(screen.getByText(/missing its unsubscribe code/)).toBeInTheDocument();
    expect(gql.unsubscribe).not.toHaveBeenCalled();
  });

  it('unsubscribes on arrival, showing progress then the confirmation', async () => {
    let settle: (value: unknown) => void = () => undefined;
    gql.unsubscribe.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=tok-1' });
    expect(screen.getByText('Updating your preferences…')).toBeInTheDocument();
    expect(gql.unsubscribe).toHaveBeenCalledWith({ variables: { token: 'tok-1' } });
    settle({ data: { unsubscribeFromMarketing: true } });
    expect(await screen.findByText(UNSUBSCRIBE_CONFIRMATION)).toBeInTheDocument();
    expect(screen.queryByText('Updating your preferences…')).toBeNull();
  });

  it('sends the request only once under StrictMode double effects', async () => {
    gql.unsubscribe.mockResolvedValue({ data: { unsubscribeFromMarketing: true } });
    renderWithProviders(<UnsubscribePage />, {
      route: '/unsubscribe?t=tok-2',
      reactStrictMode: true,
    });
    expect(await screen.findByText(UNSUBSCRIBE_CONFIRMATION)).toBeInTheDocument();
    expect(gql.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('shows the server reason when the code is refused', async () => {
    gql.unsubscribe.mockImplementation(async () => {
      throw new Error('That unsubscribe link is not valid');
    });
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=bad' });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That unsubscribe link is not valid',
    );
  });

  it('shows a generic reason for a non-Error failure', async () => {
    gql.unsubscribe.mockImplementation(() => Promise.reject('offline'));
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=bad' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not unsubscribe you');
  });
});
