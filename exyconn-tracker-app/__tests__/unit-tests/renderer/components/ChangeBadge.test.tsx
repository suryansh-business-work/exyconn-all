// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { ChangeLabel } from '@exyconn/tracker-core';
import ChangeBadge from '../../../../src/renderer/components/ChangeBadge';
import { render, unmountAll, withProviders } from '../../test-utils';

afterEach(unmountAll);

describe('ChangeBadge', () => {
  it.each<ChangeLabel>([
    { text: '+12%', direction: 'up' },
    { text: '-8%', direction: 'down' },
    { text: '0%', direction: 'flat' },
  ])('prints the change "$text" as a pill', async (change) => {
    await render(<ChangeBadge change={change} />);
    const pill = document.querySelector('span');
    expect(pill?.textContent).toBe(change.text);
  });

  it('draws on the dark palette too', async () => {
    await render(
      withProviders(<ChangeBadge change={{ text: '+5%', direction: 'up' }} />, {
        themeMode: 'dark',
      }),
    );
    expect(document.body.textContent).toBe('+5%');
  });
});
