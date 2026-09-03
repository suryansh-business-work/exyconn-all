import {
  EmailRenderError,
  expandFragments,
  fragmentsIn,
  renderTemplate,
  substitute,
  variablesIn,
} from '../../src/modules/email/email.render';

const noFragments = new Map<string, string>();

describe('variablesIn', () => {
  it('finds every placeholder, once each, in the order they appear', () => {
    expect(variablesIn('Hi {{name}}, your {{thing}} for {{name}} is ready')).toEqual([
      'name',
      'thing',
    ]);
  });

  it('tolerates the spacing people actually type', () => {
    expect(variablesIn('{{ name }} and {{name}} and {{  name  }}')).toEqual(['name']);
  });

  it('does not mistake a fragment include for a variable', () => {
    expect(variablesIn('{{> header }} Hi {{name}}')).toEqual(['name']);
  });

  it('finds nothing in markup with no placeholders', () => {
    expect(variablesIn('<mj-text>Hello</mj-text>')).toEqual([]);
  });
});

describe('fragmentsIn', () => {
  it('finds every include, once each', () => {
    expect(fragmentsIn('{{> header }}body{{> footer}}{{>header}}')).toEqual(['header', 'footer']);
  });
});

describe('substitute', () => {
  it('fills every placeholder with the value given', () => {
    expect(substitute('Hi {{name}} at {{company}}', { name: 'Asha', company: 'Exyconn' })).toBe(
      'Hi Asha at Exyconn',
    );
  });

  it('refuses to render when a value is missing', () => {
    // The alternatives are emailing a literal "{{name}}" or a blank where a name should be.
    // Both have been sent to real customers by real systems; refusing is the only safe one.
    expect(() => substitute('Hi {{name}}', {})).toThrow(EmailRenderError);
    expect(() => substitute('Hi {{name}}', {})).toThrow(/Missing value for: name/);
  });

  it('names every missing value at once, not just the first', () => {
    expect(() => substitute('{{a}} {{b}} {{c}}', { b: 'x' })).toThrow(/a, c/);
  });

  it('treats an empty string as a real value', () => {
    // "" is a decision the caller made; only undefined means nobody supplied anything.
    expect(substitute('[{{note}}]', { note: '' })).toBe('[]');
  });

  it('substitutes every occurrence, not just the first', () => {
    expect(substitute('{{x}}-{{x}}-{{x}}', { x: '1' })).toBe('1-1-1');
  });
});

describe('expandFragments', () => {
  const fragments = new Map([
    ['header', '<mj-text>Exyconn</mj-text>'],
    ['footer', '<mj-text>Bye {{name}}</mj-text>'],
    ['wrapper', '{{> header }}<mj-text>inner</mj-text>'],
  ]);

  it('replaces an include with the fragment it names', () => {
    expect(expandFragments('{{> header }}!', fragments)).toBe('<mj-text>Exyconn</mj-text>!');
  });

  it('expands a fragment that includes another one', () => {
    expect(expandFragments('{{> wrapper }}', fragments)).toBe(
      '<mj-text>Exyconn</mj-text><mj-text>inner</mj-text>',
    );
  });

  it('says which fragment is missing rather than leaving the tag in the email', () => {
    expect(() => expandFragments('{{> nope }}', fragments)).toThrow(/does not exist: nope/);
  });

  it('stops a fragment that includes itself instead of hanging the send', () => {
    const loop = new Map([['loop', 'x{{> loop }}']]);
    expect(() => expandFragments('{{> loop }}', loop)).toThrow(/loop/i);
  });
});

describe('renderTemplate', () => {
  it('substitutes the subject as well as the body', () => {
    const result = renderTemplate({
      subject: 'Welcome, {{name}}',
      mjml: '<mj-text>Hi {{name}}</mj-text>',
      fragments: noFragments,
      variables: { name: 'Asha' },
    });
    expect(result.subject).toBe('Welcome, Asha');
    expect(result.mjml).toBe('<mj-text>Hi Asha</mj-text>');
  });

  it('expands fragments before substituting, so a fragment can carry placeholders', () => {
    const result = renderTemplate({
      subject: 'Hello',
      mjml: '{{> sign }}',
      fragments: new Map([['sign', '<mj-text>— {{author}}</mj-text>']]),
      variables: { author: 'Legal' },
    });
    expect(result.mjml).toBe('<mj-text>— Legal</mj-text>');
  });

  it('refuses when a fragment needs a value the caller did not supply', () => {
    expect(() =>
      renderTemplate({
        subject: 'Hello',
        mjml: '{{> sign }}',
        fragments: new Map([['sign', '{{author}}']]),
        variables: {},
      }),
    ).toThrow(/author/);
  });
});
