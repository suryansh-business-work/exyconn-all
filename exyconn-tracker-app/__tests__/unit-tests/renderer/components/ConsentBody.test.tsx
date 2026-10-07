// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import ConsentBody from '../../../../src/renderer/components/ConsentBody';
import { render, unmountAll } from '../../test-utils';

afterEach(unmountAll);

describe('ConsentBody', () => {
  it('renders the admin’s disclosure as rich text', async () => {
    await render(
      <ConsentBody html="<h2>What is recorded</h2><p>Your <strong>screen</strong>, while tracking.</p>" />,
    );
    expect(document.querySelector('h2')?.textContent).toBe('What is recorded');
    expect(document.querySelector('strong')?.textContent).toBe('screen');
  });

  it('strips anything that could run code before it reaches the page', async () => {
    await render(
      <ConsentBody
        html={
          '<p onclick="steal()">Read me</p><script>steal()</script><img src="x" onerror="steal()">'
        }
      />,
    );
    expect(document.querySelector('script')).toBeNull();
    expect(document.querySelector('[onclick]')).toBeNull();
    expect(document.querySelector('[onerror]')).toBeNull();
    expect(document.querySelector('p')?.textContent).toBe('Read me');
  });
});
