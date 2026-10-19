import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import type { CompanyGoogleBusinessQuery } from '@exyconn/shell/graphql/generated';
import { GoogleBusinessTab } from '../../../../../../src/pages/companies/detail/google-business/GoogleBusinessTab';
import { renderWithProviders } from '../../../../test-utils';
import { fieldValue } from '../../../record-detail-stubs';

type Profile = NonNullable<CompanyGoogleBusinessQuery['companyGoogleBusiness']>;
type Review = Profile['reviews'][number];

const gql = vi.hoisted(() => ({ profile: vi.fn(), refetch: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCompanyGoogleBusinessQuery: (options: unknown) => gql.profile(options),
}));

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    placeId: 'place-1',
    name: 'Acme Cafe',
    address: '',
    phone: '',
    website: '',
    mapUrl: '',
    rating: null,
    ratingCount: null,
    businessStatus: '',
    priceLevel: '',
    summary: '',
    category: '',
    types: [],
    openingHours: [],
    reviews: [],
    ...overrides,
  };
}

function review(overrides: Partial<Review> = {}): Review {
  return {
    id: 'review-1',
    authorName: 'Neha Gupta',
    authorUrl: '',
    authorPhotoUrl: '',
    rating: null,
    text: '',
    relativeTime: 'a week ago',
    publishedAt: null,
    ...overrides,
  };
}

function answer(value: Profile | null) {
  gql.profile.mockReturnValue({
    data: { companyGoogleBusiness: value },
    loading: false,
    refetch: gql.refetch,
  });
}

function renderTab() {
  const { container } = renderWithProviders(<GoogleBusinessTab companyId="company-1" />);
  return (label: string) => fieldValue(container, label);
}

describe('GoogleBusinessTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.refetch.mockResolvedValue({});
    answer(profile());
  });

  it('reads the listing of the company it sits on', () => {
    renderTab();

    expect(gql.profile).toHaveBeenCalledWith({ variables: { companyId: 'company-1' } });
  });

  it('shows a skeleton while Google answers', () => {
    gql.profile.mockReturnValue({ data: undefined, loading: true, refetch: gql.refetch });
    renderTab();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('says why the profile could not load and retries on request', async () => {
    gql.profile.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Places quota exceeded'),
      refetch: gql.refetch,
    });
    renderTab();

    expect(screen.getByRole('alert')).toHaveTextContent('Places quota exceeded');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(gql.refetch).toHaveBeenCalledTimes(1);
  });

  it('logs a retry that fails', async () => {
    const warn = vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
    const failure = new Error('offline');
    gql.refetch.mockRejectedValue(failure);
    gql.profile.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('boom'),
      refetch: gql.refetch,
    });
    renderTab();

    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        'crm: reloading the Google Business profile failed',
        failure,
      ),
    );
  });

  it('explains that a company not filed from Places has no profile', () => {
    answer(null);
    renderTab();

    expect(screen.getByText(/was not added from Google Places/)).toBeInTheDocument();
  });

  it('shows "Not listed" for each fact Google does not have, with no rating or status', () => {
    const value = renderTab();

    expect(screen.getByRole('heading', { level: 2, name: 'Acme Cafe' })).toBeInTheDocument();
    for (const label of ['Category', 'Price level', 'Phone', 'Website', 'Address']) {
      expect(value(label)).toBe('Not listed');
    }
    expect(value('Opening hours')).toBe('Not listed');
    expect(value('Google Maps')).toBeNull();
    expect(screen.queryByText(/reviews\)/)).not.toBeInTheDocument();
    expect(screen.getByText('No reviews on Google yet.')).toBeInTheDocument();
    expect(
      screen.getByText('Read live from Google each time; not stored in the CRM.'),
    ).toBeInTheDocument();
  });

  it('reads the full listing, turning Places enums into words', () => {
    answer(
      profile({
        rating: 4.25,
        ratingCount: 87,
        businessStatus: 'CLOSED_TEMPORARILY',
        priceLevel: 'PRICE_LEVEL_MODERATE',
        summary: 'Cosy corner cafe',
        category: 'Cafe',
        phone: '+91 20 5555 0000',
        website: 'https://acme.cafe',
        address: '2 Lake Rd',
        openingHours: ['Monday: 9 AM – 5 PM', 'Tuesday: Closed'],
        mapUrl: 'https://maps.google.com/?cid=1',
      }),
    );
    const value = renderTab();

    expect(screen.getByText('4.3')).toBeInTheDocument();
    expect(screen.getByText('(87 reviews)')).toBeInTheDocument();
    expect(screen.getByText('Closed temporarily')).toBeInTheDocument();
    expect(screen.getByText('Cosy corner cafe')).toBeInTheDocument();
    expect(value('Category')).toBe('Cafe');
    expect(value('Price level')).toBe('Moderate');
    expect(value('Phone')).toBe('+91 20 5555 0000');
    expect(screen.getByRole('link', { name: 'https://acme.cafe' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(value('Address')).toBe('2 Lake Rd');
    expect(screen.getByText('Tuesday: Closed').tagName).toBe('LI');
    expect(screen.getByRole('link', { name: 'Open on Google Maps' })).toHaveAttribute(
      'href',
      'https://maps.google.com/?cid=1',
    );
  });

  it('counts zero reviews when Google rates the place without a count', () => {
    answer(profile({ rating: 5, ratingCount: null }));
    renderTab();

    expect(screen.getByText('5.0')).toBeInTheDocument();
    expect(screen.getByText('(0 reviews)')).toBeInTheDocument();
  });

  it('lists the reviews, linking authors who have a profile', () => {
    answer(
      profile({
        reviews: [
          review({
            id: 'r1',
            authorName: 'Neha Gupta',
            authorUrl: 'https://maps.google.com/contrib/1',
            authorPhotoUrl: 'https://img/neha.png',
            rating: 4,
            text: 'Great coffee',
          }),
          review({ id: 'r2', authorName: 'Arjun Mehta', relativeTime: '2 months ago' }),
        ],
      }),
    );
    renderTab();

    expect(screen.getByRole('heading', { level: 3, name: 'Reviews' })).toBeInTheDocument();
    expect(screen.queryByText('No reviews on Google yet.')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Neha Gupta' })).toHaveAttribute(
      'href',
      'https://maps.google.com/contrib/1',
    );
    expect(screen.getByText('Great coffee')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();

    const arjun = screen.getByText('Arjun Mehta');
    expect(arjun.closest('a')).toBeNull();
    expect(screen.getByText('No written review.')).toBeInTheDocument();
    expect(screen.getByText('AM')).toBeInTheDocument();
    expect(screen.getByText('2 months ago')).toBeInTheDocument();
  });
});
