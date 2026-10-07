// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import CollectionsOutlined from '@mui/icons-material/CollectionsOutlined';
import StatTile from '../../../../src/renderer/components/StatTile';
import { button, clickElement, render, unmountAll, withProviders } from '../../test-utils';

afterEach(unmountAll);

describe('StatTile', () => {
  it('shows the label and the full value, and opens its detail on click', async () => {
    const onOpen = vi.fn();
    await render(
      <StatTile label="Screenshots" value="1,204" icon={CollectionsOutlined} onOpen={onOpen} />,
    );
    const tile = button('Screenshots: 1,204. Open details');
    expect(tile.textContent).toBe('Screenshots1,204');
    expect(tile.querySelector('[title="1,204"]')).not.toBeNull();
    await clickElement(tile);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('draws on the dark palette too', async () => {
    await render(
      withProviders(
        <StatTile label="Sessions" value="4" icon={CollectionsOutlined} onOpen={vi.fn()} />,
        { themeMode: 'dark' },
      ),
    );
    expect(button('Sessions: 4. Open details').textContent).toBe('Sessions4');
  });
});
