import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { TimeLogScreenshots } from '../../../../../src/pages/projects/time-log/TimeLogScreenshots';
import { renderWithProviders } from '../../../test-utils';

const gql = vi.hoisted(() => ({ shots: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useProjectTimeLogScreenshotsQuery: (options: unknown) => gql.shots(options),
}));

vi.mock('@exyconn/shell/hooks/useSettings', () => ({
  useSettings: () => ({ formatDateTime: (value: string) => `at ${value.slice(11, 16)}` }),
}));

const shot = (id: string, capturedAt: string, blurred = false) => ({
  __typename: 'ProjectTimeLogScreenshot' as const,
  id,
  capturedAt,
  imageUrl: `https://images.test/${id}.png`,
  blurred,
});

describe('TimeLogScreenshots', () => {
  beforeEach(() => {
    gql.shots.mockReset();
    gql.shots.mockReturnValue({ data: undefined });
  });

  it('says screenshots are not the viewer to see, and never fetches them', () => {
    renderWithProviders(
      <TimeLogScreenshots projectId="proj-1" sessionId="run-1" allowed={false} />,
    );

    expect(
      screen.getByText(
        'Screenshots are part of the tracker, not the project board. Ask someone with the Tracker role to review them.',
      ),
    ).toBeInTheDocument();
    expect(gql.shots).toHaveBeenCalledWith({
      variables: { projectId: 'proj-1', sessionId: 'run-1' },
      skip: true,
    });
  });

  it('says plainly when a session captured nothing', () => {
    gql.shots.mockReturnValue({ data: { projectTimeLogScreenshots: [] } });
    renderWithProviders(<TimeLogScreenshots projectId="proj-1" sessionId="run-1" allowed />);

    expect(
      screen.getByText('No screenshots were captured during this session.'),
    ).toBeInTheDocument();
    expect(gql.shots).toHaveBeenCalledWith(expect.objectContaining({ skip: false }));
  });

  it('treats a gallery that has not loaded as empty', () => {
    renderWithProviders(<TimeLogScreenshots projectId="proj-1" sessionId="run-1" allowed />);

    expect(
      screen.getByText('No screenshots were captured during this session.'),
    ).toBeInTheDocument();
  });

  it('shows each shot as a link to the full image with its time, marking blurred ones', () => {
    gql.shots.mockReturnValue({
      data: {
        projectTimeLogScreenshots: [
          shot('s1', '2026-10-02T09:10:00.000Z'),
          shot('s2', '2026-10-02T09:20:00.000Z', true),
        ],
      },
    });
    renderWithProviders(<TimeLogScreenshots projectId="proj-1" sessionId="run-1" allowed />);

    const first = screen.getByRole('img', { name: 'Screen at at 09:10' });
    expect(first).toHaveAttribute('src', 'https://images.test/s1.png');
    expect(first.closest('a')).toHaveAttribute('href', 'https://images.test/s1.png');
    expect(first.closest('a')).toHaveAttribute('target', '_blank');
    expect(first.closest('a')).toHaveAttribute('rel', 'noreferrer');
    expect(screen.getByText('at 09:10')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Screen at at 09:20' })).toBeInTheDocument();
    expect(screen.getByText('at 09:20 · blurred')).toBeInTheDocument();
  });
});
