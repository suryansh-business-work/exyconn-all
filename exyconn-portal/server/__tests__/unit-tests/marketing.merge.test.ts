import {
  renderMergeFields,
  withUnsubscribeFooter,
} from '../../src/modules/marketing/marketing.merge';
import { chunk, countOutcomes, type SendOutcome } from '../../src/modules/marketing/marketing.send';

const vars = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  unsubscribeUrl: 'https://portal.example/unsubscribe?t=abc',
};

describe('Merge fields', () => {
  it('substitutes every supported field, with or without spaces in the braces', () => {
    const rendered = renderMergeFields('Hi {{name}} at {{ company }} — {{email}}', vars);

    expect(rendered).toBe('Hi Ada Lovelace at Analytical Engines — ada@example.com');
  });

  it('renders an unknown field as nothing rather than leaving the braces in the email', () => {
    expect(renderMergeFields('Hi {{firstName}}!', vars)).toBe('Hi !');
  });

  it('does not reach inherited properties, so braces cannot pull out anything executable', () => {
    expect(renderMergeFields('{{constructor}}{{toString}}', vars)).toBe('');
  });

  it('leaves text with no merge fields exactly as written', () => {
    expect(renderMergeFields('Plain copy, 50% off {not a field}', vars)).toBe(
      'Plain copy, 50% off {not a field}',
    );
  });

  it('merges the same field more than once', () => {
    expect(renderMergeFields('{{name}} & {{name}}', vars)).toBe('Ada Lovelace & Ada Lovelace');
  });
});

describe('The unsubscribe footer', () => {
  it('appends the link when the copy did not place it', () => {
    expect(withUnsubscribeFooter('Hello.', vars.unsubscribeUrl)).toBe(
      `Hello.\n\nUnsubscribe: ${vars.unsubscribeUrl}`,
    );
  });

  it('leaves the copy alone when it already carries the link', () => {
    const body = `Hello. Opt out here: ${vars.unsubscribeUrl}`;

    expect(withUnsubscribeFooter(body, vars.unsubscribeUrl)).toBe(body);
  });
});

describe('Batching a send', () => {
  it('splits the audience into fixed-width batches, the last one short', () => {
    expect(chunk([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('has no batches for an empty audience', () => {
    expect(chunk([], 5)).toEqual([]);
  });

  it('counts sent, failed and skipped separately', () => {
    const outcomes: SendOutcome[] = [
      { to: 'a@x.com', recipientName: 'A', status: 'SENT', error: '' },
      { to: 'b@x.com', recipientName: 'B', status: 'FAILED', error: '550' },
      { to: 'c@x.com', recipientName: 'C', status: 'SKIPPED', error: 'On the suppression list' },
      { to: 'd@x.com', recipientName: 'D', status: 'SENT', error: '' },
    ];

    expect(countOutcomes(outcomes)).toEqual({ sent: 2, failed: 1, skipped: 1 });
  });
});
