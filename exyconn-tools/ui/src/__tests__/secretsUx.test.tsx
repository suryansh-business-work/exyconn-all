import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { SecretsProvider, useSecrets } from '../shared/context/SecretsContext';
import MissingKeyAlert from '../shared/components/MissingKeyAlert/MissingKeyAlert';
import Logo from '../shared/components/Logo/Logo';
import ScrollTopButton from '../shared/components/ScrollToTop/ScrollTopButton';

const wrap = (ui: React.ReactNode) => (
  <MemoryRouter>
    <ThemeProvider>
      <SecretsProvider>{ui}</SecretsProvider>
    </ThemeProvider>
  </MemoryRouter>
);

describe('MissingKeyAlert', () => {
  beforeEach(() => localStorage.clear());

  it('names the key it needs and offers a way to add it', () => {
    render(wrap(<MissingKeyAlert secretKey="google_places_api_key" />));

    expect(screen.getByText(/Google Places API Key required/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add key/i })).toBeInTheDocument();
  });

  it('renders a tool-specific hint when given one', () => {
    render(wrap(<MissingKeyAlert secretKey="openai_api_key" hint="Only needed for rewriting." />));
    expect(screen.getByText('Only needed for rewriting.')).toBeInTheDocument();
  });

  it('opens the drawer focused on that key, with the how-to-get-one steps', async () => {
    render(wrap(<MissingKeyAlert secretKey="google_places_api_key" />));

    fireEvent.click(screen.getByRole('button', { name: /add key/i }));

    // The drawer opens with a pointer to the specific field, not a generic blurb.
    expect(await screen.findByText(/paste your/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/API Keys & Secrets/i)).toBeInTheDocument();
    });
  });
});

const OpenerProbe: React.FC = () => {
  const { openSecrets, isOpen } = useSecrets();
  return (
    <button type="button" onClick={() => openSecrets()}>
      {isOpen ? 'drawer-open' : 'drawer-closed'}
    </button>
  );
};

describe('SecretsProvider', () => {
  it('exposes the drawer to any descendant', async () => {
    render(wrap(<OpenerProbe />));

    expect(screen.queryByText(/API Keys & Secrets/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'drawer-closed' }));

    // Assert on the drawer rather than the probe's label: once the modal is
    // open MUI marks the rest of the tree aria-hidden, so role queries against
    // the probe would fail for reasons unrelated to the context.
    expect(await screen.findByText(/API Keys & Secrets/i)).toBeInTheDocument();
  });

  it('throws when used outside the provider', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<OpenerProbe />)).toThrow(/within a SecretsProvider/);
    quiet.mockRestore();
  });
});

describe('Logo', () => {
  it('paints the wordmark with currentColor so it adapts to the theme', () => {
    const { container } = render(wrap(<Logo />));
    const svg = container.querySelector('svg');

    expect(svg).toBeInTheDocument();
    // The published asset hard-codes #000/#171717, which vanishes on dark.
    expect(svg?.innerHTML).toContain('currentColor');
    expect(svg?.innerHTML).not.toContain('#171717');
    expect(svg?.innerHTML).not.toMatch(/fill="#000"/);
  });

  it('is labelled for assistive tech', () => {
    render(wrap(<Logo />));
    expect(screen.getByRole('img', { name: 'Exyconn' })).toBeInTheDocument();
  });

  it('uses JSX attribute names, so React logs no invalid-property warnings', () => {
    // The SVG was converted from published markup; kebab-case leftovers such as
    // flood-opacity render as warnings rather than failures, so assert on them.
    const errors: unknown[] = [];
    const spy = vi.spyOn(console, 'error').mockImplementation((...args) => errors.push(args[0]));

    render(wrap(<Logo />));
    spy.mockRestore();

    expect(errors.filter((message) => String(message).includes('Invalid DOM property'))).toEqual([]);
  });
});

describe('ScrollTopButton', () => {
  it('stays hidden until the page is scrolled', () => {
    Object.defineProperty(globalThis, 'scrollY', { value: 0, writable: true, configurable: true });
    render(wrap(<ScrollTopButton />));
    expect(screen.getByLabelText('Back to top')).not.toBeVisible();
  });

  it('appears once scrolled and returns to the top when clicked', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(globalThis, 'scrollTo', { value: scrollTo, writable: true, configurable: true });
    Object.defineProperty(globalThis, 'scrollY', { value: 900, writable: true, configurable: true });

    render(wrap(<ScrollTopButton />));

    const button = screen.getByLabelText('Back to top');
    await waitFor(() => expect(button).toBeVisible());

    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
