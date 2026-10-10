import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AppHeader from '../../shared/components/Shell/AppHeader';
import Crumbs from '../../shared/components/Shell/Crumbs';
import ToolLayout from '../../shared/components/ToolLayout/ToolLayout';
import ToolCard from '../../shared/components/ToolCard/ToolCard';
import ToolGrid from '../../shared/components/ToolCard/ToolGrid';
import Footer from '../../shared/components/Footer/Footer';
import OwnThisTool from '../../shared/components/OwnThisTool/OwnThisTool';
import Logo from '../../shared/components/Logo/Logo';
import ScrollTopButton from '../../shared/components/ScrollToTop/ScrollTopButton';
import { ThemeProvider } from '../../shared/context/ThemeContext';
import { SecretsProvider } from '../../shared/context/SecretsContext';
import { findToolById, toolsData, getToolCounts } from '../../shared/data/toolsData';
import { writeSecret } from '../../shared/services/secrets';

const Where: React.FC = () => {
  const location = useLocation();
  return <div data-testid="where">{`${location.pathname}${location.search}`}</div>;
};

const inApp = (ui: React.ReactNode, path = '/') =>
  render(
    <ThemeProvider>
      <MemoryRouter initialEntries={[path]}>
        <SecretsProvider>
          {ui}
          <Where />
        </SecretsProvider>
      </MemoryRouter>
    </ThemeProvider>
  );

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('AppHeader', () => {
  it('links home and offers a category menu with a link per category', () => {
    inApp(<AppHeader />);
    expect(screen.getByRole('link', { name: 'Exyconn Tools home' })).toHaveAttribute('href', '/tools');
    fireEvent.click(screen.getByRole('button', { name: /Categories/ }));
    const menu = screen.getByRole('menu');
    expect(within(menu).getAllByRole('menuitem')).toHaveLength(toolsData.length);
    fireEvent.click(within(menu).getAllByRole('menuitem')[0]);
    expect(screen.getByTestId('where')).toHaveTextContent(`/categories/${toolsData[0].slug}`);
  });

  it('opens the hub filtered by the search on Enter, and ignores blank searches and other keys', () => {
    inApp(<AppHeader />, '/somewhere');
    const search = screen.getByRole('textbox', { name: 'Search tools' });
    fireEvent.change(search, { target: { value: '  merge pdf  ' } });
    fireEvent.keyDown(search, { key: 'a' });
    expect(screen.getByTestId('where')).toHaveTextContent('/somewhere');
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByTestId('where')).toHaveTextContent('/tools?q=merge%20pdf');

    fireEvent.change(search, { target: { value: '   ' } });
    fireEvent.keyDown(search, { key: 'Enter' });
    expect(screen.getByTestId('where')).toHaveTextContent('/tools?q=merge%20pdf');
  });

  it('can hide the header search', () => {
    inApp(<AppHeader showSearch={false} />);
    expect(screen.queryByRole('textbox', { name: 'Search tools' })).not.toBeInTheDocument();
  });

  it('opens the phone navigation drawer and navigates from it', () => {
    inApp(<AppHeader />, '/somewhere');
    fireEvent.click(screen.getByRole('button', { name: 'Open navigation' }));
    const drawer = screen.getByRole('navigation', { name: 'Tool categories' });
    const links = within(drawer).getAllByRole('link');
    expect(links).toHaveLength(toolsData.length + 1);
    fireEvent.click(within(drawer).getByRole('link', { name: 'All tools' }));
    expect(screen.getByTestId('where')).toHaveTextContent('/tools');
  });

  it('toggles the colour mode and says what the next mode is', () => {
    inApp(<AppHeader />);
    const toggle = screen.getByRole('button', { name: /Switch to (dark|light) mode/ });
    const before = toggle.getAttribute('aria-label');
    fireEvent.click(toggle);
    const after = screen.getByRole('button', { name: /Switch to (dark|light) mode/ }).getAttribute('aria-label');
    expect(after).not.toBe(before);
    expect(localStorage.getItem('theme')).toBe(before === 'Switch to dark mode' ? 'dark' : 'light');
  });

  it('opens the API keys drawer, and the dot hides once a key is configured', async () => {
    const { unmount } = inApp(<AppHeader />);
    expect(document.querySelector('.MuiBadge-dot:not(.MuiBadge-invisible)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'API keys and secrets' }));
    expect(await screen.findByText('API Keys & Secrets')).toBeInTheDocument();
    unmount();

    writeSecret('openai_api_key', 'sk-1');
    inApp(<AppHeader />);
    expect(document.querySelector('.MuiBadge-invisible')).toBeInTheDocument();
  });
});

describe('Crumbs', () => {
  it('links every crumb but the last, which is the current page', () => {
    inApp(
      <Crumbs items={[{ label: 'Tools', to: '/tools' }, { label: 'PDF', to: '/categories/pdf' }, { label: 'Merge' }]} />
    );
    expect(screen.getByRole('link', { name: 'Tools' })).toHaveAttribute('href', '/tools');
    expect(screen.getByRole('link', { name: 'PDF' })).toHaveAttribute('href', '/categories/pdf');
    expect(screen.getByText('Merge')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Merge' })).not.toBeInTheDocument();
  });
});

describe('ToolLayout', () => {
  it('frames a tool with breadcrumbs, its summary, the details and the offer', () => {
    const tool = findToolById('dns-lookup');
    inApp(
      <Routes>
        <Route
          path="/tools/:id"
          element={
            <ToolLayout
              toolName="DNS Lookup"
              toolIcon={<span />}
              toolColor="#123456"
              isMVP
              actions={<button>act</button>}
            >
              <p>tool body</p>
            </ToolLayout>
          }
        />
      </Routes>,
      '/tools/dns-lookup'
    );
    expect(screen.getByRole('heading', { level: 1, name: /DNS Lookup/ })).toBeInTheDocument();
    expect(screen.getByText('MVP')).toBeInTheDocument();
    expect(screen.getByText('tool body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'act' })).toBeInTheDocument();
    expect(screen.getByText(tool?.description as string)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /About /, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(/Own this/)).toBeInTheDocument();
  });

  it('still renders for a path that is not a registered tool, without details or offer', () => {
    inApp(
      <Routes>
        <Route
          path="/tools/:id"
          element={
            <ToolLayout toolName="Mystery" toolIcon={<span />} toolColor="#000000">
              <p>body</p>
            </ToolLayout>
          }
        />
      </Routes>,
      '/tools/not-registered'
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Mystery' })).toBeInTheDocument();
    expect(screen.queryByText(/Own this/)).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^About /, level: 2 })).not.toBeInTheDocument();
    expect(screen.queryByText('MVP')).not.toBeInTheDocument();
  });
});

describe('ToolCard and ToolGrid', () => {
  const tool = toolsData[0].items[0];

  it('makes the whole card one link to the tool, with the heading level asked for', () => {
    inApp(<ToolCard tool={tool} headingComponent="h4" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', tool.url);
    expect(within(link).getByRole('heading', { level: 4, name: tool.name })).toBeInTheDocument();
    expect(within(link).getByText(tool.description)).toBeInTheDocument();
  });

  it('defaults to an h3', () => {
    inApp(<ToolCard tool={tool} />);
    expect(screen.getByRole('heading', { level: 3, name: tool.name })).toBeInTheDocument();
  });

  it('lists a card per tool', () => {
    const tools = toolsData[0].items.slice(0, 3);
    inApp(<ToolGrid tools={tools} headingComponent="h2" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(3);
  });
});

describe('Footer', () => {
  it('names the tool count, links every category and the company pages', () => {
    inApp(<Footer />);
    expect(screen.getByText(new RegExp(`${getToolCounts().total} free tools`))).toBeInTheDocument();
    const categories = screen.getByRole('navigation', { name: 'Tool categories' });
    expect(within(categories).getAllByRole('link')).toHaveLength(toolsData.length);
    const company = screen.getByRole('navigation', { name: 'Exyconn' });
    within(company)
      .getAllByRole('link')
      .forEach((link) => {
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
      });
    expect(screen.getByText(`© ${new Date().getFullYear()} Exyconn. All rights reserved.`)).toBeInTheDocument();
  });
});

describe('OwnThisTool', () => {
  const priced = toolsData.flatMap((category) => category.items).find((item) => item.pricing?.alterationNote);
  const unpriced = toolsData.flatMap((category) => category.items).find((item) => !item.pricing);

  it('renders nothing for an unknown tool', () => {
    const { container } = inApp(<OwnThisTool toolId="nope" />);
    expect(container.querySelector('section, .MuiContainer-root')).toBeNull();
  });

  it('asks for contact when the tool has no price, and offers the generic feature list', () => {
    expect(unpriced).toBeDefined();
    inApp(<OwnThisTool toolId={unpriced?.id as string} />);
    expect(screen.getByText('Contact for Pricing')).toBeInTheDocument();
    expect(screen.getByText('Full source code (React + TypeScript)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact to Purchase/ })).toHaveAttribute(
      'href',
      `mailto:services@exyconn.com?subject=Inquiry about purchasing ${unpriced?.name}`
    );
  });

  it('shows the price, its features and the alteration note for a priced tool', () => {
    expect(priced?.pricing).toBeDefined();
    const pricing = priced?.pricing as NonNullable<typeof priced>['pricing'] & object;
    inApp(<OwnThisTool toolId={priced?.id as string} />);
    expect(screen.getByText(new RegExp(`\\$${pricing.price}`))).toBeInTheDocument();
    expect(screen.queryByText('Contact for Pricing')).not.toBeInTheDocument();
    pricing.features.forEach((feature) => expect(screen.getByText(feature)).toBeInTheDocument());
    expect(screen.getByText(pricing.alterationNote, { exact: false })).toBeInTheDocument();
  });
});

describe('Logo', () => {
  it('is an image named Exyconn, or by the title it is given, at the height asked for', () => {
    const { rerender } = inApp(<Logo />);
    expect(screen.getByRole('img', { name: 'Exyconn' })).toBeInTheDocument();
    rerender(
      <ThemeProvider>
        <MemoryRouter>
          <Logo title="Home" height={50} />
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getByRole('img', { name: 'Home' })).toBeInTheDocument();
  });
});

describe('ScrollTopButton', () => {
  it('scrolls back to the top once the page is scrolled far enough', () => {
    const scrollTo = vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => undefined);
    inApp(<ScrollTopButton />);
    const button = screen.getByLabelText('Back to top');
    Object.defineProperty(globalThis, 'scrollY', { value: 2000, configurable: true });
    act(() => {
      globalThis.dispatchEvent(new Event('scroll'));
    });
    fireEvent.click(screen.getByLabelText('Back to top'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(button).toBeInTheDocument();
    Object.defineProperty(globalThis, 'scrollY', { value: 0, configurable: true });
  });
});
