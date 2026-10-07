import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  BlogLiveEditRoute,
  CaseStudyLiveEditRoute,
  LIVE_EDIT_ACTION,
} from '../../../../../src/pages/website/live-edit';
import { renderWithProviders } from '../../../test-utils';

vi.mock('../../../../../src/pages/website/live-edit/BlogLiveEditPage', async () => {
  const { createElement } = await import('react');
  return { BlogLiveEditPage: () => createElement('h1', null, 'Blog live edit') };
});

vi.mock('../../../../../src/pages/website/live-edit/CaseStudyLiveEditPage', async () => {
  const { createElement } = await import('react');
  return { CaseStudyLiveEditPage: () => createElement('h1', null, 'Case study live edit') };
});

describe('live-edit routes', () => {
  it('loads the blog editor on demand', async () => {
    renderWithProviders(<BlogLiveEditRoute />);
    expect(await screen.findByRole('heading', { name: 'Blog live edit' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('loads the case study editor on demand', async () => {
    renderWithProviders(<CaseStudyLiveEditRoute />);
    expect(
      await screen.findByRole('heading', { name: 'Case study live edit' }),
    ).toBeInTheDocument();
  });

  it('exports the grid action that opens the editor', () => {
    expect(LIVE_EDIT_ACTION.key).toBe('liveEdit');
  });
});
