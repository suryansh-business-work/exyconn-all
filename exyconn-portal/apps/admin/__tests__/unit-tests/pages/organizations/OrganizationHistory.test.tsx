import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { AuditAction, type OrganizationHistoryQuery } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { OrganizationHistory } from '../../../../src/pages/organizations/OrganizationHistory';

type Entry = OrganizationHistoryQuery['organizationHistory'][number];

const hooks = vi.hoisted(() => ({
  history: vi.fn(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useOrganizationHistoryQuery: hooks.history,
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (iso: string) => `on ${iso}` }),
}));

afterEach(() => vi.resetAllMocks());

const entry = (overrides: Partial<Entry> = {}): Entry => ({
  __typename: 'AuditLog',
  id: 'log-1',
  actorName: 'Asha Rao',
  actorEmail: 'asha@example.com',
  action: AuditAction.Create,
  summary: 'Created organization Acme',
  changes: '',
  createdAt: '2026-10-01T09:30:00.000Z',
  ...overrides,
});

function mount(result: Record<string, unknown>) {
  hooks.history.mockReturnValue({ data: undefined, loading: false, error: undefined, ...result });
  renderWithProviders(<OrganizationHistory organizationId="org-1" />);
}

describe('OrganizationHistory', () => {
  it('asks for the chosen organization, refreshing what it already has', () => {
    mount({ loading: true });
    expect(hooks.history).toHaveBeenCalledWith({
      variables: { id: 'org-1' },
      fetchPolicy: 'cache-and-network',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Loading the history');
  });

  it('says why the history could not be loaded', () => {
    mount({ error: new Error('Not a platform administrator') });
    expect(screen.getByRole('alert')).toHaveTextContent('Not a platform administrator');
  });

  it('keeps showing what it has when a refresh fails or is under way', () => {
    mount({ data: { organizationHistory: [entry()] }, loading: true, error: new Error('offline') });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Created organization Acme')).toBeInTheDocument();
  });

  it('says so when nothing has been recorded yet', () => {
    mount({ data: { organizationHistory: [] } });
    expect(
      screen.getByText('Nothing has been recorded for this organization yet.'),
    ).toBeInTheDocument();
  });

  it('lists each entry with its action, summary, changes, time and who did it', () => {
    mount({
      data: {
        organizationHistory: [
          entry({
            id: 'log-2',
            action: AuditAction.Update,
            summary: 'Updated organization Acme',
            changes: JSON.stringify({
              currency: { from: 'INR', to: 'USD' },
              website: { from: null, to: 'https://acme.example' },
              city: { from: 'Oslo' },
            }),
            actorName: '',
            createdAt: '2026-10-02T10:00:00.000Z',
          }),
          entry(),
        ],
      },
    });
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('UPDATE');
    expect(screen.getByText('currency: "INR" → "USD"')).toBeInTheDocument();
    expect(screen.getByText('website: "" → "https://acme.example"')).toBeInTheDocument();
    expect(screen.getByText('city: "Oslo" → ""')).toBeInTheDocument();
    // Without a name the actor is known by email.
    expect(items[0]).toHaveTextContent('on 2026-10-02T10:00:00.000Z · asha@example.com');
    expect(items[1]).toHaveTextContent('CREATE');
    expect(items[1]).toHaveTextContent('on 2026-10-01T09:30:00.000Z · Asha Rao');
  });
});
