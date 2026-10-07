import { screen } from '@testing-library/react';
import { formatCount } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { ActivityBar } from '../../../../src/components/screenshots/ActivityBar';
import { GalleryEmpty, GalleryIntro } from '../../../../src/components/screenshots/GalleryStatus';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel, queryByA11yLabel } from '../state';

const BAR = "Activity in this screenshot's interval";

describe('ActivityBar', () => {
  it.each([85, 30, 140, -5])('is read as the interval’s activity at %s%%', (percent) => {
    renderWithProviders(<ActivityBar percent={percent} />);

    const bar = getByA11yLabel(BAR);
    // A track with exactly one fill inside it.
    expect(bar.children).toHaveLength(1);
  });
});

describe('GalleryEmpty', () => {
  it('says what went wrong, even while a reload is under way', () => {
    renderWithProviders(
      <GalleryEmpty loading error="The day could not be loaded." loadingLabel="Loading" />,
    );

    expect(screen.getByText('The day could not be loaded.')).toBeInTheDocument();
    expect(queryByA11yLabel('Loading')).toBeNull();
  });

  it('holds four shots’ places, named for what is being waited on', () => {
    renderWithProviders(
      <GalleryEmpty loading error={null} loadingLabel="Loading your screenshots" />,
    );

    expect(getByA11yLabel('Loading your screenshots').children).toHaveLength(4);
  });

  it('says plainly when nothing was captured on the day', () => {
    renderWithProviders(<GalleryEmpty loading={false} error={null} loadingLabel="Loading" />);

    expect(screen.getByText('No screenshots were captured on this day.')).toBeInTheDocument();
  });
});

describe('GalleryIntro', () => {
  it('counts the day’s shots and explains a 0% one', () => {
    renderWithProviders(<GalleryIntro count={1234} />);

    expect(screen.getByText(`${formatCount(1234)} captured`)).toBeInTheDocument();
    expect(screen.getByText(/reads 0% until the next sync\.$/)).toBeInTheDocument();
  });
});
