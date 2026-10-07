import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadIcs, toIcs } from '../../../../../src/components/wa/messages/ics';

/** 6 October 2026, 09:30 UTC. */
const START = Date.UTC(2026, 9, 6, 9, 30);

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('toIcs', () => {
  it('writes a one-event calendar with UTC stamps and the end from the duration', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.UTC(2026, 9, 1, 8, 0, 5, 123));
    const ics = toIcs(
      { title: 'Dental check-up', start: START, durationMin: 45, location: 'Clinic' },
      'uid-1',
    );
    expect(ics.split('\r\n')).toEqual([
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Exyconn//WhatsApp demo//EN',
      'BEGIN:VEVENT',
      'UID:uid-1',
      'DTSTAMP:20261001T080005Z',
      'DTSTART:20261006T093000Z',
      'DTEND:20261006T101500Z',
      'SUMMARY:Dental check-up',
      'LOCATION:Clinic',
      'END:VEVENT',
      'END:VCALENDAR',
    ]);
  });

  it('leaves out the location when there is none', () => {
    const ics = toIcs({ title: 'Call', start: START, durationMin: 15 }, 'uid-2');
    expect(ics).not.toContain('LOCATION');
    expect(ics).toContain('SUMMARY:Call\r\nEND:VEVENT');
  });

  it('escapes backslashes, commas, semicolons and line breaks', () => {
    const ics = toIcs(
      {
        title: String.raw`Dr. Rao, ENT; room 2\B`,
        start: START,
        durationMin: 30,
        location: 'Floor 1\nWing A',
      },
      'uid-3',
    );
    expect(ics).toContain(String.raw`SUMMARY:Dr. Rao\, ENT\; room 2\\B`);
    expect(ics).toContain(String.raw`LOCATION:Floor 1\nWing A`);
  });
});

describe('downloadIcs', () => {
  it('hands the browser a calendar file to save and releases it', () => {
    const blobs: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob);
      return 'blob:calendar';
    });
    const revokeObjectURL = vi.fn();
    const original = { createObjectURL: URL.createObjectURL, revokeObjectURL: URL.revokeObjectURL };
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clicked: HTMLAnchorElement[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this);
    });

    try {
      downloadIcs({ title: 'Visit', start: START, durationMin: 30 }, 'appointment.ics');
    } finally {
      Object.assign(URL, original);
    }

    expect(blobs[0].type).toBe('text/calendar');
    expect(blobs[0].size).toBeGreaterThan(0);
    expect(clicked).toHaveLength(1);
    expect(clicked[0].href).toBe('blob:calendar');
    expect(clicked[0].download).toBe('appointment.ics');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:calendar');
  });
});
