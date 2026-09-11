import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '@tiptap/core';
import { buildExtensions } from '../../src/extensions';

/**
 * The HTML each feature produces. exyconn-website's article sanitiser allow-lists
 * exactly this markup (its tests hold the same samples), so a change here is a change
 * to what the public site has to accept.
 */
let editor: Editor | null = null;

const render = (content: string): string => {
  editor = new Editor({ extensions: buildExtensions(''), content });
  return editor.getHTML();
};

afterEach(() => {
  editor?.destroy();
  editor = null;
});

describe('buildExtensions', () => {
  it('keeps tables with header cells and spans', () => {
    const html = render(
      '<table><tbody><tr><th>Plan</th><th>Price</th></tr><tr><td colspan="2">Custom</td></tr></tbody></table>',
    );
    expect(html).toContain('<table');
    expect(html).toContain('<th colspan="1" rowspan="1"><p>Plan</p></th>');
    expect(html).toContain('<td colspan="2" rowspan="1"><p>Custom</p></td>');
  });

  it('writes alignment, colour and highlight as inline styles', () => {
    // A parsed colour comes back the way the browser normalises it (rgb); a picked one is hex.
    const html = render(
      '<p style="text-align: center"><span style="color: #155dfc">blue</span> <mark data-color="#ffd166" style="background-color: #ffd166">marked</mark></p>',
    );
    expect(html).toContain('<p style="text-align: center;">');
    expect(html).toContain('<span style="color: rgb(21, 93, 252);">blue</span>');
    expect(html).toContain('data-color="#ffd166"');
    expect(html).toContain('background-color: rgb(255, 209, 102)');
  });

  it('keeps task lists with their checked state', () => {
    const html = render(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true"><p>Ship it</p></li></ul>',
    );
    expect(html).toContain('data-type="taskList"');
    expect(html).toContain('data-checked="true"');
    expect(html).toContain('type="checkbox"');
  });

  it('keeps images with their alt text and size', () => {
    const html = render(
      '<img src="https://ik.imagekit.io/x/a.png" alt="Team photo" width="320" height="200">',
    );
    expect(html).toContain('src="https://ik.imagekit.io/x/a.png"');
    expect(html).toContain('alt="Team photo"');
    expect(html).toContain('width="320"');
  });

  it('keeps links, sub / superscript and code blocks', () => {
    const html = render(
      '<p><a href="https://exyconn.com" target="_blank">site</a> H<sub>2</sub>O x<sup>2</sup></p><pre><code>const a = 1;</code></pre>',
    );
    expect(html).toContain('href="https://exyconn.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('<sub>2</sub>');
    expect(html).toContain('<sup>2</sup>');
    expect(html).toContain('<pre><code>const a = 1;</code></pre>');
  });

  it('drops markup outside the schema', () => {
    const html = render(
      '<p onclick="alert(1)">safe</p><script>alert(1)</script><iframe src="x"></iframe>',
    );
    expect(html).toBe('<p>safe</p>');
  });
});
