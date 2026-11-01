import {
  scoreFromFacts,
  type DealFacts,
} from '../../../../../src/modules/crm/deal-score/deal-score.signals';

/** A deal that has just moved into Proposal and had one activity today. */
const facts = (extra: Partial<DealFacts> = {}): DealFacts => ({
  stage: 'PROPOSAL',
  daysInStage: 20,
  daysSinceActivity: 10,
  activitiesLast30Days: 1,
  overdueTasks: 0,
  emailsInLast30Days: 0,
  emailsOutLast30Days: 0,
  closeDatePassed: false,
  ...extra,
});

describe('scoreFromFacts', () => {
  it('scores a won deal 100 and a lost one 0, whatever else is true', () => {
    expect(scoreFromFacts(facts({ stage: 'WON', overdueTasks: 9 }))).toEqual({
      score: 100,
      reasons: [{ text: 'Deal won', impact: 100 }],
    });
    expect(scoreFromFacts(facts({ stage: 'LOST', emailsInLast30Days: 9 }))).toEqual({
      score: 0,
      reasons: [{ text: 'Deal lost', impact: 0 }],
    });
  });

  it.each([
    ['QUALIFYING', 15],
    ['DISCOVERY', 30],
    ['PROPOSAL', 50],
    ['NEGOTIATION', 65],
    ['SOMETHING_NEW', 0],
  ])('starts a %s deal at %i points', (stage, base) => {
    const { reasons } = scoreFromFacts(facts({ stage }));

    expect(reasons[0]).toEqual({ text: `${stage} stage`, impact: base });
  });

  it('marks down a deal with no activity at all', () => {
    expect(scoreFromFacts(facts({ daysSinceActivity: null, activitiesLast30Days: 0 }))).toEqual({
      score: 40,
      reasons: [
        { text: 'PROPOSAL stage', impact: 50 },
        { text: 'No activity logged yet', impact: -10 },
      ],
    });
  });

  it.each([
    [0, 'Activity in the last 7 days', 10],
    [7, 'Activity in the last 7 days', 10],
    [8, 'Last activity 8 days ago', 5],
    [30, 'Last activity 30 days ago', 5],
    [31, 'No activity for 31 days', -10],
  ])('reads activity %i day(s) ago as "%s"', (days, text, impact) => {
    expect(scoreFromFacts(facts({ daysSinceActivity: days })).reasons).toContainEqual({
      text,
      impact,
    });
  });

  it.each([
    [0, { text: 'Moved into this stage 0 day(s) ago', impact: 5 }],
    [14, { text: 'Moved into this stage 14 day(s) ago', impact: 5 }],
    [31, { text: '31 days in this stage', impact: -10 }],
    [60, { text: '60 days in this stage', impact: -10 }],
    [61, { text: 'Stalled: 61 days in this stage', impact: -20 }],
    [900, { text: 'Stalled: 900 days in this stage', impact: -20 }],
  ])('weighs %i days in the stage', (days, reason) => {
    expect(scoreFromFacts(facts({ daysInStage: days })).reasons).toContainEqual(reason);
  });

  it('says nothing about a stage age between fresh and stuck', () => {
    for (const days of [15, 30]) {
      const texts = scoreFromFacts(facts({ daysInStage: days })).reasons.map((r) => r.text);
      expect(texts.some((t) => t.includes('stage') && t !== 'PROPOSAL stage')).toBe(false);
    }
  });

  it('rewards three or more activities in the month and not two', () => {
    expect(scoreFromFacts(facts({ activitiesLast30Days: 3 })).reasons).toContainEqual({
      text: '3 activities in the last 30 days',
      impact: 5,
    });
    expect(
      scoreFromFacts(facts({ activitiesLast30Days: 2 })).reasons.some((r) =>
        r.text.includes('activities in the last'),
      ),
    ).toBe(false);
  });

  it('takes 5 points per overdue task, at most 15', () => {
    expect(scoreFromFacts(facts({ overdueTasks: 2 })).reasons).toContainEqual({
      text: '2 overdue task(s)',
      impact: -10,
    });
    expect(scoreFromFacts(facts({ overdueTasks: 7 })).reasons).toContainEqual({
      text: '7 overdue task(s)',
      impact: -15,
    });
  });

  it('rewards mail from the contact, capped, and penalises mail that goes unanswered', () => {
    expect(scoreFromFacts(facts({ emailsInLast30Days: 1 })).reasons).toContainEqual({
      text: '1 email(s) from the contact in the last 30 days',
      impact: 5,
    });
    expect(
      scoreFromFacts(facts({ emailsInLast30Days: 10, emailsOutLast30Days: 10 })).reasons,
    ).toContainEqual({ text: '10 email(s) from the contact in the last 30 days', impact: 15 });
    expect(scoreFromFacts(facts({ emailsOutLast30Days: 2 })).reasons).toContainEqual({
      text: '2 emails sent without a reply',
      impact: -5,
    });
    expect(
      scoreFromFacts(facts({ emailsOutLast30Days: 1 })).reasons.some((r) =>
        r.text.includes('email'),
      ),
    ).toBe(false);
  });

  it('marks down a deal past its expected close date', () => {
    expect(scoreFromFacts(facts({ closeDatePassed: true })).reasons).toContainEqual({
      text: 'The expected close date has passed',
      impact: -10,
    });
  });

  it('lists the stage first, then the signals by size of effect, and adds them up', () => {
    const result = scoreFromFacts(
      facts({
        daysInStage: 3,
        daysSinceActivity: 1,
        activitiesLast30Days: 4,
        overdueTasks: 1,
        emailsInLast30Days: 2,
      }),
    );

    expect(result).toEqual({
      score: 75,
      reasons: [
        { text: 'PROPOSAL stage', impact: 50 },
        { text: 'Activity in the last 7 days', impact: 10 },
        { text: '2 email(s) from the contact in the last 30 days', impact: 10 },
        { text: 'Moved into this stage 3 day(s) ago', impact: 5 },
        { text: '4 activities in the last 30 days', impact: 5 },
        { text: '1 overdue task(s)', impact: -5 },
      ],
    });
  });

  it('never scores an open deal below 0 or above 100', () => {
    const worst = scoreFromFacts(
      facts({
        stage: 'QUALIFYING',
        daysInStage: 400,
        daysSinceActivity: 400,
        overdueTasks: 10,
        emailsOutLast30Days: 5,
        closeDatePassed: true,
      }),
    );
    const best = scoreFromFacts(
      facts({
        stage: 'NEGOTIATION',
        daysInStage: 1,
        daysSinceActivity: 0,
        activitiesLast30Days: 20,
        emailsInLast30Days: 20,
      }),
    );

    expect(worst.score).toBe(0);
    expect(best.score).toBe(100);
  });
});
