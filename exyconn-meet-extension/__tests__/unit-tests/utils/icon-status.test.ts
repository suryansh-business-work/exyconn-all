import { describe, expect, it } from 'vitest';
import {
  ICON_STATUS_LABEL,
  deriveIconStatus,
  type IconInputs,
} from '../../../src/utils/icon-status';

const base: IconInputs = {
  meetingState: 'IN_MEETING',
  transcriptionState: 'ON',
  captureState: 'IDLE',
  pendingUploads: 0,
};

describe('deriveIconStatus', () => {
  it('shows an error before anything else', () => {
    expect(deriveIconStatus({ ...base, captureState: 'ERROR', pendingUploads: 3 })).toBe('ERROR');
  });

  it('is active while capturing, even with uploads waiting', () => {
    expect(deriveIconStatus({ ...base, captureState: 'RECORDING', pendingUploads: 2 })).toBe(
      'ACTIVE',
    );
  });

  it('is processing while chunks wait after a pause or stop', () => {
    expect(deriveIconStatus({ ...base, captureState: 'STOPPED', pendingUploads: 1 })).toBe(
      'PROCESSING',
    );
  });

  it('asks for attention in a call whose transcription is off or unreadable', () => {
    expect(deriveIconStatus({ ...base, transcriptionState: 'OFF' })).toBe('ATTENTION');
    expect(deriveIconStatus({ ...base, transcriptionState: 'UNKNOWN' })).toBe('ATTENTION');
  });

  it('is idle otherwise', () => {
    expect(deriveIconStatus(base)).toBe('IDLE');
    expect(deriveIconStatus({ ...base, meetingState: 'WAITING', transcriptionState: 'OFF' })).toBe(
      'IDLE',
    );
  });

  it('has words for every state', () => {
    expect(Object.values(ICON_STATUS_LABEL).every((label) => label.length > 0)).toBe(true);
  });
});
