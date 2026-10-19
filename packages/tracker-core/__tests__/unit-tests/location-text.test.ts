import { describe, expect, it } from 'vitest';
import { locationPinLine, locationPinParts, mapEmbedUrl } from '../../src/location-text';
import { t } from './translator';

const PIN = {
  kind: 'ATTENDANCE' as const,
  source: 'GPS' as const,
  capturedAt: '2026-02-03T03:42:00.000Z',
};

describe('mapEmbedUrl', () => {
  it('builds the one Google embed URL both apps allow, zoomed to street level', () => {
    expect(mapEmbedUrl({ lat: 12.97, lng: -77.5 })).toBe(
      'https://maps.google.com/maps?q=12.97,-77.5&z=16&output=embed',
    );
  });
});

describe('locationPinParts', () => {
  it('words an attendance pin from GPS in the employee’s zone', () => {
    expect(locationPinParts(PIN, 'Asia/Kolkata', t)).toEqual({
      time: '9:12 AM',
      kind: 'Attendance',
      source: 'GPS',
    });
  });

  it('words a move pin from a computer’s location service', () => {
    expect(locationPinParts({ ...PIN, kind: 'MOVE', source: 'SYSTEM' }, 'UTC', t)).toEqual({
      time: '3:42 AM',
      kind: 'Moved',
      source: 'System',
    });
  });
});

describe('locationPinLine', () => {
  it('joins the parts into one row line', () => {
    expect(locationPinLine(PIN, 'Asia/Kolkata', t)).toBe('9:12 AM · Attendance · GPS');
  });

  it('passes each part through the translator', () => {
    const shout = (source: string, values?: Record<string, string | number>) =>
      t(source, values).toUpperCase();
    expect(locationPinLine({ ...PIN, kind: 'MOVE' }, 'UTC', shout)).toBe('3:42 AM · MOVED · GPS');
  });
});
