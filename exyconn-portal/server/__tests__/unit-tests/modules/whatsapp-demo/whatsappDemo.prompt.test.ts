import {
  SYSTEM_PROMPT,
  answerSchema,
  pickAnswer,
  userPrompt,
  type ParseEntity,
  type ParseIntent,
} from '../../../../src/modules/whatsapp-demo/whatsappDemo.prompt';

const KOLKATA = 'Asia/Kolkata';

const intents: ParseIntent[] = [
  { id: 'book', description: 'Wants to book' },
  { id: 'cancel', description: 'Wants to cancel' },
];

const entities: ParseEntity[] = [
  { name: 'name', kind: 'text', description: 'Their name' },
  { name: 'guests', kind: 'number', description: 'How many people' },
  { name: 'when', kind: 'datetime', description: 'When they come' },
  { name: 'day', kind: 'date', description: 'Which day' },
];

describe('the prompt the model is sent', () => {
  it('asks for JSON only, in English, Hindi or Hinglish', () => {
    expect(SYSTEM_PROMPT).toContain('return JSON only');
    expect(SYSTEM_PROMPT).toContain('Hinglish');
  });

  it('carries the clock, zone, choices and message as one JSON object', () => {
    const prompt = userPrompt('kal 4 log', intents, entities, 'Monday 2026-10-05 17:00', KOLKATA);
    expect(JSON.parse(prompt)).toEqual({
      now: 'Monday 2026-10-05 17:00',
      timezone: KOLKATA,
      intents,
      entities,
      message: 'kal 4 log',
    });
  });
});

describe("the model's answer", () => {
  it('may leave every part out', () => {
    expect(answerSchema.safeParse({}).success).toBe(true);
  });

  it('must keep each part to its shape', () => {
    expect(answerSchema.safeParse({ intent: 5 }).success).toBe(false);
    expect(answerSchema.safeParse({ entities: 'name' }).success).toBe(false);
  });
});

describe('reducing the answer to what was asked for', () => {
  it('keeps an intent that was offered', () => {
    expect(pickAnswer({ intent: 'book' }, intents, entities, KOLKATA).intent).toBe('book');
  });

  it('drops an intent that was not offered, or none', () => {
    expect(pickAnswer({ intent: 'refund' }, intents, entities, KOLKATA).intent).toBeNull();
    expect(pickAnswer({ intent: null }, intents, entities, KOLKATA).intent).toBeNull();
    expect(pickAnswer({}, intents, entities, KOLKATA)).toEqual({ intent: null, entities: {} });
  });

  it('keeps offered entities as trimmed strings and drops the rest', () => {
    const picked = pickAnswer(
      { entities: { name: '  Rahul ', guests: 4, colour: 'red' } },
      intents,
      entities,
      KOLKATA,
    );
    expect(picked.entities).toEqual({ name: 'Rahul', guests: '4' });
  });

  it('drops blank values and values that are not text or a number', () => {
    const picked = pickAnswer(
      { entities: { name: '   ', guests: { count: 4 }, when: true } },
      intents,
      entities,
      KOLKATA,
    );
    expect(picked.entities).toEqual({});
  });

  it('cuts a value to 200 characters', () => {
    const picked = pickAnswer({ entities: { name: 'x'.repeat(250) } }, intents, entities, KOLKATA);
    expect(picked.entities.name).toHaveLength(200);
  });

  it('adds the epoch beside a date or time it can read', () => {
    const picked = pickAnswer(
      {
        entities: { when: 'Tue, 6 Oct, 5:00 PM', day: 'Tue, 6 Oct' },
        datetimes: { when: '2026-10-06T17:00', day: '2026-10-06T00:00' },
      },
      intents,
      entities,
      KOLKATA,
    );
    expect(picked.entities).toEqual({
      when: 'Tue, 6 Oct, 5:00 PM',
      whenMs: String(Date.UTC(2026, 9, 6, 11, 30)),
      day: 'Tue, 6 Oct',
      dayMs: String(Date.UTC(2026, 9, 5, 18, 30)),
    });
  });

  it('adds no epoch for an unreadable date, a non-text date or an untimed kind', () => {
    const picked = pickAnswer(
      {
        entities: { when: 'soon', day: 'Tue', name: 'Rahul' },
        datetimes: { when: 'soonish', day: 20261006, name: '2026-10-06T00:00' },
      },
      intents,
      entities,
      KOLKATA,
    );
    expect(picked.entities).toEqual({ when: 'soon', day: 'Tue', name: 'Rahul' });
  });
});
