import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FontsTab } from '../../../../../../src/pages/website/forms/cms-design-system/FontsTab';
import { renderWithProviders } from '../../../../test-utils';
import { DesignHarness } from './design-harness';
import { LORA } from './font-dialog-stubs';

vi.mock('../../../../../../src/pages/website/forms/cms-google-font', async () => {
  const { GoogleFontFormStub } = await import('./font-dialog-stubs');
  return { GoogleFontForm: GoogleFontFormStub };
});

vi.mock('../../../../../../src/pages/website/forms/cms-custom-font', async () => {
  const { CustomFontFormStub } = await import('./font-dialog-stubs');
  return { CustomFontForm: CustomFontFormStub };
});

const INTER = { provider: 'GOOGLE' as const, family: 'Inter', variants: ['400'] };

function setup() {
  const onSubmit = vi.fn();
  renderWithProviders(
    <DesignHarness
      values={{ fontSources: [INTER], fonts: [{ key: 'sans', value: '"Inter", sans-serif' }] }}
      onSubmit={onSubmit}
    >
      <FontsTab siteId="site-1" />
    </DesignHarness>,
  );
  return { user: userEvent.setup(), onSubmit };
}

const googleSheets = () =>
  [...document.head.querySelectorAll('link[rel="stylesheet"]')].map((link) =>
    link.getAttribute('href'),
  );
const fontFaces = () =>
  [...document.head.querySelectorAll('style')]
    .map((style) => style.textContent ?? '')
    .filter((css) => css.startsWith('@font-face'));

describe('FontsTab', () => {
  it('loads the families into the page and previews the roles', () => {
    setup();

    expect(screen.getByText('Loaded families')).toBeInTheDocument();
    expect(screen.getByText('Regular 400')).toBeInTheDocument();
    expect(screen.getAllByRole('textbox', { name: 'Role' })[0]).toHaveValue('sans');
    expect(screen.getByText('AI that does the work')).toBeInTheDocument();
    expect(googleSheets()).toEqual([
      'https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400&display=swap',
    ]);
    expect(fontFaces()).toEqual([]);
  });

  it('adds a Google family through its dialog', async () => {
    const { user, onSubmit } = setup();

    expect(screen.queryByRole('region', { name: 'Google font dialog' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Google font' }));
    expect(screen.getByText('Loaded: Inter')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Lora' }));
    await user.click(screen.getByRole('button', { name: 'Close Google' }));

    expect(screen.queryByRole('region', { name: 'Google font dialog' })).not.toBeInTheDocument();
    expect(screen.getByText('Lora')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].fontSources).toEqual([INTER, LORA]);
  });

  it('uploads a custom family into the site and draws it with @font-face', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Upload custom font' }));
    expect(screen.getByText('Site: site-1')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Brand Sans' }));
    await user.click(screen.getByRole('button', { name: 'Close upload' }));

    expect(screen.queryByRole('region', { name: 'Custom font dialog' })).not.toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    const [face] = fontFaces();
    expect(face).toContain('font-family: "Brand Sans"');
    expect(face).toContain('url("https://cdn.example.com/brand.woff2") format("woff2")');
  });

  it('stops loading a family once it is removed', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'Remove Inter' }));

    expect(
      screen.getByText('No families loaded yet: pages use the fallback stacks below.'),
    ).toBeInTheDocument();
    expect(googleSheets()).toEqual([]);
  });
});
