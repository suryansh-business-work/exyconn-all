import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@exyconn/i18n';
import type { ReactElement } from 'react';
import {
  CardGridSkeleton,
  ChartSkeleton,
  DashboardSkeleton,
  DetailSkeleton,
  FormSkeleton,
  ListSkeleton,
  PageHeaderSkeleton,
  PanelSkeleton,
  SkeletonBone,
  SkeletonStatus,
  StatTilesSkeleton,
  skeletonKeys,
} from '@/components/feedback/skeletons';

function renderIn(ui: ReactElement, messages: Record<string, string> = {}) {
  return render(
    <I18nProvider locale="en" messages={messages}>
      {ui}
    </I18nProvider>,
  );
}

/** Answers every media query with `matches`, as a browser with that preference would. */
function preferReducedMotion(matches: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

const bones = (container: HTMLElement) => container.querySelectorAll('.MuiSkeleton-root');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('skeletonKeys', () => {
  it('gives one stable, prefixed key per placeholder', () => {
    expect(skeletonKeys(3, 'row')).toEqual(['row-1', 'row-2', 'row-3']);
  });

  it('gives none for a zero or negative count', () => {
    expect(skeletonKeys(0, 'row')).toEqual([]);
    expect(skeletonKeys(-2, 'row')).toEqual([]);
  });
});

describe('SkeletonStatus', () => {
  it('is one busy, polite status region with a translated label', () => {
    renderIn(
      <SkeletonStatus label="Loading the session">
        <SkeletonBone variant="text" />
      </SkeletonStatus>,
      { 'Loading the session': 'Cargando la sesión' },
    );

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Cargando la sesión');
  });

  it('defaults its label to "Loading"', () => {
    renderIn(<PageHeaderSkeleton />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
  });

  it('announces once when skeletons are nested', () => {
    renderIn(
      <SkeletonStatus>
        <PageHeaderSkeleton />
        <StatTilesSkeleton />
      </SkeletonStatus>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('pulses by default', () => {
    preferReducedMotion(false);
    const { container } = renderIn(<PanelSkeleton />);
    for (const bone of bones(container)) {
      expect(bone).toHaveClass('MuiSkeleton-pulse');
    }
  });

  it('holds every bone still under reduced motion', () => {
    preferReducedMotion(true);
    const { container } = renderIn(<ListSkeleton rows={2} columns={2} />);
    expect(bones(container).length).toBeGreaterThan(0);
    for (const bone of bones(container)) {
      expect(bone).not.toHaveClass('MuiSkeleton-pulse');
      expect(bone).not.toHaveClass('MuiSkeleton-wave');
    }
  });
});

describe('SkeletonBone', () => {
  it('pulses like a plain MUI Skeleton outside any status region', () => {
    const { container } = renderIn(<SkeletonBone variant="text" />);
    expect(bones(container)[0]).toHaveClass('MuiSkeleton-pulse');
  });
});

describe('PageHeaderSkeleton', () => {
  it('draws the action button unless the page has none', () => {
    const { unmount } = renderIn(<PageHeaderSkeleton />);
    expect(screen.getByTestId('skeleton-header-action')).toBeInTheDocument();
    unmount();

    renderIn(<PageHeaderSkeleton action={false} />);
    expect(screen.queryByTestId('skeleton-header-action')).not.toBeInTheDocument();
  });
});

describe('StatTilesSkeleton', () => {
  it('draws four tiles by default and as many as asked', () => {
    const { unmount } = renderIn(<StatTilesSkeleton />);
    expect(screen.getAllByTestId('skeleton-stat-tile')).toHaveLength(4);
    unmount();

    renderIn(<StatTilesSkeleton count={6} label="Loading the numbers" />);
    expect(screen.getAllByTestId('skeleton-stat-tile')).toHaveLength(6);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the numbers');
  });

  it('still draws a single tile on a full-width row', () => {
    renderIn(<StatTilesSkeleton count={1} />);
    expect(screen.getAllByTestId('skeleton-stat-tile')).toHaveLength(1);
  });
});

describe('ListSkeleton', () => {
  it('draws the toolbar and five rows of four cells by default', () => {
    renderIn(<ListSkeleton />);
    expect(screen.getByTestId('skeleton-list-toolbar')).toBeInTheDocument();
    const rows = screen.getAllByTestId('table-skeleton-row');
    expect(rows).toHaveLength(5);
    expect(rows[0].querySelectorAll('td')).toHaveLength(4);
  });

  it('draws the rows and columns asked for, without a toolbar', () => {
    renderIn(<ListSkeleton rows={8} columns={2} toolbar={false} />);
    expect(screen.queryByTestId('skeleton-list-toolbar')).not.toBeInTheDocument();
    const rows = screen.getAllByTestId('table-skeleton-row');
    expect(rows).toHaveLength(8);
    expect(rows[0].querySelectorAll('td')).toHaveLength(2);
  });
});

describe('CardGridSkeleton', () => {
  it('draws six cards with avatars by default', () => {
    const { container } = renderIn(<CardGridSkeleton />);
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(6);
    expect(container.querySelectorAll('.MuiSkeleton-circular')).toHaveLength(6);
  });

  it('draws the count asked for, without avatars', () => {
    const { container } = renderIn(<CardGridSkeleton count={2} avatar={false} />);
    expect(screen.getAllByTestId('skeleton-card')).toHaveLength(2);
    expect(container.querySelectorAll('.MuiSkeleton-circular')).toHaveLength(0);
  });
});

describe('PanelSkeleton', () => {
  it('draws a heading and three lines by default', () => {
    renderIn(<PanelSkeleton />);
    expect(screen.getByTestId('skeleton-panel-title')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-line')).toHaveLength(3);
  });

  it('draws only the lines asked for, bare and without a heading', () => {
    renderIn(<PanelSkeleton lines={5} title={false} bare />);
    expect(screen.queryByTestId('skeleton-panel-title')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-line')).toHaveLength(5);
  });
});

describe('FormSkeleton', () => {
  it('draws four fields by default and as many as asked, with or without a surface', () => {
    const { unmount } = renderIn(<FormSkeleton />);
    expect(screen.getAllByTestId('skeleton-field')).toHaveLength(4);
    unmount();

    renderIn(<FormSkeleton fields={7} surface={false} />);
    expect(screen.getAllByTestId('skeleton-field')).toHaveLength(7);
  });
});

describe('ChartSkeleton', () => {
  it('draws the plot at the height of the chart it stands in for', () => {
    renderIn(<ChartSkeleton height={320} />);
    expect(screen.getByTestId('skeleton-chart')).toHaveStyle({ height: '320px' });
  });

  it('defaults to a 240px plot', () => {
    renderIn(<ChartSkeleton />);
    expect(screen.getByTestId('skeleton-chart')).toHaveStyle({ height: '240px' });
  });
});

describe('DetailSkeleton', () => {
  it('draws the header, the profile card, the tabs and two panels as one region', () => {
    renderIn(<DetailSkeleton label="Loading the asset" />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the asset');
    expect(screen.getByTestId('skeleton-header-action')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-detail-aside')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton-detail-tabs')).toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-panel-title')).toHaveLength(2);
  });

  it('drops the aside and tabs for a one-column record', () => {
    renderIn(<DetailSkeleton blocks={3} tabs={false} aside={false} />);
    expect(screen.queryByTestId('skeleton-detail-aside')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skeleton-detail-tabs')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('skeleton-panel-title')).toHaveLength(3);
  });
});

describe('DashboardSkeleton', () => {
  it('draws four tiles and two charts by default, as one region', () => {
    renderIn(<DashboardSkeleton />);
    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(screen.getAllByTestId('skeleton-stat-tile')).toHaveLength(4);
    expect(screen.getAllByTestId('skeleton-chart')).toHaveLength(2);
  });

  it('draws the tiles and charts asked for', () => {
    renderIn(<DashboardSkeleton tiles={3} charts={1} label="Loading the report" />);
    expect(screen.getAllByTestId('skeleton-stat-tile')).toHaveLength(3);
    expect(screen.getAllByTestId('skeleton-chart')).toHaveLength(1);
    expect(screen.getByRole('status')).toHaveTextContent('Loading the report');
  });
});

describe('SkeletonStatus label values', () => {
  it('fills a {placeholder} in the label', () => {
    renderIn(
      <SkeletonStatus label="Loading the {what}" labelValues={{ what: 'blog post' }}>
        <SkeletonBone variant="text" />
      </SkeletonStatus>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading the blog post');
  });
});
