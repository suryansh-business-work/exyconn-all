import { describe, expect, it } from 'vitest';
import { MaParticipantSource, MaTranscriptSource } from '@exyconn/shell/graphql/generated';
import { MEETING_COLUMNS } from '../../../src/meetings/meetings-grid';
import { TRANSCRIPT_HIT_COLUMNS } from '../../../src/transcripts/transcript-hits-grid';
import { PARTICIPANT_COLUMNS } from '../../../src/participants/participants-grid';
import { firstJoined, lastLeft } from '../../../src/participants/participant-attendance';
import { cellText, columnOf } from '../grid-helpers';
import { STARTED, makeMeeting, makeParticipant } from '../fixtures';

describe('MEETING_COLUMNS', () => {
  const row = makeMeeting();

  it('has the register columns in order, ending with open and delete', () => {
    expect(MEETING_COLUMNS.map((column) => column.headerName)).toEqual([
      'Meeting Title',
      'Date',
      'Duration',
      'Organizer',
      'Participants',
      'Transcript Status',
      'AI Summary Status',
      'Action Items',
      'Email Status',
      '',
    ]);
  });

  it('writes the derived cells', () => {
    expect(cellText(columnOf(MEETING_COLUMNS, 'startedAt'), row)).toBe(`at ${STARTED}`);
    expect(cellText(columnOf(MEETING_COLUMNS, 'durationSeconds'), row)).toBe('45m');
    expect(cellText(columnOf(MEETING_COLUMNS, 'participantCount'), row)).toBe('4');
    expect(cellText(columnOf(MEETING_COLUMNS, 'actionItemCount'), row)).toBe('2 open of 3');
  });
});

describe('TRANSCRIPT_HIT_COLUMNS', () => {
  const hit = {
    id: 'h1',
    meetingId: 'meeting-1',
    meetingTitle: 'Weekly sync',
    meetingStartedAt: STARTED,
    startMs: 61_000,
    text: 'pricing',
    speakerLabel: null,
    source: MaTranscriptSource.Ai,
  };

  it('writes the offset and an honest unknown speaker', () => {
    expect(cellText(columnOf(TRANSCRIPT_HIT_COLUMNS, 'startMs'), hit)).toBe('1:01');
    expect(cellText(columnOf(TRANSCRIPT_HIT_COLUMNS, 'speakerLabel'), hit)).toBe('Unknown speaker');
    expect(
      cellText(columnOf(TRANSCRIPT_HIT_COLUMNS, 'speakerLabel'), {
        ...hit,
        speakerLabel: 'Speaker 2',
      }),
    ).toBe('Speaker 2');
    expect(cellText(columnOf(TRANSCRIPT_HIT_COLUMNS, 'meetingStartedAt'), hit)).toBe(
      `at ${STARTED}`,
    );
  });
});

describe('PARTICIPANT_COLUMNS', () => {
  it('marks names read off the Meet window as a best effort with their confidence', () => {
    const confidence = columnOf(PARTICIPANT_COLUMNS, 'confidence');
    expect(cellText(confidence, makeParticipant())).toBe('Verified');
    expect(
      cellText(
        confidence,
        makeParticipant({ source: MaParticipantSource.MeetUi, confidence: 0.62 }),
      ),
    ).toBe('Best effort · 62%');
  });

  it('writes time in call, rejoins and an unverified email', () => {
    const row = makeParticipant({ email: null, rejoinCount: 2 });
    expect(cellText(columnOf(PARTICIPANT_COLUMNS, 'totalSeconds'), row)).toBe('40m');
    expect(cellText(columnOf(PARTICIPANT_COLUMNS, 'rejoinCount'), row)).toBe('2');
    expect(cellText(columnOf(PARTICIPANT_COLUMNS, 'email'), row)).toBe('Not verified');
    expect(cellText(columnOf(PARTICIPANT_COLUMNS, 'email'), makeParticipant())).toBe(
      'ravi@example.com',
    );
  });
});

describe('participant attendance', () => {
  it('reads the first join and the last leave', () => {
    const row = makeParticipant({
      sessions: [
        { joinedAt: STARTED, leftAt: '2026-10-20T09:10:00.000Z' },
        { joinedAt: '2026-10-20T09:20:00.000Z', leftAt: null },
      ],
    });
    expect(firstJoined(row)).toBe(STARTED);
    expect(lastLeft(row)).toBeUndefined();
    expect(lastLeft(makeParticipant())).toBe('2026-10-20T09:40:00.000Z');
  });

  it('has neither before any session was seen', () => {
    const row = makeParticipant({ sessions: [] });
    expect(firstJoined(row)).toBeUndefined();
    expect(lastLeft(row)).toBeUndefined();
  });
});
