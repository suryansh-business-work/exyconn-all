import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { RecordState } from '../../../../../src/pages/website/live-edit/RecordState';
import { renderWithProviders } from '../../../test-utils';

describe('RecordState', () => {
  it('shows a labelled spinner while the record loads', () => {
    renderWithProviders(<RecordState loading label="blog post" />);
    expect(screen.getByRole('progressbar', { name: 'Loading the blog post' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('prefers the spinner over an error from an earlier load', () => {
    renderWithProviders(<RecordState loading error={new Error('offline')} label="case study" />);
    expect(screen.getByRole('progressbar', { name: 'Loading the case study' })).toBeInTheDocument();
    expect(screen.queryByText(/offline/)).not.toBeInTheDocument();
  });

  it('says why the record could not be loaded', () => {
    renderWithProviders(
      <RecordState loading={false} error={new Error('Network down')} label="case study" />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Could not load the case study: Network down',
    );
  });

  it('says the record is gone when it loaded as nothing', () => {
    renderWithProviders(<RecordState loading={false} label="blog post" />);
    expect(screen.getByRole('alert')).toHaveTextContent('That blog post no longer exists.');
  });

  it('translates the record’s label into the message', () => {
    renderWithProviders(<RecordState loading={false} label="blog post" />, {
      messages: {
        'blog post': 'article',
        'That {what} no longer exists.': 'Gone: {what}',
      },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Gone: article');
  });
});
