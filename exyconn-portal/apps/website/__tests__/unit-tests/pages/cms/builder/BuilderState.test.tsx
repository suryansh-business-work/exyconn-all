import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { BuilderState } from '../../../../../src/pages/cms/builder/BuilderState';
import { renderWithProviders } from '../../../test-utils';

describe('BuilderState', () => {
  it('says why the document could not be opened, even while loading', () => {
    renderWithProviders(<BuilderState loading error={new Error('Forbidden')} label="page" />);
    expect(screen.getByText('Could not open the page: Forbidden')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows a spinner naming what is opening', () => {
    renderWithProviders(<BuilderState loading label="fragment" />);
    expect(screen.getByRole('progressbar', { name: 'Opening the fragment' })).toBeInTheDocument();
  });

  it('says the document no longer exists once loading is over', () => {
    renderWithProviders(<BuilderState loading={false} label="page" />);
    expect(screen.getByText('That page no longer exists.')).toBeInTheDocument();
  });

  it('translates what is being opened', () => {
    renderWithProviders(<BuilderState loading={false} label="page" />, {
      messages: { page: 'Seite' },
    });
    expect(screen.getByText('That Seite no longer exists.')).toBeInTheDocument();
  });
});
