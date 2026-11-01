/**
 * The deal score's rules, kept pure so they read as a table: each signal turns one fact about a
 * deal into points and a sentence saying why. The score is the stage's starting points plus
 * every signal, clamped to 0-100. Scoring configuration, not business data.
 */

export interface ScoreReason {
  text: string;
  impact: number;
}

/** What the scorer reads about one deal, gathered by deal-score.service. */
export interface DealFacts {
  stage: string;
  daysInStage: number;
  /** Days since anything was logged on the deal, its contact or its company; null for never. */
  daysSinceActivity: number | null;
  activitiesLast30Days: number;
  overdueTasks: number;
  emailsInLast30Days: number;
  emailsOutLast30Days: number;
  closeDatePassed: boolean;
}

/** Where an open deal starts: the further down the pipeline, the closer to a signature. */
const STAGE_POINTS: Readonly<Record<string, number>> = {
  QUALIFYING: 15,
  DISCOVERY: 30,
  PROPOSAL: 50,
  NEGOTIATION: 65,
};

const RECENT_DAYS = 7;
const MONTH_DAYS = 30;
const FRESH_STAGE_DAYS = 14;
const STUCK_DAYS = 30;
const STALLED_DAYS = 60;
const BUSY_ACTIVITIES = 3;
const POINTS_PER_ITEM = 5;
const MAX_ITEM_POINTS = 15;

const capped = (count: number) => Math.min(MAX_ITEM_POINTS, count * POINTS_PER_ITEM);

function stageAge(days: number): ScoreReason | null {
  if (days <= FRESH_STAGE_DAYS) {
    return { text: `Moved into this stage ${days} day(s) ago`, impact: 5 };
  }
  if (days > STALLED_DAYS) {
    return { text: `Stalled: ${days} days in this stage`, impact: -20 };
  }
  if (days > STUCK_DAYS) {
    return { text: `${days} days in this stage`, impact: -10 };
  }
  return null;
}

function recency(days: number | null): ScoreReason {
  if (days === null) {
    return { text: 'No activity logged yet', impact: -10 };
  }
  if (days <= RECENT_DAYS) {
    return { text: `Activity in the last ${RECENT_DAYS} days`, impact: 10 };
  }
  if (days <= MONTH_DAYS) {
    return { text: `Last activity ${days} days ago`, impact: 5 };
  }
  return { text: `No activity for ${days} days`, impact: -10 };
}

function volume(count: number): ScoreReason | null {
  return count >= BUSY_ACTIVITIES
    ? { text: `${count} activities in the last ${MONTH_DAYS} days`, impact: 5 }
    : null;
}

function overdue(count: number): ScoreReason | null {
  return count > 0 ? { text: `${count} overdue task(s)`, impact: -capped(count) } : null;
}

function email(inbound: number, outbound: number): ScoreReason | null {
  if (inbound > 0) {
    return {
      text: `${inbound} email(s) from the contact in the last ${MONTH_DAYS} days`,
      impact: capped(inbound),
    };
  }
  if (outbound >= 2) {
    return { text: `${outbound} emails sent without a reply`, impact: -5 };
  }
  return null;
}

function closeDate(passed: boolean): ScoreReason | null {
  return passed ? { text: 'The expected close date has passed', impact: -10 } : null;
}

/** The score and every reason behind it, biggest effect first. */
export function scoreFromFacts(facts: DealFacts): { score: number; reasons: ScoreReason[] } {
  if (facts.stage === 'WON') {
    return { score: 100, reasons: [{ text: 'Deal won', impact: 100 }] };
  }
  if (facts.stage === 'LOST') {
    return { score: 0, reasons: [{ text: 'Deal lost', impact: 0 }] };
  }
  const base = STAGE_POINTS[facts.stage] ?? 0;
  const signals = [
    stageAge(facts.daysInStage),
    recency(facts.daysSinceActivity),
    volume(facts.activitiesLast30Days),
    overdue(facts.overdueTasks),
    email(facts.emailsInLast30Days, facts.emailsOutLast30Days),
    closeDate(facts.closeDatePassed),
  ].filter((reason): reason is ScoreReason => reason !== null);
  // `filter` already made a new array, so sorting it in place touches nothing shared.
  signals.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const total = signals.reduce((sum, reason) => sum + reason.impact, base);
  const reasons = [{ text: `${facts.stage} stage`, impact: base }, ...signals];
  return { score: Math.max(0, Math.min(100, total)), reasons };
}
