import { fireEvent, screen } from '@testing-library/react';
import type { WorkProfile, Workday } from '@exyconn/tracker-core';
import { describe, expect, it } from 'vitest';
import { DayProgress } from '../../../../src/components/dashboard/DayProgress';
import { ProgressRing } from '../../../../src/components/dashboard/ProgressRing';
import {
  dayFigures,
  dayProgressLabel,
  daySummary,
  dayTargetSource,
} from '../../../../src/lib/dashboard/day-progress';
import { ringDiameter } from '../../../../src/lib/dashboard/ring-size';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';

const HOUR = 3_600_000;

const WORKDAY: Workday = {
  date: '2026-10-07',
  targetMs: 8 * HOUR,
  activeMs: 0,
  attendanceStatus: 'PRESENT',
  attendanceNote: null,
  attendanceMarked: true,
};

const PROFILE: WorkProfile = {
  workingTime: 'FIXED',
  workingTimeNote: '',
  workLocation: 'OFFICE',
  workLocationNote: '',
  workHoursPerDay: 6,
  targetMs: 6 * HOUR,
};

describe('DayProgress', () => {
  it('draws the day as a figure over a bar filling towards the target', () => {
    renderWithProviders(
      <DayProgress workday={WORKDAY} workProfile={null} activeMs={4 * HOUR} style="bar" />,
    );
    const figures = dayFigures(WORKDAY, null, 4 * HOUR);
    expect(screen.getByText('Worked today')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('4h 0m')).toBeInTheDocument();
    expect(screen.getByText('of 8h 0m')).toBeInTheDocument();
    expect(screen.getByText(daySummary(figures))).toBeInTheDocument();
    expect(getByA11yLabel(dayProgressLabel(figures, 4 * HOUR))).toBeInTheDocument();
  });

  it('draws the same number as a ring when the employee prefers one', () => {
    const { container } = renderWithProviders(
      <DayProgress workday={WORKDAY} workProfile={null} activeMs={2 * HOUR} style="ring" />,
    );
    const figures = dayFigures(WORKDAY, null, 2 * HOUR);
    expect(screen.getAllByText('25%')).toHaveLength(2);
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
    expect(screen.getByText(daySummary(figures))).toBeInTheDocument();
    expect(container.querySelectorAll('circle')).toHaveLength(2);
    expect(getByA11yLabel('25%. 2h 0m')).toBeInTheDocument();
  });

  it('falls back to HR’s contracted day when the portal has no workday yet', () => {
    renderWithProviders(
      <DayProgress workday={null} workProfile={PROFILE} activeMs={3 * HOUR} style="bar" />,
    );
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('of 6h 0m')).toBeInTheDocument();
  });

  it('says the day is complete once the target is met', () => {
    renderWithProviders(
      <DayProgress workday={WORKDAY} workProfile={PROFILE} activeMs={9 * HOUR} style="ring" />,
    );
    expect(screen.getAllByText('100%')).toHaveLength(2);
    expect(screen.getByText('Full 6h day complete.')).toBeInTheDocument();
  });

  it('shows an empty day with no target as 0% and no arc', () => {
    const { container } = renderWithProviders(
      <DayProgress workday={null} workProfile={null} activeMs={0} style="ring" />,
    );
    expect(screen.getAllByText('0%')).toHaveLength(2);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });

  it('explains where the target comes from on request, and hides it again', () => {
    renderWithProviders(
      <DayProgress workday={WORKDAY} workProfile={PROFILE} activeMs={HOUR} style="bar" />,
    );
    const about = screen.getByRole('button', { name: 'About your working day' });
    const source = dayTargetSource(dayFigures(WORKDAY, PROFILE, HOUR));
    expect(about).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText(source)).toBeNull();

    fireEvent.click(about);
    expect(about).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(source)).toBeInTheDocument();

    fireEvent.click(about);
    expect(screen.queryByText(source)).toBeNull();
  });
});

function geometry(size: number) {
  const diameter = ringDiameter(size, 1, 390);
  const radius = (diameter - 6) / 2;
  return { diameter, radius, circumference: 2 * Math.PI * radius };
}

describe('ProgressRing', () => {
  it('draws a full track and an arc from the top, clockwise, as far as the value', () => {
    const { container } = renderWithProviders(
      <ProgressRing value={25} label="25%" caption="2h 0m" color="#00aa00" />,
    );
    const { diameter, radius, circumference } = geometry(116);
    const [track, arc] = [...container.querySelectorAll('circle')];
    expect(track).toHaveAttribute('r', String(radius));
    expect(arc).toHaveAttribute('stroke', '#00aa00');
    expect(arc).toHaveAttribute('stroke-dashoffset', String(circumference * (1 - 25 / 100)));
    expect(arc).toHaveAttribute('transform', `rotate(-90 ${diameter / 2} ${diameter / 2})`);
    expect(container.querySelector('svg')).toHaveAttribute('width', String(diameter));
  });

  it('is spoken as the figure and what it is of', () => {
    renderWithProviders(<ProgressRing value={60} label="60%" caption="Worked" color="#000" />);
    expect(getByA11yLabel('60%. Worked')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('Worked')).toBeInTheDocument();
  });

  it('grows with a larger text size, up to its share of the window', () => {
    const { container } = renderWithProviders(
      <ProgressRing value={10} label="10%" caption="1h" color="#000" size={80} />,
    );
    expect(container.querySelector('svg')).toHaveAttribute('width', String(geometry(80).diameter));
  });

  it('draws only the track at zero', () => {
    const { container } = renderWithProviders(
      <ProgressRing value={0} label="0%" caption="0m" color="#000" />,
    );
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});
