import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { FragmentBuilderRoute, PageBuilderRoute } from '../../../../../src/pages/cms/builder';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/pages/cms/builder/PageBuilderPage', () => ({
  PageBuilderPage: () => <p>Page builder loaded</p>,
}));
vi.mock('../../../../../src/pages/cms/fragments/FragmentBuilderPage', () => ({
  FragmentBuilderPage: () => <p>Fragment builder loaded</p>,
}));

describe('builder routes', () => {
  it('loads the page builder on demand, with a spinner meanwhile', async () => {
    renderWithProviders(<PageBuilderRoute />);

    expect(
      screen.getByRole('progressbar', { name: 'Opening the page builder' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Page builder loaded')).toBeInTheDocument();
  });

  it('loads the fragment builder on demand', async () => {
    renderWithProviders(<FragmentBuilderRoute />);
    expect(await screen.findByText('Fragment builder loaded')).toBeInTheDocument();
  });
});
