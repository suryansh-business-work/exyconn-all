import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { env } from '@exyconn/shell/config/env';
import { renderWithProviders } from '../test-utils';
import { BUNDLE, REGISTRY_NAME, brandingResult } from '../branding';
import type { LoginPageView } from '../../../src/Login/useLoginPage';

const usePublicBrandingQuery = vi.hoisted(() => vi.fn());
vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  usePublicBrandingQuery: () => usePublicBrandingQuery(),
}));

const { LoginShell } = await import('../../../src/Login/LoginShell');

const renderShell = (body: (page: LoginPageView) => string = (page) => `body for ${page.name}`) =>
  renderWithProviders(<LoginShell>{(page) => <p>{body(page)}</p>}</LoginShell>);

describe('LoginShell', () => {
  let favicon: HTMLLinkElement;

  beforeEach(() => {
    usePublicBrandingQuery.mockReset();
    favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = '/default-icon.svg';
    document.head.appendChild(favicon);
  });

  afterEach(() => {
    favicon.remove();
    localStorage.clear();
  });

  it('renders the card body with the branding for this portal', () => {
    usePublicBrandingQuery.mockReturnValue(
      brandingResult({
        businessName: 'Acme Ltd',
        logoUrl: '/acme.svg',
        faviconUrl: '/acme-fav.png',
        slogan: 'Built to last',
        loginPages: [{ app: BUNDLE, name: 'Finance', tagline: 'Money, minded' }],
      }),
    );
    renderShell();
    expect(screen.getByText('body for Finance')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Acme Ltd' })).toHaveAttribute('src', '/acme.svg');
    expect(screen.getByText('Money, minded')).toBeInTheDocument();
    expect(screen.getByText('Built to last')).toBeInTheDocument();
    expect(favicon.getAttribute('href')).toBe('/acme-fav.png');
    expect(screen.getByRole('link', { name: 'Support' })).toHaveAttribute('href', env.brandUrl);
    expect(screen.getByRole('button', { name: 'Other Portals' })).toBeInTheDocument();
  });

  it('falls back to the registry name, bundled logo alt and no tagline strip', () => {
    usePublicBrandingQuery.mockReturnValue(brandingResult());
    renderShell();
    expect(screen.getByText(`body for ${REGISTRY_NAME}`)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: env.logoAlt })).toHaveAttribute('src', env.logoUrl);
    expect(screen.queryByText('Money, minded')).toBeNull();
    // No branding favicon, so the bundled icon is used.
    expect(favicon.getAttribute('href')).toBe(env.iconUrl);
  });

  it('toggles between light and dark mode, swapping the wordmark', async () => {
    const user = userEvent.setup();
    usePublicBrandingQuery.mockReturnValue(
      brandingResult({ logoUrl: '/light.svg', logoDarkUrl: '/dark.svg', loginPages: [] }),
    );
    renderShell();
    const toggle = screen.getByRole('button', { name: 'toggle color mode' });
    expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: env.logoAlt })).toHaveAttribute('src', '/light.svg');

    await user.click(toggle);
    expect(screen.getByTestId('LightModeIcon')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: env.logoAlt })).toHaveAttribute('src', '/dark.svg');

    await user.click(toggle);
    expect(screen.getByTestId('DarkModeIcon')).toBeInTheDocument();
  });
});
