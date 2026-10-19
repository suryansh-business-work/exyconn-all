import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import { brandingResult } from '../branding';

const gql = vi.hoisted(() => ({ query: vi.fn(), update: vi.fn(), branding: vi.fn() }));
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => gql.branding(),
  useEmailPreferencesQuery: (options: unknown) => gql.query(options),
  useUpdateEmailPreferencesMutation: () => [gql.update],
}));

const { EmailPreferencesPage } = await import('../../../src/Unsubscribe/EmailPreferencesPage');

const prefs = (patch: Record<string, unknown> = {}) => ({
  email: 'asha@example.com',
  preview: false,
  unsubscribedAll: false,
  categories: [
    { id: 'news', name: 'Newsletter', description: 'Monthly news', subscribed: true },
    { id: 'offers', name: 'Offers', description: '', subscribed: true },
  ],
  ...patch,
});

const loaded = (patch: Record<string, unknown> = {}) => ({
  data: { emailPreferences: prefs(patch) },
  loading: false,
  error: undefined,
});

const open = (route = '/email-preferences?t=tok-1') =>
  renderWithProviders(<EmailPreferencesPage />, { route });

describe('EmailPreferencesPage', () => {
  beforeEach(() => {
    gql.query.mockReset();
    gql.update.mockReset();
    gql.branding.mockReturnValue(brandingResult());
  });

  it('explains a link with no code and skips the query', () => {
    gql.query.mockReturnValue({ data: undefined, loading: false, error: undefined });
    open('/email-preferences');
    expect(screen.getByRole('heading', { name: 'Manage email preferences' })).toBeInTheDocument();
    expect(screen.getByText(/missing its code/)).toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({ variables: { token: '' }, skip: true });
  });

  it('shows a placeholder while loading', () => {
    gql.query.mockReturnValue({ data: undefined, loading: true, error: undefined });
    open();
    expect(screen.getByLabelText('Loading your preferences…')).toBeInTheDocument();
    expect(gql.query).toHaveBeenCalledWith({ variables: { token: 'tok-1' }, skip: false });
  });

  it('shows the server error for a refused code', () => {
    gql.query.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('This link has expired'),
    });
    open();
    expect(screen.getByText('This link has expired')).toBeInTheDocument();
  });

  it('changes nothing for a preview link', () => {
    gql.query.mockReturnValue(loaded({ preview: true }));
    open();
    expect(screen.getByText(/Nothing can be changed here/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save preferences' })).toBeNull();
  });

  it('does not offer re-subscribing an address that left everything', () => {
    gql.query.mockReturnValue(loaded({ unsubscribedAll: true }));
    open();
    expect(screen.getByText(/unsubscribed from all marketing emails/)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).toBeNull();
  });

  it('lists each category with its description and saves the switched-off ones', async () => {
    gql.query.mockReturnValue(loaded());
    gql.update.mockResolvedValue({
      data: {
        updateEmailPreferences: prefs({
          categories: [
            { id: 'news', name: 'Newsletter', description: 'Monthly news', subscribed: true },
            { id: 'offers', name: 'Offers', description: '', subscribed: false },
          ],
        }),
      },
    });
    open();
    expect(screen.getByText('Email preferences for asha@example.com')).toBeInTheDocument();
    expect(screen.getByText('Monthly news')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Offers' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Your preferences are saved.');
    expect(gql.update).toHaveBeenCalledWith({
      variables: { token: 'tok-1', optedOutCategoryIds: ['offers'], unsubscribeAll: false },
    });
    expect(screen.getByRole('switch', { name: 'Offers' })).not.toBeChecked();
  });

  it('warns before unsubscribing from everything, then shows the unsubscribed state', async () => {
    gql.query.mockReturnValue(loaded({ categories: [] }));
    gql.update.mockResolvedValue({
      data: { updateEmailPreferences: prefs({ categories: [], unsubscribedAll: true }) },
    });
    open();
    expect(screen.getByText(/no separate email categories/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Unsubscribe from all marketing emails' }));
    expect(screen.getByText(/stop receiving every marketing email/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'You have been unsubscribed from all marketing emails.',
    );
    expect(screen.queryByRole('button', { name: 'Save preferences' })).toBeNull();
  });

  it('shows why a save failed and keeps the form', async () => {
    gql.query.mockReturnValue(loaded());
    gql.update.mockRejectedValue(new Error('Link expired'));
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Link expired');
    expect(screen.getByRole('button', { name: 'Save preferences' })).toBeInTheDocument();
  });

  it('says nothing when the server returns no preferences', async () => {
    gql.query.mockReturnValue(loaded());
    gql.update.mockResolvedValue({ data: { updateEmailPreferences: null } });
    open();
    fireEvent.click(screen.getByRole('button', { name: 'Save preferences' }));
    await waitFor(() => expect(gql.update).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('cancel puts the switches back', () => {
    gql.query.mockReturnValue(loaded());
    open();
    const offers = screen.getByRole('switch', { name: 'Offers' });
    fireEvent.click(offers);
    expect(offers).not.toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('switch', { name: 'Offers' })).toBeChecked();
  });
});
