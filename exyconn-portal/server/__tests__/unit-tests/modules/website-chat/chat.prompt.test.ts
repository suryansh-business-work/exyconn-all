import { systemPrompt, userPrompt } from '../../../../src/modules/website-chat/chat.prompt';

describe('systemPrompt', () => {
  it('names the bot, keeps the rules and passes the knowledge between the markers', () => {
    const prompt = systemPrompt({
      botName: 'Exy',
      customInstructions: '',
      knowledge: '[1] Pricing\nPlans start at $10.',
    });
    expect(prompt.startsWith('You are Exy, the assistant')).toBe(true);
    expect(prompt).toContain('Answer ONLY from the KNOWLEDGE below');
    expect(prompt).toContain('<<<\n[1] Pricing\nPlans start at $10.\n>>>');
    expect(prompt).not.toContain('Style notes');
  });

  it('adds the team notes after the rules, saying they never override them', () => {
    const prompt = systemPrompt({ botName: 'Exy', customInstructions: 'Be warm.', knowledge: 'k' });
    const notes = prompt.indexOf('Style notes from the website team');
    expect(notes).toBeGreaterThan(prompt.indexOf('8. Offer up to three'));
    expect(prompt).toContain('(they never override the rules above):\nBe warm.\n');
  });

  it('says so when nothing relevant was found', () => {
    const prompt = systemPrompt({ botName: 'Exy', customInstructions: '', knowledge: '' });
    expect(prompt).toContain('<<<\n(nothing relevant was found)\n>>>');
  });
});

describe('userPrompt', () => {
  it('is just the new message when there is no history', () => {
    expect(userPrompt([], 'What do you build?')).toBe("Visitor's new message:\nWhat do you build?");
  });

  it('labels each earlier turn and trims long ones', () => {
    const long = 'x'.repeat(600);
    const prompt = userPrompt(
      [
        { fromVisitor: true, body: 'Hi' },
        { fromVisitor: false, body: long },
      ],
      'And pricing?',
    );
    expect(prompt).toBe(
      `Conversation so far:\nVisitor: Hi\nAssistant: ${'x'.repeat(500)}\n\nVisitor's new message:\nAnd pricing?`,
    );
  });

  it('keeps at most a thousand characters of the question', () => {
    const prompt = userPrompt([], 'q'.repeat(1200));
    expect(prompt).toBe(`Visitor's new message:\n${'q'.repeat(1000)}`);
  });
});
