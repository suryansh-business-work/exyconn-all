import { assertWorkingDay, offDayMessage } from '../../../../src/modules/tracker/tracker.offday';
import { trackerExpectedService } from '../../../../src/modules/tracker/tracker.expected.service';
import { codeOf } from '../codeOf';

describe('offDayMessage', () => {
  it('says nothing on a working day', () => {
    expect(offDayMessage({ offReason: null, offLabel: null })).toBeNull();
  });

  it('explains the week off without a label', () => {
    expect(offDayMessage({ offReason: 'WEEKEND', offLabel: null })).toBe(
      'Today is your week off — tracking is paused.',
    );
  });

  it('names the holiday and the leave type when they are known', () => {
    expect(offDayMessage({ offReason: 'HOLIDAY', offLabel: 'Diwali' })).toBe(
      'Today is a holiday (Diwali) — tracking is paused.',
    );
    expect(offDayMessage({ offReason: 'LEAVE', offLabel: 'CL' })).toBe(
      "You're on approved leave (CL) today — tracking is paused.",
    );
  });

  it('leaves the label out when there is none', () => {
    expect(offDayMessage({ offReason: 'HOLIDAY', offLabel: null })).toBe(
      'Today is a holiday — tracking is paused.',
    );
    expect(offDayMessage({ offReason: 'LEAVE', offLabel: '' })).toBe(
      "You're on approved leave today — tracking is paused.",
    );
  });
});

describe('assertWorkingDay', () => {
  const offDayToday = jest.spyOn(trackerExpectedService, 'offDayToday');
  afterAll(() => offDayToday.mockRestore());

  it('lets a working day through, reading the day in the employee’s zone', async () => {
    offDayToday.mockResolvedValueOnce({ offReason: null, offLabel: null });
    await expect(assertWorkingDay('emp-1', 'Asia/Kolkata')).resolves.toBeUndefined();
    expect(offDayToday).toHaveBeenCalledWith('emp-1', 'Asia/Kolkata');
  });

  it('refuses an off day with the reason', async () => {
    offDayToday.mockResolvedValueOnce({ offReason: 'LEAVE', offLabel: 'EL' });
    const refusal = assertWorkingDay('emp-1', 'UTC');
    await expect(refusal).rejects.toThrow("You're on approved leave (EL) today");
    offDayToday.mockResolvedValueOnce({ offReason: 'WEEKEND', offLabel: null });
    await expect(codeOf(assertWorkingDay('emp-1', 'UTC'))).resolves.toBe('FORBIDDEN');
  });
});
