import {
  MAX_BATCH,
  MAX_SUBJECT_CHARS,
  coldEmailPrompt,
  parseColdEmailBrief,
  parseColdEmails,
} from '../../../../../src/modules/crm/cold-email/cold-email.prompt';

const prompt = (count?: number, offering = '') =>
  coldEmailPrompt({
    senderName: 'Asha',
    organizationName: 'Exyconn',
    recipientName: 'Ravi',
    context: 'Company: Acme',
    offering,
    goal: 'our checkout software',
    tone: 'BRIEF',
    instruction: '',
    earlierSubjects: ['First try', 'Second try'],
    count,
  });

const reply = (items: unknown[]) => JSON.stringify({ versions: items });

describe('the multi-version prompt', () => {
  it('asks for one version in the batch format when no count is given', () => {
    const text = prompt();

    expect(text).toContain('Answer with JSON only, exactly {"brief": {"about": ');
    expect(text).toContain('"versions": [{"subject": "...", "body": "..."}]}, and nothing else.');
    expect(text).not.toContain('What we offer, from our own website:');
    expect(text).not.toContain('Say which of what we offer fits them');
    expect(text).not.toContain('- Version 1');
    expect(text).toContain('earlier versions: First try | Second try');
  });

  it('spreads a batch over that many different angles, at most four', () => {
    const text = prompt(MAX_BATCH);

    expect(MAX_BATCH).toBe(4);
    expect(text).toContain('Write 4 clearly different versions of it. Each version:');
    expect(text).toContain('- Version 1 opens with something specific about them');
    expect(text).toContain('- Version 4 is the shortest, built around one simple question.');
    expect(text).toContain('with 4 versions, and nothing else.');
  });

  it('gives the model what we offer that fits them, from our own website', () => {
    const text = prompt(1, '[1] Checkout audits\nWe find where carts are dropped.');

    expect(text).toContain('Say which of what we offer fits them and why');
    expect(text).toContain('What we offer, from our own website:\n[1] Checkout audits');
  });
});

describe('parseColdEmailBrief', () => {
  it('reads what the AI made of them, trimmed', () => {
    const response = JSON.stringify({
      brief: { about: ' Acme sells shoes online. ', fit: [' Checkout audit: carts are dropped '] },
      versions: [],
    });

    expect(parseColdEmailBrief(response)).toEqual({
      about: 'Acme sells shoes online.',
      fit: ['Checkout audit: carts are dropped'],
    });
  });

  it.each([
    ['no brief', '{"versions": []}'],
    ['a brief in the wrong shape', '{"brief": {"about": 42, "fit": "x"}}'],
    ['no JSON', 'Here you go'],
  ])('reads none from %s', (_case, response) => {
    expect(parseColdEmailBrief(response)).toBeNull();
  });
});

describe('parseColdEmails', () => {
  it('reads every version, trimmed, even inside code fences', () => {
    const response = `\`\`\`json\n${reply([
      { subject: ' One ', body: ' Hello. ' },
      { subject: 'Two', body: 'Hi.' },
    ])}\n\`\`\``;

    expect(parseColdEmails(response)).toEqual([
      { subject: 'One', body: 'Hello.' },
      { subject: 'Two', body: 'Hi.' },
    ]);
  });

  it('drops a version that is blank, too long, not text or still has a placeholder', () => {
    const response = reply([
      { subject: '', body: 'Hello.' },
      { subject: 'x'.repeat(MAX_SUBJECT_CHARS + 1), body: 'Hello.' },
      { subject: 'Hi', body: 42 },
      'just a string',
      { subject: 'Dear [Name]', body: 'Hello.' },
      { subject: 'Hi', body: 'Thanks, {{sender}}' },
      { subject: 'Kept', body: 'Hello.' },
    ]);

    expect(parseColdEmails(response)).toEqual([{ subject: 'Kept', body: 'Hello.' }]);
  });

  it.each([
    ['no JSON at all', 'Sure! Here is your email.'],
    ['broken JSON', '{"versions": [ {"subject": "Hi" }'],
    ['JSON that is not a batch', '{"subject": "Hi", "body": "Hello."}'],
    ['an empty batch', '{"versions": []}'],
    ['a closing brace before the opening one', '} {'],
  ])('reads nothing from %s', (_case, response) => {
    expect(parseColdEmails(response)).toHaveLength(0);
  });
});
