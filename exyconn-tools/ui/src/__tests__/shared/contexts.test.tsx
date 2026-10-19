/**
 * The app-wide contexts (colour mode, OpenAI key) and the parts of the shell that paint
 * differently in dark mode.
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider, useTheme } from '../../shared/context/ThemeContext';
import { OpenAIProvider, useOpenAI } from '../../shared/context/OpenAIContext';
import { SecretsProvider } from '../../shared/context/SecretsContext';
import NightBand from '../../shared/components/Shell/NightBand';
import OwnThisTool from '../../shared/components/OwnThisTool/OwnThisTool';
import ToolCard from '../../shared/components/ToolCard/ToolCard';
import { createAppTheme } from '../../shared/theme/createAppTheme';
import { getAllTools } from '../../shared/data/toolsData';

const themeWrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => <ThemeProvider>{children}</ThemeProvider>;
const openAIWrapper = ({ children }: Readonly<{ children: React.ReactNode }>) => (
  <OpenAIProvider>{children}</OpenAIProvider>
);

const inDarkApp = (ui: React.ReactNode) => {
  localStorage.setItem('theme', 'dark');
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <SecretsProvider>{ui}</SecretsProvider>
      </MemoryRouter>
    </ThemeProvider>
  );
};

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('ThemeProvider', () => {
  it('toggles light to dark and back, remembering each choice', () => {
    const { result } = renderHook(() => useTheme(), { wrapper: themeWrapper });
    expect(result.current.mode).toBe('light');
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    act(() => result.current.toggleTheme());
    expect(result.current.mode).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('refuses to be used outside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useTheme())).toThrow('useTheme must be used within ThemeProvider');
  });
});

describe('OpenAIProvider', () => {
  it('starts from the stored key, then sets and clears it in storage', () => {
    localStorage.setItem('openai_api_key', 'sk-stored');
    const { result } = renderHook(() => useOpenAI(), { wrapper: openAIWrapper });
    expect(result.current).toMatchObject({ apiKey: 'sk-stored', isKeySet: true });

    act(() => result.current.setApiKey('sk-new'));
    expect(result.current.apiKey).toBe('sk-new');
    expect(localStorage.getItem('openai_api_key')).toBe('sk-new');

    act(() => result.current.clearApiKey());
    expect(result.current).toMatchObject({ apiKey: null, isKeySet: false });
    expect(localStorage.getItem('openai_api_key')).toBeNull();
  });

  it('has no key when none is stored', () => {
    const { result } = renderHook(() => useOpenAI(), { wrapper: openAIWrapper });
    expect(result.current).toMatchObject({ apiKey: null, isKeySet: false });
  });

  it('refuses to be used outside its provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useOpenAI())).toThrow('useOpenAI must be used within an OpenAIProvider');
  });
});

describe('NightBand', () => {
  it('applies every entry of an sx array on top of its own styles', () => {
    render(
      <NightBand label="Band" sx={[{ paddingTop: '11px' }, { paddingBottom: '13px' }]}>
        <p>inside</p>
      </NightBand>
    );
    const band = screen.getByRole('region', { name: 'Band' });
    expect(band).toHaveStyle({ paddingTop: '11px', paddingBottom: '13px', position: 'relative' });
  });
});

describe('OwnThisTool in dark mode', () => {
  const dark = createAppTheme('dark');
  const tools = getAllTools();

  it('uses the light accents for a tool without a price', () => {
    const unpriced = tools.find((tool) => !tool.pricing);
    inDarkApp(<OwnThisTool toolId={unpriced?.id ?? ''} />);
    expect(screen.getByText('Contact for Pricing')).toHaveStyle({ color: dark.palette.primary.light });
    expect(screen.getAllByTestId('CheckCircleIcon')[0]).toHaveStyle({ color: dark.palette.success.light });
  });

  it('uses the main accent for the price in light mode', () => {
    const priced = tools.find((tool) => tool.pricing);
    localStorage.setItem('theme', 'light');
    render(
      <ThemeProvider>
        <MemoryRouter>
          <OwnThisTool toolId={priced?.id ?? ''} />
        </MemoryRouter>
      </ThemeProvider>
    );
    expect(screen.getByText(new RegExp(String.raw`^\$${priced?.pricing?.price}`))).toHaveStyle({
      color: createAppTheme('light').palette.primary.main,
    });
  });

  it('shows the alteration note in the light warning colour', () => {
    const priced = tools.find((tool) => tool.pricing?.alterationNote);
    inDarkApp(<OwnThisTool toolId={priced?.id ?? ''} />);
    expect(screen.getByText(priced?.pricing?.alterationNote ?? '', { exact: false })).toHaveStyle({
      color: dark.palette.warning.light,
    });
  });
});

describe('ToolCard in dark mode', () => {
  it('sits on the dark paper surface', () => {
    const [tool] = getAllTools();
    inDarkApp(<ToolCard tool={tool} />);
    expect(screen.getByRole('link')).toHaveStyle({ backgroundColor: createAppTheme('dark').palette.background.paper });
  });
});
