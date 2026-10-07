import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DesignPreview } from '../../../../../../src/pages/website/forms/cms-design-system/DesignPreview';
import { TokenListFields } from '../../../../../../src/pages/website/forms/cms-design-system/TokenListFields';
import type { DesignSystemFormValues } from '../../../../../../src/pages/website/forms/cms-design-system';
import { renderWithProviders } from '../../../../test-utils';
import { DesignHarness } from './design-harness';

function setup(values: Partial<DesignSystemFormValues>) {
  renderWithProviders(
    <DesignHarness values={values}>
      <DesignPreview />
    </DesignHarness>,
  );
}

describe('DesignPreview', () => {
  it('shows only the heading while the groups are empty or missing', () => {
    setup({ fonts: undefined });

    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.queryByText('Palette')).not.toBeInTheDocument();
    expect(screen.queryByText('Light colours')).not.toBeInTheDocument();
    expect(screen.queryByText('Dark colours')).not.toBeInTheDocument();
    expect(screen.queryByText('Radii and shadows')).not.toBeInTheDocument();
  });

  it('draws a swatch for each filled colour token, skipping half-written rows', () => {
    setup({
      palette: [
        { key: 'brand-500', value: '#f9851f' },
        { key: 'draft', value: ' ' },
      ],
      colorsLight: [{ key: 'primary', value: 'var(--palette-brand-500)' }],
      colorsDark: [{ key: 'page', value: '#09090b' }],
    });

    expect(screen.getByText('Palette')).toBeInTheDocument();
    expect(screen.getByText('brand-500')).toHaveAttribute('title', 'brand-500');
    expect(screen.queryByText('draft')).not.toBeInTheDocument();
    expect(screen.getByText('Light colours')).toBeInTheDocument();
    expect(screen.getByText('primary')).toBeInTheDocument();
    expect(screen.getByText('Dark colours')).toBeInTheDocument();
    expect(screen.getByText('page')).toBeInTheDocument();
  });

  it('writes a sample line in each font role', () => {
    setup({ fonts: [{ key: 'sans', value: 'Inter, sans-serif' }] });

    expect(
      screen.getByText('sans: The quick brown fox jumps over the lazy dog'),
    ).toBeInTheDocument();
  });

  it('draws the radii and the shadows', () => {
    setup({
      radii: [{ key: 'md', value: '0.5rem' }],
      shadows: [{ key: 'sm', value: '0 1px 2px rgb(0 0 0 / 5%)' }],
    });

    expect(screen.getByText('Radii and shadows')).toBeInTheDocument();
    expect(screen.getByTitle('md')).toBeInTheDocument();
    expect(screen.getByTitle('sm')).toBeInTheDocument();
  });

  it('shows shadows on their own', () => {
    setup({ shadows: [{ key: 'lg', value: '0 4px 8px black' }] });

    expect(screen.getByText('Radii and shadows')).toBeInTheDocument();
    expect(screen.getByTitle('lg')).toBeInTheDocument();
  });

  it('follows the tokens as they are edited', async () => {
    renderWithProviders(
      <DesignHarness values={{ radii: [] }}>
        <TokenListFields name="radii" prefix="--radius-" hint="Corner radii." />
        <DesignPreview />
      </DesignHarness>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: 'Add token' }));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), 'xl');
    expect(screen.queryByTitle('xl')).not.toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Value' }), '1rem');

    expect(await screen.findByTitle('xl')).toBeInTheDocument();
  });
});
