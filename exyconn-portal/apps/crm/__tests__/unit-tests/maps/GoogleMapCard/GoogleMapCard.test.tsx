import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { GoogleMapCard } from '../../../../src/maps/GoogleMapCard';
import type { MapTarget } from '../../../../src/maps/mapLinks';
import { renderWithProviders } from '../../test-utils';

/** The map body is a lazy chunk: its first import can be slow on a busy machine. */
const LAZY = { timeout: 5000 };

const gql = vi.hoisted(() => ({ key: 'maps-key' as string | undefined, options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useGoogleMapsClientConfigQuery: (options: unknown) => {
    gql.options(options);
    return {
      data: gql.key === undefined ? undefined : { googleMapsClientConfig: { browserKey: gql.key } },
    };
  },
}));

vi.mock('../../../../src/maps/GoogleMapCard/MapCardBody', () => ({
  default: ({ apiKey, title }: Readonly<{ apiKey: string; title: string }>) => (
    <p>
      Map body for {title} with {apiKey}
    </p>
  ),
}));

function renderCard(target: MapTarget) {
  return renderWithProviders(<GoogleMapCard target={target} title="Acme HQ" />);
}

describe('GoogleMapCard', () => {
  beforeEach(() => {
    gql.key = 'maps-key';
    gql.options.mockClear();
  });

  it('shows the map under a heading with a link that opens Google Maps in a new tab', async () => {
    renderCard({ address: '1 Main St', city: 'Pune' });

    expect(screen.getByRole('heading', { name: 'Map' })).toBeInTheDocument();
    expect(
      await screen.findByText('Map body for Acme HQ with maps-key', {}, LAZY),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open in Google Maps' });
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=1%20Main%20St%2C%20Pune',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(gql.options).toHaveBeenCalledWith({ skip: false });
  });

  it.each([
    ['stored coordinates', { lat: 1, lng: 2 }],
    ['a city alone', { city: 'Pune', address: ' ' }],
  ])('places a record with %s', async (_case, target: MapTarget) => {
    renderCard(target);

    expect(
      await screen.findByText('Map body for Acme HQ with maps-key', {}, LAZY),
    ).toBeInTheDocument();
  });

  it('renders nothing, without asking for the key, when there is nothing to place', () => {
    const { container } = renderCard({ address: '  ', city: null, country: 'IN' });

    expect(container).toBeEmptyDOMElement();
    expect(gql.options).toHaveBeenCalledWith({ skip: true });
  });

  it('renders nothing when no Maps key is configured', () => {
    gql.key = '';
    const { container } = renderCard({ lat: 1, lng: 2 });

    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing until the key has loaded', () => {
    gql.key = undefined;
    const { container } = renderCard({ lat: 1, lng: 2 });

    expect(container).toBeEmptyDOMElement();
  });
});
