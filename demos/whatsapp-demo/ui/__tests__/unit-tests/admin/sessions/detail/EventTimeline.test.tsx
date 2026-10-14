import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhatsappDemoEventType } from '@exyconn/shell/graphql/generated';
import { EventTimeline } from '../../../../../src/admin/sessions/detail/EventTimeline';
import { renderWithProviders } from '../../../test-utils';
import { demoEvent } from '../../admin.fixtures';

const scrollIntoView = vi.fn();
const EVENTS = [
  demoEvent({ id: 'e1', type: WhatsappDemoEventType.SessionStart }),
  demoEvent({ id: 'e2', type: WhatsappDemoEventType.DemoOpened, demoKey: 'clinic' }),
  demoEvent({ id: 'e3', type: WhatsappDemoEventType.SessionEnd }),
];

/** A media query list that answers `matches` for the reduced-motion query only. */
function preferReducedMotion(matches: boolean) {
  const matchMedia = (query: string) => ({
    matches: matches && query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
  vi.stubGlobal('matchMedia', matchMedia);
}

beforeEach(() => {
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
  scrollIntoView.mockReset();
  vi.unstubAllGlobals();
});

describe('EventTimeline', () => {
  it('says so when the session recorded nothing', () => {
    renderWithProviders(<EventTimeline events={[]} industryName={(key) => key} />);
    expect(screen.getByText('This session recorded no events.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Replay' })).not.toBeInTheDocument();
  });

  it('lists the events oldest first under the replay controls', () => {
    renderWithProviders(
      <EventTimeline events={EVENTS} industryName={(key) => `Industry ${key}`} />,
    );
    const list = screen.getByRole('list', { name: 'Session events' });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent?.split(/\d/)[0])).toEqual([
      'Session started',
      'Industry opened',
      'Session ended',
    ]);
    expect(items[1]).toHaveTextContent('Industry clinic');
    expect(screen.getByRole('status')).toHaveTextContent('3 events');
  });

  it('marks the event a stepped replay is on, scrolling smoothly by default', async () => {
    const user = userEvent.setup();
    renderWithProviders(<EventTimeline events={EVENTS} industryName={(key) => key} />);
    await user.click(screen.getByRole('button', { name: 'Next event' }));
    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveAttribute('aria-current', 'step');
    expect(items[1]).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('status')).toHaveTextContent('Event 1 of 3');
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('scrolls without animation when reduced motion is preferred', async () => {
    preferReducedMotion(true);
    const user = userEvent.setup();
    renderWithProviders(<EventTimeline events={EVENTS} industryName={(key) => key} />);
    await user.click(screen.getByRole('button', { name: 'Next event' }));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest', behavior: 'auto' });
  });
});
