import { fireEvent, screen } from '@testing-library/react';
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

const CONFIRM = 'Unsubscribe from all marketing';

describe('UnsubscribePage', () => {
  beforeEach(() => {
    gql.unsubscribe.mockReset();
    gql.branding.mockReturnValue(brandingResult());
  });

  it('explains a link with no code, offers no button and never calls the server', () => {
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe' });
    expect(screen.getByRole('heading', { name: 'Unsubscribe' })).toBeInTheDocument();
    expect(screen.getByText(/missing its unsubscribe code/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: CONFIRM })).toBeNull();
    expect(gql.unsubscribe).not.toHaveBeenCalled();
  });

  it('does nothing on arrival: a mail scanner opening the link unsubscribes nobody', () => {
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=tok-1' });
    expect(screen.getByRole('button', { name: CONFIRM })).toBeEnabled();
    expect(gql.unsubscribe).not.toHaveBeenCalled();
  });

  it('links to the preference centre with the same code, URL-encoded', () => {
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=a%2Bb%20c' });
    expect(
      screen.getByRole('link', { name: 'Choose which emails you get instead' }),
    ).toHaveAttribute('href', '/email-preferences?t=a%2Bb%20c');
  });

  it('unsubscribes on click, showing progress then the confirmation', async () => {
    let settle: (value: unknown) => void = () => undefined;
    gql.unsubscribe.mockReturnValue(
      new Promise((resolve) => {
        settle = resolve;
      }),
    );
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=tok-1' });
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    expect(screen.getByRole('button', { name: 'Unsubscribing…' })).toBeDisabled();
    expect(gql.unsubscribe).toHaveBeenCalledWith({ variables: { token: 'tok-1' } });
    settle({ data: { unsubscribeFromMarketing: true } });
    expect(await screen.findByRole('status')).toHaveTextContent(UNSUBSCRIBE_CONFIRMATION);
    expect(screen.queryByRole('button', { name: CONFIRM })).toBeNull();
    expect(gql.unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('marks a preview link and keeps the button disabled', () => {
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=preview' });
    expect(screen.getByText(/preview or test email link/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: CONFIRM })).toBeDisabled();
    expect(gql.unsubscribe).not.toHaveBeenCalled();
  });

  it('shows the server reason when the code is refused and lets the person retry', async () => {
    gql.unsubscribe.mockRejectedValue(new Error('That unsubscribe link is not valid'));
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=bad' });
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'That unsubscribe link is not valid',
    );
    expect(screen.getByRole('button', { name: CONFIRM })).toBeEnabled();
  });

  it('shows a generic reason for a non-Error failure', async () => {
    gql.unsubscribe.mockRejectedValue('offline');
    renderWithProviders(<UnsubscribePage />, { route: '/unsubscribe?t=bad' });
    fireEvent.click(screen.getByRole('button', { name: CONFIRM }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not unsubscribe you');
  });
});
