import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { CtaMessage } from '../../../../../src/components/wa/messages/CtaMessage';
import { frame, renderMessage } from './messages.fixtures';

const ics = vi.hoisted(() => ({ downloadIcs: vi.fn() }));
vi.mock('../../../../../src/components/wa/messages/ics', () => ics);

const event = { title: 'Dental check-up', start: Date.UTC(2026, 9, 6, 9, 30), durationMin: 30 };

function renderCta() {
  return renderMessage(
    <CtaMessage
      content={{
        type: 'cta',
        header: 'Booked',
        text: 'Your visit is confirmed',
        footer: 'Smile Clinic',
        actions: [
          { kind: 'url', title: 'Directions', url: 'https://maps.example.com/clinic' },
          { kind: 'call', title: 'Call us', phone: '+91 80 1234 5678' },
          { kind: 'calendar', title: 'Add to calendar', event },
        ],
      }}
      frame={frame}
    />,
  );
}

describe('CtaMessage', () => {
  it('shows the message with one button per action', () => {
    renderCta();
    expect(screen.getByText('Your visit is confirmed')).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Directions',
      'Call us',
      'Add to calendar',
    ]);
  });

  it('explains a link that would leave the demo', async () => {
    const { actions, user } = renderCta();
    await user.click(screen.getByRole('button', { name: 'Directions' }));
    expect(actions.explainExternal).toHaveBeenCalledWith('https://maps.example.com/clinic');
  });

  it('explains a call that would leave the demo', async () => {
    const { actions, user } = renderCta();
    await user.click(screen.getByRole('button', { name: 'Call us' }));
    expect(actions.explainExternal).toHaveBeenCalledWith('+91 80 1234 5678');
  });

  it('saves the appointment as a calendar file', async () => {
    const { actions, user } = renderCta();
    await user.click(screen.getByRole('button', { name: 'Add to calendar' }));
    expect(ics.downloadIcs).toHaveBeenCalledWith(event, 'appointment.ics');
    expect(actions.explainExternal).not.toHaveBeenCalled();
  });
});
