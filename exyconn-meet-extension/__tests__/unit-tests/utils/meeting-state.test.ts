import { describe, expect, it } from 'vitest';
import type { MeetingState } from '../../../src/types/meeting';
import {
  canTransition,
  classifyObservation,
  isLive,
  nextMeetingState,
  type MeetObservation,
} from '../../../src/utils/meeting-state';

const nothing: MeetObservation = {
  inCall: false,
  preJoin: false,
  joining: false,
  reconnecting: false,
  ended: false,
};
const seen = (flags: Partial<MeetObservation>): MeetObservation => ({ ...nothing, ...flags });

describe('classifyObservation', () => {
  it('ranks an end screen above everything', () => {
    expect(classifyObservation(seen({ ended: true, inCall: true, reconnecting: true }))).toBe(
      'ENDED',
    );
  });

  it('ranks a reconnect banner above the call controls under it', () => {
    expect(classifyObservation(seen({ reconnecting: true, inCall: true }))).toBe('RECONNECTING');
  });

  it('maps call controls, joining and pre-join screens', () => {
    expect(classifyObservation(seen({ inCall: true, preJoin: true }))).toBe('IN_MEETING');
    expect(classifyObservation(seen({ joining: true, preJoin: true }))).toBe('JOINING');
    expect(classifyObservation(seen({ preJoin: true }))).toBe('WAITING');
  });

  it('returns null when nothing is recognisable', () => {
    expect(classifyObservation(nothing)).toBeNull();
  });
});

describe('nextMeetingState', () => {
  it('walks a normal call from the lobby to the end', () => {
    let state: MeetingState = 'PAGE_OPENED';
    state = nextMeetingState(state, seen({ preJoin: true }));
    expect(state).toBe('WAITING');
    state = nextMeetingState(state, seen({ joining: true }));
    expect(state).toBe('JOINING');
    state = nextMeetingState(state, seen({ inCall: true }));
    expect(state).toBe('IN_MEETING');
    state = nextMeetingState(state, seen({ reconnecting: true }));
    expect(state).toBe('RECONNECTING');
    state = nextMeetingState(state, seen({ inCall: true }));
    expect(state).toBe('IN_MEETING');
    state = nextMeetingState(state, seen({ ended: true }));
    expect(state).toBe('ENDED');
  });

  it('keeps the state when Meet is mid-render', () => {
    expect(nextMeetingState('IN_MEETING', nothing)).toBe('IN_MEETING');
  });

  it('ignores an impossible move back to the lobby during a call', () => {
    expect(nextMeetingState('IN_MEETING', seen({ preJoin: true }))).toBe('IN_MEETING');
  });

  it('allows a rejoin after the call ended', () => {
    expect(nextMeetingState('ENDED', seen({ inCall: true }))).toBe('IN_MEETING');
  });
});

describe('canTransition', () => {
  it('lets a disconnected tab start over but never jump straight to ended', () => {
    expect(canTransition('DISCONNECTED', 'PAGE_OPENED')).toBe(true);
    expect(canTransition('DISCONNECTED', 'ENDED')).toBe(false);
    expect(canTransition('RECONNECTING', 'WAITING')).toBe(false);
  });
});

describe('isLive', () => {
  it('is true only in the call or while reconnecting to it', () => {
    expect(isLive('IN_MEETING')).toBe(true);
    expect(isLive('RECONNECTING')).toBe(true);
    expect(isLive('WAITING')).toBe(false);
    expect(isLive('ENDED')).toBe(false);
  });
});
