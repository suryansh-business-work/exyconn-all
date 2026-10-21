import { openAiClient } from '../../../../src/utils/openai';
import {
  formatLines,
  parseAnalysis,
  systemPrompt,
  userPrompt,
  type Analysis,
} from '../../../../src/modules/meeting-assistant/analysis.prompt';
import {
  analyseMeeting,
  windows,
  type AnalysisRun,
  type SourceLine,
} from '../../../../src/modules/meeting-assistant/analysis.service';
import {
  fingerprint,
  parsedDue,
  saveActionItems,
  saveDecisions,
  saveNotes,
} from '../../../../src/modules/meeting-assistant/analysis.persist';
import {
  MaActionItemModel,
  MaDecisionModel,
  MaNotesModel,
  MaParticipantModel,
  MaSegmentModel,
} from '../../../../src/modules/meeting-assistant/models';
import { ROLES } from '../../../../src/constants/roles';
import {
  actorNamed,
  seedAccount,
  seedMeeting,
  seedOpenAiConfig,
  type LeanMeeting,
} from './ma.fixtures';

jest.mock('../../../../src/utils/openai', () => ({
  ...jest.requireActual('../../../../src/utils/openai'),
  openAiClient: { complete: jest.fn() },
}));

const complete = openAiClient.complete as jest.Mock;

const owner = actorNamed('Asha');

const EMPTY: Analysis = {
  overview: '',
  executiveSummary: '',
  agenda: [],
  discussionPoints: [],
  risks: [],
  blockers: [],
  openQuestions: [],
  followUps: [],
  nextTopics: [],
  decisions: [],
  actionItems: [],
};

const reply = (analysis: Partial<Analysis>, tokens = 10) => ({
  text: JSON.stringify({ ...EMPTY, ...analysis }),
  promptTokens: tokens,
  completionTokens: tokens / 2,
  totalTokens: tokens * 1.5,
});

const line = (n: number, speaker: string, text: string): SourceLine => ({
  n,
  startMs: n * 1000,
  speaker,
  text,
  segmentId: `segment-${n}`,
  speakerLabel: speaker,
});

const runOf = (analysis: Partial<Analysis>, lines: SourceLine[]): AnalysisRun => ({
  analysis: { ...EMPTY, ...analysis },
  lines,
  model: 'gpt-4o',
  usage: { promptTokens: 100, completionTokens: 50 },
  costUsd: 0.01,
});

type ActionInput = Analysis['actionItems'][number];
const action = (overrides: Partial<ActionInput>): ActionInput => ({
  title: 'Send the deck',
  description: '',
  owner: null,
  dueDate: null,
  dueText: null,
  priority: 'MEDIUM',
  evidence: [0],
  confidence: 0.8,
  ...overrides,
});

const segment = (meeting: LeanMeeting, overrides: Record<string, unknown>) =>
  MaSegmentModel.create({
    meetingId: String(meeting._id),
    source: 'AI',
    stream: 'TAB',
    chunkSeq: 0,
    index: 0,
    startMs: 0,
    endMs: 1000,
    text: 'hello',
    ...overrides,
  });

describe('parseAnalysis', () => {
  it('refuses anything that is not the JSON object asked for', () => {
    expect(parseAnalysis('Here are your notes!')).toBeNull();
    expect(parseAnalysis('[1, 2]')).toBeNull();
  });

  it('coerces malformed fields instead of trusting them', () => {
    const parsed = parseAnalysis(
      JSON.stringify({
        overview: 5,
        agenda: 'one long string',
        risks: ['  real risk  ', ''],
        decisions: [{ text: '', evidence: [1] }],
        actionItems: [
          {
            title: 'Ship it',
            owner: '',
            priority: 'URGENT',
            dueDate: 'Friday',
            evidence: [-1, 2],
            confidence: 7,
          },
        ],
      }),
    );

    expect(parsed).toMatchObject({ overview: '', agenda: [], risks: [], decisions: [] });
    expect(parsed?.actionItems).toEqual([
      {
        title: 'Ship it',
        description: '',
        owner: null,
        dueDate: null,
        dueText: null,
        priority: 'MEDIUM',
        evidence: [],
        confidence: 0.5,
      },
    ]);
  });
});

describe('prompts', () => {
  it('numbers each line with its clock time and speaker', () => {
    expect(
      formatLines([line(0, 'Asha', 'Hi'), { ...line(1, 'Ravi', 'Hello'), startMs: 3_723_000 }]),
    ).toBe('[0] 00:00:00 Asha: Hi\n[1] 01:02:03 Ravi: Hello');
  });

  it('carries the style and, for a long meeting, which part this is', () => {
    expect(systemPrompt('STANDUP')).toContain('daily stand-up');
    const prompt = userPrompt(
      {
        title: '',
        date: '2026-10-20',
        timezone: 'UTC',
        participants: [],
        part: { index: 2, total: 3 },
      },
      [line(0, 'Asha', 'Hi')],
    );
    expect(prompt).toContain('Untitled meeting');
    expect(prompt).toContain('Not specified');
    expect(prompt).toContain('part 2 of 3');
  });
});

describe('windows', () => {
  it('never splits a line and keeps every window within the limit', () => {
    const lines = [10, 10, 10, 10].map((size, n) => line(n, 'A', 'x'.repeat(size)));
    // Each line costs 10 + 1 + 16 = 27 characters.
    const parts = windows(lines, 60);

    expect(parts.map((part) => part.map((l) => l.n))).toEqual([
      [0, 1],
      [2, 3],
    ]);
    expect(parts.flat()).toEqual(lines);
  });

  it('gives a line longer than the limit a window of its own', () => {
    const lines = [line(0, 'A', 'x'.repeat(100)), line(1, 'A', 'short')];

    expect(windows(lines, 50).map((part) => part.length)).toEqual([1, 1]);
    expect(windows([], 50)).toEqual([]);
  });
});

describe('analyseMeeting', () => {
  beforeEach(async () => {
    await seedOpenAiConfig();
  });

  it('refuses to summarise a meeting with no transcript', async () => {
    const meeting = await seedMeeting(owner);

    await expect(analyseMeeting(meeting, 'DETAILED', 'gpt-4o')).rejects.toThrow(
      'There is no transcript to summarise.',
    );
    expect(complete).not.toHaveBeenCalled();
  });

  it('prefers Google’s official transcript and names confirmed speakers', async () => {
    const meeting = await seedMeeting(owner, {
      speakerMappings: [
        {
          label: 'Speaker A',
          name: 'Neha',
          confirmedById: owner.id,
          confirmedAt: new Date(),
        },
      ],
    });
    await segment(meeting, { text: 'ai version', speakerLabel: 'Speaker A' });
    await segment(meeting, {
      source: 'GOOGLE_MEET',
      stream: 'MEET',
      text: 'official version',
      speakerLabel: 'Speaker A',
    });
    complete.mockResolvedValue(reply({ overview: 'Short call' }));

    const run = await analyseMeeting(meeting, 'SHORT', 'gpt-4o');

    expect(run.lines).toHaveLength(1);
    expect(run.lines[0]).toMatchObject({ text: 'official version', speaker: 'Neha' });
    const request = complete.mock.calls[0][0] as { prompt: string; json: boolean; model: string };
    expect(request.prompt).toContain('Neha: official version');
    expect(request.prompt).not.toContain('ai version');
    expect(request).toMatchObject({ json: true, model: 'gpt-4o' });
    expect(run.analysis.overview).toBe('Short call');
  });

  it('asks once more with a JSON reminder, then accepts a valid reply', async () => {
    const meeting = await seedMeeting(owner);
    await segment(meeting, {});
    complete
      .mockResolvedValueOnce({
        text: 'Sure! Here are the notes',
        promptTokens: 7,
        completionTokens: 3,
        totalTokens: 10,
      })
      .mockResolvedValueOnce(reply({ overview: 'ok' }, 10));

    const run = await analyseMeeting(meeting, 'DETAILED', 'gpt-4o');

    expect(complete).toHaveBeenCalledTimes(2);
    expect((complete.mock.calls[1][0] as { prompt: string }).prompt).toMatch(
      /Reply with the JSON object only\.$/,
    );
    expect(run.usage).toEqual({ promptTokens: 17, completionTokens: 8 });
  });

  it('gives up after the one reminder when the reply is still not JSON', async () => {
    const meeting = await seedMeeting(owner);
    await segment(meeting, {});
    complete.mockResolvedValue({
      text: 'nope',
      promptTokens: 1,
      completionTokens: 1,
      totalTokens: 2,
    });

    await expect(analyseMeeting(meeting, 'DETAILED', 'gpt-4o')).rejects.toThrow(
      'The AI did not return valid meeting notes.',
    );
    expect(complete).toHaveBeenCalledTimes(2);
  });

  it('analyses a long meeting in windows with global line numbers, then merges them', async () => {
    const meeting = await seedMeeting(owner);
    await Promise.all(
      [0, 1, 2].map((index) =>
        segment(meeting, {
          chunkSeq: index,
          startMs: index * 1000,
          text: `${index}`.repeat(19_000),
        }),
      ),
    );
    complete
      .mockResolvedValueOnce(
        reply({ decisions: [{ text: 'First', evidence: [0], confidence: 1 }] }),
      )
      .mockResolvedValueOnce(
        reply({ decisions: [{ text: 'Second', evidence: [2], confidence: 1 }] }),
      )
      .mockResolvedValueOnce(
        reply({
          overview: 'Merged',
          decisions: [{ text: 'Ignored', evidence: [0], confidence: 1 }],
        }),
      );

    const run = await analyseMeeting(meeting, 'DETAILED', 'gpt-4o');

    expect(complete).toHaveBeenCalledTimes(3);
    const prompts = complete.mock.calls.map((call) => (call[0] as { prompt: string }).prompt);
    expect(prompts[0]).toContain('part 1 of 2');
    expect(prompts[1]).toContain('part 2 of 2');
    expect(prompts[1]).toContain('[2] ');
    expect(prompts[2]).toContain('Combine them');
    expect(run.analysis.overview).toBe('Merged');
    expect(run.analysis.decisions.map((d) => d.text)).toEqual(['First', 'Second']);
  });
});

describe('saving notes', () => {
  it('keeps the previous version in the history on a regenerate', async () => {
    const meeting = await seedMeeting(owner);

    const first = await saveNotes(meeting, runOf({ overview: 'v1' }, []), 'DETAILED');
    const second = await saveNotes(meeting, runOf({ overview: 'v2' }, []), 'SHORT');

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    const stored = await MaNotesModel.findOne({ meetingId: String(meeting._id) }).lean();
    expect(stored).toMatchObject({ version: 2, style: 'SHORT', edited: false });
    expect(stored?.content.overview).toBe('v2');
    expect(stored?.revisions.map((r) => [r.version, r.content.overview, r.byName])).toEqual([
      [1, 'v1', 'Meeting Assistant'],
    ]);
  });

  it('keeps decisions only with real evidence, updating the same row on a regenerate', async () => {
    const meeting = await seedMeeting(owner);
    const lines = [line(0, 'Asha', 'We agreed to launch on Monday')];

    await saveDecisions(
      meeting,
      runOf(
        {
          decisions: [
            { text: 'Launch on Monday.', evidence: [0, 0, 7], confidence: 0.9 },
            { text: 'Hire a designer', evidence: [42], confidence: 0.9 },
          ],
        },
        lines,
      ),
    );
    await saveDecisions(
      meeting,
      runOf({ decisions: [{ text: 'launch on monday', evidence: [0], confidence: 0.6 }] }, lines),
    );

    const rows = await MaDecisionModel.find({ meetingId: String(meeting._id) }).lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ text: 'launch on monday', confidence: 0.6 });
    expect(rows[0].evidence).toEqual([
      {
        segmentId: 'segment-0',
        quote: 'We agreed to launch on Monday',
        startMs: 0,
        speakerLabel: 'Asha',
      },
    ]);
  });
  it('saves a decision reported twice in one run (two transcript windows) once', async () => {
    const meeting = await seedMeeting(owner);
    const lines = [line(0, 'Asha', 'Launch Monday'), line(1, 'Ravi', 'Agreed, Monday')];
    const twice = [
      { text: 'Launch on Monday', evidence: [0], confidence: 0.7 },
      { text: 'launch on monday.', evidence: [1], confidence: 0.9 },
    ];

    await saveDecisions(meeting, runOf({ decisions: twice }, lines));

    expect(await MaDecisionModel.countDocuments({ meetingId: String(meeting._id) })).toBe(1);
  });
});

describe('saving action items', () => {
  const lines = [line(0, 'Asha', 'I will send the deck by Friday'), line(1, 'Ravi', 'Sounds good')];

  it('drops items whose evidence cites lines that do not exist', async () => {
    const meeting = await seedMeeting(owner);

    const saved = await saveActionItems(
      meeting,
      runOf({ actionItems: [action({ evidence: [9] })] }, lines),
      [],
    );

    expect(saved).toBe(0);
    expect(await MaActionItemModel.countDocuments()).toBe(0);
  });

  it('never invents an owner the transcript and the call do not name', async () => {
    const meeting = await seedMeeting(owner);

    await saveActionItems(meeting, runOf({ actionItems: [action({ owner: 'Zed' })] }, lines), [
      'Ravi',
    ]);

    const row = await MaActionItemModel.findOne().lean();
    expect(row).toMatchObject({
      assignedTo: null,
      assignedUserId: null,
      needsConfirmation: false,
      aiGenerated: true,
      createdById: 'system',
      viewerIds: [owner.id],
      sourceTimestampMs: 0,
    });
  });

  it('assigns an owner confirmed as a speaker to their portal account, citing at most five lines', async () => {
    const colleague = await seedAccount('Ravi', [ROLES.EMPLOYEE]);
    const meeting = await seedMeeting(owner, {
      speakerMappings: [
        {
          label: 'Speaker B',
          name: 'Ravi',
          userId: colleague.id,
          confirmedById: owner.id,
          confirmedAt: new Date(),
        },
      ],
    });
    const many = Array.from({ length: 7 }, (_, n) => line(n, 'Ravi', `point ${n}`));

    await saveActionItems(
      meeting,
      runOf({ actionItems: [action({ owner: 'Ravi', evidence: [0, 1, 2, 3, 4, 5, 6] })] }, many),
      [],
    );

    const row = await MaActionItemModel.findOne().lean();
    expect(row).toMatchObject({ assignedUserId: colleague.id, assignedEmail: colleague.email });
    expect(row?.evidence).toHaveLength(5);
  });

  it('assigns a named owner, verified only through a portal account, and asks to confirm it', async () => {
    const meeting = await seedMeeting(owner);
    await MaParticipantModel.create({
      meetingId: String(meeting._id),
      key: `user:${owner.id}`,
      displayName: 'Asha',
      email: owner.email,
      userId: owner.id,
      source: 'EXTENSION_USER',
    });

    await saveActionItems(
      meeting,
      runOf(
        { actionItems: [action({ owner: 'asha', dueDate: '2026-10-23', dueText: 'by Friday' })] },
        lines,
      ),
      ['Asha'],
    );

    const row = await MaActionItemModel.findOne().lean();
    expect(row).toMatchObject({
      assignedTo: 'asha',
      assignedUserId: owner.id,
      assignedEmail: owner.email,
      dueText: 'by Friday',
      needsConfirmation: true,
    });
    expect(row?.dueDate).toEqual(new Date('2026-10-23T00:00:00.000Z'));
  });

  it('turns an impossible due date into none, keeping the words that were said', async () => {
    expect(parsedDue('2026-02-30')).toBeNull();
    expect(parsedDue(null)).toBeNull();
    const meeting = await seedMeeting(owner);

    await saveActionItems(
      meeting,
      runOf({ actionItems: [action({ dueDate: '2026-02-30', dueText: 'end of Feb' })] }, lines),
      [],
    );

    expect(await MaActionItemModel.findOne().lean()).toMatchObject({
      dueDate: null,
      dueText: 'end of Feb',
      needsConfirmation: true,
    });
  });

  it('updates the same row on a regenerate, never what a person edited or the status', async () => {
    const meeting = await seedMeeting(owner);
    await saveActionItems(meeting, runOf({ actionItems: [action({})] }, lines), []);
    await MaActionItemModel.updateOne(
      {},
      { $set: { assignedTo: 'Manual owner', editedFields: ['assignedTo'], status: 'COMPLETED' } },
    );

    await saveActionItems(
      meeting,
      runOf(
        { actionItems: [action({ title: 'SEND the deck!', owner: 'Ravi', priority: 'HIGH' })] },
        lines,
      ),
      ['Ravi'],
    );

    const rows = await MaActionItemModel.find().lean();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      title: 'Send the deck',
      fingerprint: fingerprint('send the deck'),
      assignedTo: 'Manual owner',
      status: 'COMPLETED',
      priority: 'HIGH',
    });
  });

  it('saves one row for the same item reported twice in one run', async () => {
    const meeting = await seedMeeting(owner);
    const twice = [action({}), action({ title: 'send the deck.', evidence: [1] })];

    expect(await saveActionItems(meeting, runOf({ actionItems: twice }, lines), [])).toBe(1);
    expect(await MaActionItemModel.countDocuments()).toBe(1);
  });

  it('gives the same fingerprint to the same words whatever the case or punctuation', () => {
    expect(fingerprint('Send   the deck!')).toBe(fingerprint('send the DECK'));
    expect(fingerprint('Send the deck')).not.toBe(fingerprint('Send the decks'));
  });
});
