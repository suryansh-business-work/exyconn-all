import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MeetingBotTripForm, meetingBotTripSchema } from '../../../src/forms/meeting-bot-trip';
import { renderWithProviders } from '../test-utils';

const TERMS = 'The recording is deleted after 7 days.';
const MEET = 'https://meet.google.com/abc-defg-hij';

const show = (onSend = vi.fn().mockResolvedValue(true), disabled = false) =>
  renderWithProviders(
    <MeetingBotTripForm consentText={TERMS} busy={false} disabled={disabled} onSend={onSend} />,
  );

describe('the meeting bot form', () => {
  it('needs a link and agreement before sending', async () => {
    const onSend = vi.fn();
    show(onSend);
    expect(screen.getByText(TERMS)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send the bot to my call' }));
    expect(await screen.findByText('Paste the Google Meet link')).toBeInTheDocument();
    expect(screen.getByText('Agree to the recording terms to send the bot')).toBeInTheDocument();
    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends a Meet link with agreement and clears, or keeps the link when sending fails', async () => {
    const onSend = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    show(onSend);
    const link = screen.getByRole('textbox', { name: /Google Meet link/ });
    await userEvent.type(link, MEET);
    await userEvent.click(screen.getByRole('switch', { name: /I agree/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Send the bot to my call' }));
    await vi.waitFor(() => expect(onSend).toHaveBeenCalledWith({ meetUrl: MEET, consent: true }));
    expect(link).toHaveValue(MEET);
    await userEvent.click(screen.getByRole('button', { name: 'Send the bot to my call' }));
    await vi.waitFor(() => expect(link).toHaveValue(''));
  });

  it('cannot send while the demo is unavailable', () => {
    show(vi.fn(), true);
    expect(screen.getByRole('button', { name: 'Send the bot to my call' })).toBeDisabled();
  });

  it('accepts only Google Meet links of a sane length', () => {
    const ok = (meetUrl: string) =>
      meetingBotTripSchema.safeParse({ meetUrl, consent: true }).success;
    expect(ok(MEET)).toBe(true);
    expect(ok(` ${MEET}?authuser=0 `)).toBe(true);
    expect(ok('https://zoom.us/j/123')).toBe(false);
    expect(ok(`${MEET}?${'x'.repeat(300)}`)).toBe(false);
    expect(meetingBotTripSchema.safeParse({ meetUrl: MEET, consent: false }).success).toBe(false);
  });
});
