import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SearchPexelsPhotosDocument, SearchPexelsVideosDocument } from '@/graphql/generated';
import { PexelsTab } from '@/components/ui/ImageUploadDialog/PexelsTab';
import { renderWithProviders } from '../../../test-utils';
import { pexelsItem } from './fixtures';

const PHOTO_FILTERS = { orientation: null, size: null, color: null };
const VIDEO_FILTERS = { orientation: null, size: null, minDuration: null, maxDuration: null };

const photosMock = (query: string, result: MockLink.MockedResponse['result'] | Error) => ({
  request: { query: SearchPexelsPhotosDocument, variables: { query, filters: PHOTO_FILTERS } },
  ...(result instanceof Error ? { error: result } : { result }),
});

describe('PexelsTab (photos)', () => {
  it('invites a search, runs it on Enter and lets a result be picked', async () => {
    const onPick = vi.fn();
    const photo = pexelsItem();
    renderWithProviders(<PexelsTab kind="photos" onPick={onPick} />, {
      mocks: [photosMock('lighthouse', { data: { searchPexelsPhotos: [photo] } })],
    });

    expect(screen.getByText('Search to browse free stock photos.')).toBeInTheDocument();
    expect(screen.getByText('Photos provided by Pexels.')).toBeInTheDocument();

    const box = screen.getByRole('textbox', { name: 'Search Pexels photos' });
    await userEvent.type(box, '  lighthouse ');
    fireEvent.keyDown(box, { key: 'a' });
    expect(screen.getByText('Search to browse free stock photos.')).toBeInTheDocument();

    fireEvent.keyDown(box, { key: 'Enter' });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    await userEvent.click(
      await screen.findByRole('button', { name: 'Use A lighthouse at dusk by Mira Sol' }),
    );
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: '101' }));
  });

  it('keeps Enter from submitting a form the dialog sits in', async () => {
    const onSubmit = vi.fn((event: React.SyntheticEvent) => event.preventDefault());
    renderWithProviders(
      <form onSubmit={onSubmit}>
        <PexelsTab kind="photos" onPick={vi.fn()} />
      </form>,
      { mocks: [photosMock('sea', { data: { searchPexelsPhotos: [] } })] },
    );

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search Pexels photos' }),
      'sea{Enter}',
    );

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('No photos matched that search.')).toBeInTheDocument();
  });

  it('shows the error when the search fails', async () => {
    renderWithProviders(<PexelsTab kind="photos" onPick={vi.fn()} />, {
      mocks: [photosMock('fog', new Error('Pexels quota exceeded'))],
    });

    await userEvent.type(screen.getByRole('textbox', { name: 'Search Pexels photos' }), 'fog');
    await userEvent.click(screen.getByRole('button', { name: 'search pexels photos' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Pexels quota exceeded');
  });
});

describe('PexelsTab (videos)', () => {
  it('searches clips with the length filter from the search button', async () => {
    const clip = pexelsItem({ id: '7', duration: 30, alt: 'Waves' });
    renderWithProviders(<PexelsTab kind="videos" onPick={vi.fn()} />, {
      mocks: [
        {
          request: {
            query: SearchPexelsVideosDocument,
            variables: { query: 'waves', filters: VIDEO_FILTERS },
          },
          result: { data: { searchPexelsVideos: [clip] } },
        },
      ],
    });

    expect(screen.getByText('Search to browse free stock videos.')).toBeInTheDocument();
    expect(screen.getByText('Videos provided by Pexels.')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Length/ })).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search Pexels videos' }), 'waves');
    await userEvent.click(screen.getByRole('button', { name: 'search pexels videos' }));

    expect(await screen.findByText('0:30')).toBeInTheDocument();
  });

  it('says when no clip matched', async () => {
    renderWithProviders(<PexelsTab kind="videos" onPick={vi.fn()} />, {
      mocks: [
        {
          request: {
            query: SearchPexelsVideosDocument,
            variables: { query: 'zzz', filters: VIDEO_FILTERS },
          },
          result: { data: { searchPexelsVideos: [] } },
        },
      ],
    });

    await userEvent.type(
      screen.getByRole('textbox', { name: 'Search Pexels videos' }),
      'zzz{Enter}',
    );

    expect(await screen.findByText('No videos matched that search.')).toBeInTheDocument();
  });
});
