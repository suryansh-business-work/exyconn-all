import { describe, expect, it } from 'vitest';
import {
  OVERVIEW_DAYS,
  overviewBreakdowns,
  overviewStats,
  type AgentsOverview,
} from '../../../../src/pages/overview/agents-overview.summary';

const percent = (share: number) => `${Math.round(share * 100)}%`;

const overview: AgentsOverview = {
  days: 30,
  from: '2026-10-03',
  to: '2026-11-01',
  conversations: 40,
  whatsappSessions: 12,
  whatsappCompletionRate: 0.5,
  websiteAgentSessions: 8,
  websiteChats: 10,
  websiteChatsAnsweredByPeople: 3,
  deflectionRate: 0.7,
  calls: 10,
  callsCompleted: 6,
  callsFailed: 1,
  leadsCaptured: 5,
};

describe('overviewStats', () => {
  it('covers the overview window', () => {
    expect(OVERVIEW_DAYS).toBe(30);
  });

  it('shows conversations, leads, calls and the deflection share', () => {
    const stats = overviewStats(overview, percent);
    expect(stats.map((stat) => [stat.label, stat.value])).toEqual([
      ['Conversations, {days}d', '40'],
      ['Leads captured, {days}d', '5'],
      ['Calls, {days}d', '10'],
      ['Deflection', '70%'],
    ]);
    expect(stats.slice(0, 3).map((stat) => stat.labelValues)).toEqual([
      { days: 30 },
      { days: 30 },
      { days: 30 },
    ]);
  });

  it('shows zeros before the overview arrives', () => {
    expect(overviewStats(undefined, percent).map((stat) => stat.value)).toEqual([
      '0',
      '0',
      '0',
      '0%',
    ]);
  });
});

describe('overviewBreakdowns', () => {
  it('splits conversations by agent, calls by outcome and chats by who answered', () => {
    expect(overviewBreakdowns(overview).map((b) => [b.title, b.buckets])).toEqual([
      [
        'Conversations by agent',
        [
          { value: 'WhatsApp agent', count: 12 },
          { value: 'Website chat agent', count: 8 },
          { value: 'Live website chats', count: 10 },
          { value: 'Calling bot', count: 10 },
        ],
      ],
      [
        'Calls by outcome',
        [
          { value: 'Completed', count: 6 },
          { value: 'Failed', count: 1 },
          { value: 'Other', count: 3 },
        ],
      ],
      [
        'Live website chats',
        [
          { value: 'Bot only', count: 7 },
          { value: 'A person replied', count: 3 },
        ],
      ],
    ]);
  });

  it('never shows a negative bucket when the counts disagree', () => {
    const odd = { ...overview, calls: 2, callsCompleted: 3, websiteChats: 1 };
    const [, calls, chats] = overviewBreakdowns(odd);
    expect(calls.buckets[2]).toEqual({ value: 'Other', count: 0 });
    expect(chats.buckets[0]).toEqual({ value: 'Bot only', count: 0 });
  });

  it('counts nothing before the overview arrives', () => {
    const counts = overviewBreakdowns(undefined).flatMap((b) => b.buckets.map((x) => x.count));
    expect(counts.every((count) => count === 0)).toBe(true);
  });
});
