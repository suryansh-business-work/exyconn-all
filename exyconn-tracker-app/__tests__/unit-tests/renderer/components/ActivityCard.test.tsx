// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import ActivityCard from '../../../../src/renderer/components/ActivityCard';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

describe('ActivityCard', () => {
  it('heads the chart with its title, the headline percentage and the colour legend', async () => {
    await render(
      <ActivityCard title="Today’s activity" percent={64}>
        <p>chart body</p>
      </ActivityCard>,
    );
    expect(document.querySelector('h2')?.textContent).toBe('Today’s activity');
    expect(pageText()).toContain('64%');
    expect(pageText()).toContain('<40%');
    expect(pageText()).toContain('40–69%');
    expect(pageText()).toContain('≥70%');
    expect(pageText()).toContain('chart body');
  });

  it('leaves the percentage out while nothing has been tracked', async () => {
    await render(
      <ActivityCard title="Over time" percent={null}>
        <p>empty</p>
      </ActivityCard>,
    );
    const headline = [...document.querySelectorAll('p')].find((node) =>
      /^\d+%$/.test(node.textContent ?? ''),
    );
    expect(headline).toBeUndefined();
    expect(pageText()).toContain('Over time');
  });
});
