// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import KeyboardOutlined from '@mui/icons-material/KeyboardOutlined';
import MetricCard from '../../../../src/renderer/components/MetricCard';
import { render, unmountAll } from '../../test-utils';
import { pageText } from './fixtures';

afterEach(unmountAll);

describe('MetricCard', () => {
  it('shows the figure, how it moved and what it is compared with', async () => {
    await render(
      <MetricCard
        label="Keystrokes"
        value="1,240"
        change={{ text: '+12%', direction: 'up' }}
        caption="1,107 the 7 days before"
        icon={KeyboardOutlined}
      />,
    );
    expect(pageText()).toBe('Keystrokes1,240+12%1,107 the 7 days before');
    expect(document.querySelector('svg')).not.toBeNull();
  });

  it('shows no change when the earlier period had nothing to compare', async () => {
    await render(
      <MetricCard
        label="Sessions"
        value="3"
        change={null}
        caption="0 the 7 days before"
        icon={KeyboardOutlined}
      />,
    );
    expect(pageText()).toBe('Sessions30 the 7 days before');
  });
});
