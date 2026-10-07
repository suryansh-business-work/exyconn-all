// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import SettingsList from '../../../../src/renderer/components/SettingsList';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('SettingsList', () => {
  it('pairs each setting’s label with its value, in order', async () => {
    await render(
      <SettingsList
        rows={[
          { id: 'interval', label: 'Interval', value: '10 minutes' },
          { id: 'webcam', label: 'Webcam photo', value: 'Bottom right, with every screenshot' },
        ]}
      />,
    );
    const pairs = [...document.querySelectorAll('.MuiStack-root .MuiStack-root')].map((row) =>
      [...row.querySelectorAll('p')].map((cell) => cell.textContent),
    );
    expect(pairs).toEqual([
      ['Interval', '10 minutes'],
      ['Webcam photo', 'Bottom right, with every screenshot'],
    ]);
  });
});
