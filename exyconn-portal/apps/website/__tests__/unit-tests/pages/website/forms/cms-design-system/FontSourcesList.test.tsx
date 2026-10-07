import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FontSourcesList } from '../../../../../../src/pages/website/forms/cms-design-system/FontSourcesList';
import { renderWithProviders } from '../../../../test-utils';

describe('FontSourcesList', () => {
  it('explains the fallback stacks while no family is loaded', () => {
    renderWithProviders(<FontSourcesList sources={[]} onRemove={vi.fn()} />);
    expect(
      screen.getByText('No families loaded yet: pages use the fallback stacks below.'),
    ).toBeInTheDocument();
  });

  it('lists Google and uploaded families with their styles, and removes one', async () => {
    const onRemove = vi.fn();
    renderWithProviders(
      <FontSourcesList
        sources={[
          { id: 'f1', provider: 'GOOGLE', family: 'Inter', variants: ['400', '700i'] },
          {
            id: 'f2',
            provider: 'CUSTOM',
            family: 'Brand Sans',
            files: [
              {
                url: 'https://cdn.example.com/r.woff2',
                weight: '400',
                style: 'normal',
                format: 'woff2',
              },
              {
                url: 'https://cdn.example.com/b.woff2',
                weight: '700',
                style: 'italic',
                format: 'woff2',
              },
            ],
          },
        ]}
        onRemove={onRemove}
      />,
    );

    expect(screen.getByText('Inter')).toBeInTheDocument();
    expect(screen.getByText('Google Fonts')).toBeInTheDocument();
    expect(screen.getByText('Regular 400 · Bold 700 italic')).toBeInTheDocument();
    expect(screen.getByText('Brand Sans')).toBeInTheDocument();
    expect(screen.getByText('Uploaded')).toBeInTheDocument();
    expect(screen.getByText('400 · 700 italic')).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove Brand Sans' }));
    expect(onRemove).toHaveBeenCalledWith(1);
  });
});
