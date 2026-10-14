import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DEFAULT_FORMAT_SETTINGS, formatTime } from '@exyconn/i18n';
import { WhatsappDemoEventType } from '@exyconn/shell/graphql/generated';
import { EventItem, type DemoEvent } from '../../../../../src/admin/sessions/detail/EventItem';
import { renderWithProviders } from '../../../test-utils';
import { demoEvent } from '../../admin.fixtures';

const scrollIntoView = vi.fn();
const industryName = (key: string) => (key === 'clinic' ? 'Healthcare' : key);

function mount(event: DemoEvent, current = false, reducedMotion = false) {
  return renderWithProviders(
    <ol>
      <EventItem
        event={event}
        current={current}
        industryName={industryName}
        reducedMotion={reducedMotion}
      />
    </ol>,
  );
}

const ai = (meta: unknown) => demoEvent({ type: WhatsappDemoEventType.AiCall, meta });

beforeEach(() => {
  // jsdom lays nothing out, so it has no scrollIntoView of its own.
  Element.prototype.scrollIntoView = scrollIntoView;
});
afterEach(() => {
  scrollIntoView.mockReset();
});

describe('EventItem', () => {
  it('names the event and when it happened, and nothing it did not record', () => {
    const event = demoEvent();
    mount(event);
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('Step');
    expect(screen.getByText(formatTime(event.at, DEFAULT_FORMAT_SETTINGS))).toHaveAttribute(
      'datetime',
      event.at,
    );
    expect(item).not.toHaveTextContent('›');
    expect(item).not.toHaveTextContent('Took');
    expect(item).not.toHaveAttribute('aria-current');
  });

  it('says where in the demo it happened and what was shown', () => {
    mount(
      demoEvent({
        demoKey: 'clinic',
        workflow: 'book-visit',
        node: 'ask-date',
        label: 'Pick a day',
      }),
    );
    expect(screen.getByText('Healthcare › book-visit › ask-date')).toBeInTheDocument();
    expect(screen.getByText('Pick a day')).toBeInTheDocument();
  });

  it('leaves out the parts of the place it does not know', () => {
    mount(demoEvent({ type: WhatsappDemoEventType.FlowStarted, workflow: 'book-visit' }));
    expect(screen.getByText('Flow started')).toBeInTheDocument();
    expect(screen.getByText('book-visit')).toBeInTheDocument();
  });

  it.each([
    [0, 'Took 0s'],
    [90_000, 'Took 1m'],
  ])('shows how long a step of %i ms took', (durationMs, text) => {
    mount(demoEvent({ durationMs }));
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it.each([
    [{ ok: true, latencyMs: 840 }, 'OK · 840 ms'],
    [{ ok: false, latencyMs: 12, error: 'timeout' }, 'Failed: timeout · 12 ms'],
    [{ ok: false }, 'Failed: unknown'],
  ])('shows the outcome of an AI call (%j)', (meta, text) => {
    mount(ai(meta));
    expect(screen.getByText('AI call')).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('shows no outcome for an AI call that recorded none', () => {
    mount(ai(null));
    expect(screen.getByRole('listitem')).not.toHaveTextContent(/OK|Failed/);
  });

  it('marks the replay’s current event and scrolls it into view smoothly', () => {
    mount(demoEvent(), true);
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'step');
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' });
  });

  it('scrolls without animation for someone who prefers reduced motion', () => {
    mount(demoEvent(), true, true);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'auto' });
  });

  it('does not scroll to an event the replay is not on', () => {
    mount(demoEvent(), false);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
