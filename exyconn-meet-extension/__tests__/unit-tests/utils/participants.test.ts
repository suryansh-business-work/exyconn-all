import { describe, expect, it } from 'vitest';
import type { SeenParticipant } from '../../../src/types/meeting';
import {
  cleanDisplayName,
  diffParticipants,
  participantKey,
  toSeenParticipant,
} from '../../../src/utils/participants';

const AT = '2026-10-20T10:00:00.000Z';
const person = (name: string, isSelf = false): SeenParticipant => ({
  key: participantKey(name),
  displayName: name,
  isSelf,
});
const roster = (...people: SeenParticipant[]) => new Map(people.map((p) => [p.key, p]));

describe('display names', () => {
  it('strips the "(You)" marker and tidies spacing', () => {
    expect(cleanDisplayName('  Asha   Rao (You) ')).toBe('Asha Rao');
    expect(participantKey('ASHA  Rao')).toBe('asha rao');
  });

  it('marks the signed-in user from the marker or the tile', () => {
    expect(toSeenParticipant('Asha Rao (You)', false)).toEqual({
      key: 'asha rao',
      displayName: 'Asha Rao',
      isSelf: true,
    });
    expect(toSeenParticipant('Asha Rao', true)?.isSelf).toBe(true);
    expect(toSeenParticipant('Ravi', false)?.isSelf).toBe(false);
  });

  it('never keeps an email address or an empty name', () => {
    expect(toSeenParticipant('ravi@example.com', false)).toBeNull();
    expect(toSeenParticipant('   ', false)).toBeNull();
    expect(toSeenParticipant(null, false)).toBeNull();
  });
});

describe('diffParticipants', () => {
  it('reports joins from an empty roster', () => {
    const diff = diffParticipants(new Map(), [person('Asha', true), person('Ravi')], true, AT);
    expect(diff.events).toEqual([
      { key: 'asha', displayName: 'Asha', isSelf: true, event: 'JOINED', at: AT },
      { key: 'ravi', displayName: 'Ravi', isSelf: false, event: 'JOINED', at: AT },
    ]);
    expect([...diff.roster.keys()]).toEqual(['asha', 'ravi']);
  });

  it('reports a departure when the full People list no longer shows someone', () => {
    const diff = diffParticipants(
      roster(person('Asha'), person('Ravi')),
      [person('Asha')],
      true,
      AT,
    );
    expect(diff.events).toEqual([
      { key: 'ravi', displayName: 'Ravi', isSelf: false, event: 'LEFT', at: AT },
    ]);
    expect(diff.roster.has('ravi')).toBe(false);
  });

  it('reports a rejoin as a new JOINED after LEFT', () => {
    const left = diffParticipants(roster(person('Ravi')), [], true, AT);
    const back = diffParticipants(left.roster, [person('Ravi')], true, AT);
    expect(left.events.map((e) => e.event)).toEqual(['LEFT']);
    expect(back.events.map((e) => e.event)).toEqual(['JOINED']);
  });

  it('never infers a departure from tiles alone', () => {
    const diff = diffParticipants(roster(person('Ravi')), [person('Meera')], false, AT);
    expect(diff.events).toEqual([
      { key: 'meera', displayName: 'Meera', isSelf: false, event: 'JOINED', at: AT },
    ]);
    expect([...diff.roster.keys()].sort((a, b) => a.localeCompare(b))).toEqual(['meera', 'ravi']);
  });

  it('counts two visible people with the same name once', () => {
    const diff = diffParticipants(new Map(), [person('Ravi'), person('ravi')], true, AT);
    expect(diff.events).toHaveLength(1);
  });

  it('reports nothing when nobody changed', () => {
    expect(diffParticipants(roster(person('Ravi')), [person('Ravi')], true, AT).events).toEqual([]);
  });
});
