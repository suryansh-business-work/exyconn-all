import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { WorkflowGallery } from '../../../src/components/WorkflowGallery';
import { site, workflow } from '../fixtures';
import { renderWithProviders } from '../test-utils';

const SITES = [
  site('advisory', {}, [workflow('quote', 'Get a quote', ['price', 'estimate', 'cost', 'fees'])]),
  site('store', {}, [workflow('order', 'Place an order'), workflow('track', 'Track an order')]),
];

describe('the workflow gallery', () => {
  it('groups every workflow by its site, with up to three example phrases', () => {
    renderWithProviders(<WorkflowGallery sites={SITES} onTry={vi.fn()} />);
    const advisory = screen.getByRole('region', { name: 'Northwind Advisory' });
    expect(within(advisory).getByRole('heading', { name: 'Services firm: Northwind Advisory' })).toBeInTheDocument();
    expect(within(advisory).getByText('1 workflows')).toBeInTheDocument();
    expect(within(advisory).getByText('“price”')).toBeInTheDocument();
    expect(within(advisory).getByText('“cost”')).toBeInTheDocument();
    expect(within(advisory).queryByText('“fees”')).not.toBeInTheDocument();
    const store = screen.getByRole('region', { name: 'Kirana Online' });
    expect(within(store).getAllByRole('listitem')).toHaveLength(2);
  });

  it('tries a workflow on its own site', async () => {
    const onTry = vi.fn();
    renderWithProviders(<WorkflowGallery sites={SITES} onTry={onTry} />);
    await userEvent.click(screen.getByRole('button', { name: 'Try Track an order' }));
    expect(onTry).toHaveBeenCalledWith('store', 'track');
  });
});
