import { fireEvent, screen } from '@testing-library/react';
import { formatDateTime } from '@exyconn/tracker-core';
import { describe, expect, it, vi } from 'vitest';
import { ScreenshotCard } from '../../../../src/components/screenshots/ScreenshotCard';
import { ShotImage } from '../../../../src/components/screenshots/ShotImage';
import { renderWithProviders } from '../../test-utils';
import { getByA11yLabel } from '../state';
import { screenshot } from '../report/fixtures';

const FAILED = 'This screenshot could not be loaded.';

function renderShot() {
  renderWithProviders(
    <ShotImage uri="https://cdn.example.test/a.png" recyclingKey="a" accessibilityLabel="Shot A" />,
  );
  return screen.getByAltText('Shot A');
}

describe('ShotImage', () => {
  it('holds a skeleton over the frame until the image arrives', () => {
    const image = renderShot();

    expect(image).toHaveAttribute('src', 'https://cdn.example.test/a.png');
    expect(image.parentElement?.children).toHaveLength(2);

    fireEvent.load(image);

    expect(image.parentElement?.children).toHaveLength(1);
    expect(screen.queryByText(FAILED)).not.toBeInTheDocument();
  });

  it('says so when the image never arrives, instead of an empty frame', () => {
    const image = renderShot();

    fireEvent.error(image);

    expect(screen.getByText(FAILED)).toBeInTheDocument();
    expect(image.parentElement?.children).toHaveLength(2);
  });
});

describe('ScreenshotCard', () => {
  const ZONE = 'Asia/Kolkata';
  const SHOT = screenshot('shot-1', '2026-02-03T10:42:00.000Z', {
    blurred: true,
    activityPercent: 40,
  });
  const WHEN = formatDateTime(SHOT.capturedAt, ZONE);

  it('shows when the shot was taken, in the employee’s zone, and how active it was', () => {
    renderWithProviders(
      <ScreenshotCard shot={SHOT} timezone={ZONE} width={320} onOpen={vi.fn()} />,
    );

    expect(screen.getByText(WHEN)).toBeInTheDocument();
    expect(screen.getByText('40% active')).toBeInTheDocument();
    expect(getByA11yLabel("Activity in this screenshot's interval")).toBeInTheDocument();
    expect(screen.getByAltText(`Screenshot captured at ${WHEN}`)).toBeInTheDocument();
  });

  it('says when the workspace blurred the shot', () => {
    renderWithProviders(
      <ScreenshotCard shot={SHOT} timezone={ZONE} width={320} onOpen={vi.fn()} />,
    );

    expect(
      screen.getByRole('img', { name: "Blurred by your workspace's settings" }),
    ).toBeInTheDocument();
  });

  it('marks nothing as blurred when it was not', () => {
    renderWithProviders(
      <ScreenshotCard
        shot={{ ...SHOT, blurred: false }}
        timezone={ZONE}
        width={320}
        onOpen={vi.fn()}
      />,
    );

    expect(screen.queryByTestId('icon-blur')).not.toBeInTheDocument();
  });

  it('opens full screen from the thumbnail, handing over the thumbnail for focus to return to', () => {
    const onOpen = vi.fn();
    renderWithProviders(<ScreenshotCard shot={SHOT} timezone={ZONE} width={320} onOpen={onOpen} />);

    const thumbnail = screen.getByRole('button', {
      name: `Open the screenshot captured at ${WHEN} full screen`,
    });
    fireEvent.click(thumbnail);

    expect(onOpen).toHaveBeenCalledWith(thumbnail);
  });
});
