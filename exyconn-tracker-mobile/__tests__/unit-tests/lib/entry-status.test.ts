import { describe, expect, it } from 'vitest';
import { ENTRY_STATUS, bookedTo } from '../../../src/lib/off-computer/entry-status';

describe('bookedTo', () => {
  it('names the project alone when no ticket was chosen', () => {
    expect(bookedTo({ projectName: 'Global Project', taskKey: '', taskTitle: '' })).toBe(
      'Global Project',
    );
  });

  it('adds the ticket in the words the picker used', () => {
    expect(bookedTo({ projectName: 'Website', taskKey: 'EXY-14', taskTitle: 'Hero copy' })).toBe(
      'Website · EXY-14 Hero copy',
    );
  });
});

describe('ENTRY_STATUS', () => {
  it('keeps a pending claim neutral — it is not a promise', () => {
    expect(ENTRY_STATUS.PENDING).toMatchObject({ label: 'Waiting on a decision', tone: 'muted' });
  });

  it('colours the two decisions', () => {
    expect(ENTRY_STATUS.APPROVED.tone).toBe('success');
    expect(ENTRY_STATUS.REJECTED.tone).toBe('error');
  });
});
