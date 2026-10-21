import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  readMeetPage,
  openTranscriptionControls,
  watchPage,
} from '../../../src/content/meet-adapter';
import { isVisible, matchesPhrases, normalizeText } from '../../../src/content/meet-adapter/dom';
import { observeMeetPage } from '../../../src/content/meet-adapter/page-state';
import { readParticipants } from '../../../src/content/meet-adapter/participants';
import { readMeetingTitle } from '../../../src/content/meet-adapter/title';
import { readTranscriptionState } from '../../../src/content/meet-adapter/transcription';
import { classifyObservation } from '../../../src/utils/meeting-state';
import {
  ASKING_TO_JOIN,
  IN_CALL,
  IN_CALL_SWITCH_OFF,
  IN_CALL_SWITCH_ON,
  IN_CALL_TRANSCRIBING,
  IN_CALL_TRANSCRIPT_HIDDEN_ON,
  IN_CALL_TRANSCRIPT_OFF,
  LEFT_MEETING,
  PRE_JOIN,
  RECONNECTING,
  peoplePanel,
  render,
  tiles,
} from '../fixtures/meet-dom';

afterEach(() => {
  document.body.innerHTML = '';
  document.title = '';
});

describe('page state from the visible UI', () => {
  it.each([
    [PRE_JOIN, 'WAITING'],
    [ASKING_TO_JOIN, 'JOINING'],
    [IN_CALL, 'IN_MEETING'],
    [RECONNECTING, 'RECONNECTING'],
    [LEFT_MEETING, 'ENDED'],
    ['<main><p>Loading</p></main>', null],
  ])('classifies a fixture', (html, state) => {
    expect(classifyObservation(observeMeetPage(render(html)))).toBe(state);
  });

  it('ignores hidden call controls', () => {
    expect(observeMeetPage(render(`<div style="display:none">${IN_CALL}</div>`)).inCall).toBe(
      false,
    );
    expect(observeMeetPage(render(`<div style="visibility:hidden">${IN_CALL}</div>`)).inCall).toBe(
      false,
    );
    expect(observeMeetPage(render(`<div aria-hidden="true">${IN_CALL}</div>`)).inCall).toBe(false);
  });
});

describe('transcription state', () => {
  it.each([
    [IN_CALL_TRANSCRIBING, 'ON'],
    [IN_CALL_SWITCH_ON, 'ON'],
    [IN_CALL_TRANSCRIPT_OFF, 'OFF'],
    [IN_CALL_SWITCH_OFF, 'OFF'],
    [IN_CALL, 'UNKNOWN'],
    [IN_CALL_TRANSCRIPT_HIDDEN_ON, 'UNKNOWN'],
    [`${IN_CALL}<div role="switch" aria-label="Transcription"></div>`, 'UNKNOWN'],
    [`${IN_CALL}<h2>Transcripts</h2>`, 'UNKNOWN'],
  ])('reads a fixture', (html, state) => {
    expect(readTranscriptionState(render(html))).toBe(state);
  });

  it('lets ON win when both an indicator and a start control are visible', () => {
    expect(
      readTranscriptionState(
        render(`${IN_CALL_TRANSCRIPT_OFF}<div aria-label="Transcript is on"></div>`),
      ),
    ).toBe('ON');
  });
});

describe('participants', () => {
  it('reads the complete People list, marking the signed-in user', () => {
    const read = readParticipants(
      render(peoplePanel(['Asha Rao (You)', 'Ravi', 'ravi@example.com'])),
    );
    expect(read.complete).toBe(true);
    expect(read.participants).toEqual([
      { key: 'asha rao', displayName: 'Asha Rao', isSelf: true },
      { key: 'ravi', displayName: 'Ravi', isSelf: false },
    ]);
  });

  it('falls back to visible tiles as a partial roster', () => {
    const read = readParticipants(
      render(`${tiles(['Meera'], 'Asha')}<div data-participant-id="x"></div>`),
    );
    expect(read.complete).toBe(false);
    expect(read.participants).toEqual([
      { key: 'asha', displayName: 'Asha', isSelf: true },
      { key: 'meera', displayName: 'Meera', isSelf: false },
    ]);
  });

  it('reads a list row by its text when it has no label', () => {
    const doc = render(
      '<div role="list" aria-label="Participants"><div role="listitem">Meera</div></div>',
    );
    expect(readParticipants(doc).participants).toEqual([
      { key: 'meera', displayName: 'Meera', isSelf: false },
    ]);
  });

  it('treats a hidden People list as absent', () => {
    expect(readParticipants(render(`<div hidden>${peoplePanel(['Ravi'])}</div>`)).complete).toBe(
      false,
    );
  });
});

const LIST =
  '<div role="list" aria-label="Participants"><div role="listitem" aria-label="Ravi"></div></div>';

describe('readMeetPage', () => {
  const page = {
    meetingCode: 'abc-defg-hij',
    url: 'https://meet.google.com/abc-defg-hij',
    previous: 'PAGE_OPENED' as const,
    trackParticipants: true,
  };

  it('reports state, transcription and participants in the call', () => {
    document.title = 'Meet - Weekly sync';
    const report = readMeetPage(render(`${IN_CALL_TRANSCRIPT_OFF}${peoplePanel(['Ravi'])}`), page);
    expect(report).toEqual({
      meetingCode: 'abc-defg-hij',
      url: page.url,
      title: 'Weekly sync',
      meetingState: 'IN_MEETING',
      transcriptionState: 'OFF',
      participants: [{ key: 'ravi', displayName: 'Ravi', isSelf: false }],
      participantsComplete: true,
    });
  });

  it('reads nothing about transcription or people outside the call, or with tracking off', () => {
    const lobby = readMeetPage(render(`${PRE_JOIN}${LIST}`), page);
    expect(lobby).toMatchObject({
      meetingState: 'WAITING',
      transcriptionState: 'UNKNOWN',
      participants: [],
    });
    const untracked = readMeetPage(render(peoplePanel(['Ravi'])), {
      ...page,
      trackParticipants: false,
    });
    expect(untracked.participants).toEqual([]);
  });
});

describe('title', () => {
  it('uses the call name or falls back to the code', () => {
    document.title = 'Meet – Design review';
    expect(readMeetingTitle(document, 'abc-defg-hij')).toBe('Design review');
    document.title = 'Meet - ';
    expect(readMeetingTitle(document, 'abc-defg-hij')).toBe('abc-defg-hij');
    document.title = 'Google Meet';
    expect(readMeetingTitle(document, 'abc-defg-hij')).toBe('abc-defg-hij');
  });
});

describe('openTranscriptionControls', () => {
  it("focuses Meet's own start control without pressing it", () => {
    const doc = render(IN_CALL_TRANSCRIPT_OFF);
    const start = doc.querySelector('aside button') as HTMLButtonElement;
    const click = vi.fn();
    start.addEventListener('click', click);
    expect(openTranscriptionControls(doc)).toBe('FOCUSED');
    expect(document.activeElement).toBe(start);
    expect(click).not.toHaveBeenCalled();
  });

  it('opens the Activities panel when the control is not visible', () => {
    const doc = render(IN_CALL);
    const click = vi.fn();
    doc.querySelector('[aria-label="Activities"]')?.addEventListener('click', click);
    expect(openTranscriptionControls(doc)).toBe('OPENED');
    expect(click).toHaveBeenCalledTimes(1);
  });

  it('reports when neither is on screen', () => {
    expect(openTranscriptionControls(render(PRE_JOIN))).toBe('NOT_FOUND');
  });
});

describe('dom helpers', () => {
  it('normalises and matches phrases', () => {
    expect(normalizeText('  Join\n NOW ')).toBe('join now');
    expect(normalizeText(null)).toBe('');
    expect(matchesPhrases('', { exact: [''], contains: [''] })).toBe(false);
    expect(matchesPhrases('rejoin', { exact: ['rejoin'], contains: [] })).toBe(true);
  });

  it('treats an element in a detached document view as visible when nothing hides it', () => {
    const detached = document.implementation.createHTMLDocument('x');
    detached.body.innerHTML = '<button>Join now</button>';
    expect(isVisible(detached.body.firstElementChild as Element)).toBe(true);
  });
});

describe('watchPage', () => {
  it('reads once at start and again, debounced, after changes; stops on demand', async () => {
    vi.useFakeTimers();
    const read = vi.fn();
    const stop = watchPage(render(PRE_JOIN), read);
    vi.advanceTimersByTime(1000);
    expect(read).toHaveBeenCalledTimes(1);
    document.body.append(document.createElement('div'));
    document.body.append(document.createElement('div'));
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    expect(read).toHaveBeenCalledTimes(2);
    stop();
    document.body.append(document.createElement('div'));
    await Promise.resolve();
    vi.advanceTimersByTime(5000);
    expect(read).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
