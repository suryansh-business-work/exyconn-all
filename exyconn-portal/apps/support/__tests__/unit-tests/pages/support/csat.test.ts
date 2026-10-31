import { describe, expect, it } from 'vitest';
import { csatLabel } from '../../../../src/pages/support/csat';

const summary = (csatPercent: number | null, csatResponses: number) => ({
  __typename: 'SupportSlaSummary' as const,
  onTrack: 0,
  dueSoon: 0,
  breached: 0,
  csatSent: 10,
  csatResponses,
  csatAverage: csatPercent == null ? null : 4.2,
  csatPercent,
});

describe('csatLabel', () => {
  it('shows a dash while loading and until somebody has answered', () => {
    expect(csatLabel(undefined)).toBe('—');
    expect(csatLabel(summary(null, 0))).toBe('—');
  });

  it('shows the share of satisfied answers and how many answers it rests on', () => {
    expect(csatLabel(summary(66.7, 3))).toBe('66.7% (3)');
    expect(csatLabel(summary(0, 1))).toBe('0% (1)');
  });
});
