import {
  EmailRenderError,
  RawHtml,
  escapeHtml,
  plainVariables,
  rawHtml,
  renderTemplate,
  substitute,
} from '../../../../src/modules/email/email.render';

describe('escapeHtml', () => {
  it('escapes every character that could open a tag or close an attribute', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Asha Rao')).toBe('Asha Rao');
  });
});

describe('rawHtml and substitution', () => {
  it('wraps trusted markup in a RawHtml', () => {
    const value = rawHtml('<tr><td>1</td></tr>');
    expect(value).toBeInstanceOf(RawHtml);
    expect(value.html).toBe('<tr><td>1</td></tr>');
  });

  it('escapes typed text into markup but inserts trusted markup as it is', () => {
    expect(
      substitute('<p>{{name}}</p><table>{{rows}}</table>', {
        name: '<script>alert(1)</script>',
        rows: rawHtml('<tr><td>ok</td></tr>'),
      }),
    ).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p><table><tr><td>ok</td></tr></table>');
  });

  it('inserts values as plain text when escaping is off', () => {
    expect(substitute('Re: {{subject}}', { subject: 'Q&A <draft>' }, false)).toBe(
      'Re: Q&A <draft>',
    );
  });

  it('says "value" for one missing name and refuses a null as missing too', () => {
    const variables = { name: null } as unknown as Record<string, string>;
    expect(() => substitute('{{name}}', variables)).toThrow('Missing value for: name');
    expect(() => substitute('{{name}}', variables)).toThrow(EmailRenderError);
  });

  it('names a repeated missing value once', () => {
    expect(() => substitute('{{a}} {{a}}', {})).toThrow('Missing values for: a');
  });
});

describe('plainVariables', () => {
  it('turns every value into the text it stands for', () => {
    expect(plainVariables({ name: 'Asha', rows: rawHtml('<b>3</b>') })).toEqual({
      name: 'Asha',
      rows: '<b>3</b>',
    });
  });
});

describe('renderTemplate escaping', () => {
  it('escapes values in the body but not in the subject', () => {
    const result = renderTemplate({
      subject: 'Ticket: {{subject}}',
      mjml: '<mj-text>{{subject}}</mj-text>',
      fragments: new Map(),
      variables: { subject: 'Printer & <scanner>' },
    });
    expect(result.subject).toBe('Ticket: Printer & <scanner>');
    expect(result.mjml).toBe('<mj-text>Printer &amp; &lt;scanner&gt;</mj-text>');
  });
});
