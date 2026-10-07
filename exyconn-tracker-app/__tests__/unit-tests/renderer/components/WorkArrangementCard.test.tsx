// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { WorkProfile } from '@shared/types';
import WorkArrangementCard from '../../../../src/renderer/components/WorkArrangementCard';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

const PROFILE: WorkProfile = {
  workingTime: 'FLEXIBLE',
  workingTimeNote: '',
  workLocation: 'HYBRID',
  workLocationNote: '',
  workHoursPerDay: 6,
  targetMs: 21_600_000,
};

describe('WorkArrangementCard', () => {
  it('draws nothing until HR’s record has arrived', async () => {
    await render(<WorkArrangementCard workProfile={null} />);
    expect(document.body.textContent).toBe('');
  });

  it('lists the contracted arrangement, read-only', async () => {
    await render(<WorkArrangementCard workProfile={PROFILE} />);
    expect(document.querySelector('h2')?.textContent).toBe('Your working day');
    expect(pageText()).toContain('Working timeFlexible');
    expect(pageText()).toContain('Work locationHybrid');
    expect(pageText()).toContain('Hours per day6h (default 8h)');
  });

  it('adds HR’s own note to an arrangement that has one', async () => {
    await render(
      <WorkArrangementCard
        workProfile={{
          ...PROFILE,
          workingTimeNote: 'Core hours 10–4',
          workLocationNote: 'Office on Tuesdays',
        }}
      />,
    );
    expect(pageText()).toContain('Flexible — Core hours 10–4');
    expect(pageText()).toContain('Hybrid — Office on Tuesdays');
  });
});
