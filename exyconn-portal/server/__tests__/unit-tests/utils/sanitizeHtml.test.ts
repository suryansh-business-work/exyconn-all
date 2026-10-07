import { sanitizeRichHtml } from '../../../src/utils/sanitizeHtml';

describe('sanitizeRichHtml', () => {
  it('drops scripts and event handlers', () => {
    const clean = sanitizeRichHtml('<p onclick="steal()">Hi</p><script>alert(1)</script>');
    expect(clean).toBe('<p>Hi</p>');
  });

  it('keeps headings, images and figures the editor writes', () => {
    const html =
      '<h1>Title</h1><h2>Sub</h2><figure><img src="https://cdn.test/a.png" alt="A" width="10" /><figcaption>Cap</figcaption></figure>';
    const clean = sanitizeRichHtml(html);
    expect(clean).toContain('<h1>Title</h1>');
    expect(clean).toContain('<h2>Sub</h2>');
    expect(clean).toContain('<img src="https://cdn.test/a.png" alt="A" width="10" />');
    expect(clean).toContain('<figcaption>Cap</figcaption>');
  });

  it('adds rel="noopener noreferrer" to every link and strips javascript: hrefs', () => {
    const clean = sanitizeRichHtml(
      '<a href="https://acme.test" target="_blank">ok</a><a href="javascript:alert(1)">bad</a>',
    );
    expect(clean).toContain(
      '<a href="https://acme.test" target="_blank" rel="noopener noreferrer">ok</a>',
    );
    expect(clean).not.toContain('javascript:');
  });

  it('keeps mailto and tel links', () => {
    expect(sanitizeRichHtml('<a href="mailto:a@b.co">m</a>')).toContain('href="mailto:a@b.co"');
    expect(sanitizeRichHtml('<a href="tel:+15551234">t</a>')).toContain('href="tel:+15551234"');
  });

  it('renames the toolbar <strike> to <s>', () => {
    expect(sanitizeRichHtml('<strike>old</strike>')).toBe('<s>old</s>');
  });

  it('turns every input into a disabled checkbox, ticked only when it was', () => {
    expect(sanitizeRichHtml('<input type="text" checked value="x" />')).toBe(
      '<input type="checkbox" disabled checked />',
    );
    expect(sanitizeRichHtml('<input type="password" />')).toBe(
      '<input type="checkbox" disabled />',
    );
  });

  it('keeps alignment and colour styles but drops anything else', () => {
    const clean = sanitizeRichHtml(
      '<p style="text-align:center;color:#ff0000;background-color:rgba(0, 0, 0, 0.5);position:fixed">x</p>',
    );
    expect(clean).toContain('text-align:center');
    expect(clean).toContain('color:#ff0000');
    expect(clean).toContain('background-color:rgba(0, 0, 0, 0.5)');
    expect(clean).not.toContain('position');
  });

  it('refuses a colour that is not hex or rgb, and an alignment it does not know', () => {
    const clean = sanitizeRichHtml('<p style="color:url(x);text-align:middle">x</p>');
    expect(clean).toBe('<p>x</p>');
  });

  it('allows table widths only as lengths', () => {
    expect(
      sanitizeRichHtml('<table style="width:100%"><tbody><tr><td>a</td></tr></tbody></table>'),
    ).toContain('style="width:100%"');
    expect(
      sanitizeRichHtml('<table style="width:expression(1)"><tbody></tbody></table>'),
    ).not.toContain('expression');
  });

  it('keeps the data attributes check lists and highlights use', () => {
    const clean = sanitizeRichHtml(
      '<ul data-type="taskList"><li data-type="taskItem" data-checked="true">done</li></ul><mark data-color="#ff0">hl</mark>',
    );
    expect(clean).toContain('data-type="taskList"');
    expect(clean).toContain('data-checked="true"');
    expect(clean).toContain('data-color="#ff0"');
  });
});
