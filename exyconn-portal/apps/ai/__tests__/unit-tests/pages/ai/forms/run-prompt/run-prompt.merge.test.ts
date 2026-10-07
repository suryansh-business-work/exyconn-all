import { describe, expect, it } from 'vitest';
import {
  renderMergeFields,
  VARIABLE_FIELD_PREFIX,
} from '../../../../../../src/pages/ai/forms/run-prompt';

describe('renderMergeFields', () => {
  it('fills every supplied placeholder, tolerating spaces inside the braces', () => {
    expect(
      renderMergeFields('Write to {{company}} about {{ product }}', {
        company: 'Acme',
        product: 'Rockets',
      }),
    ).toBe('Write to Acme about Rockets');
  });

  it('leaves an unfilled or blank placeholder visible in its normalised form', () => {
    expect(renderMergeFields('Hi {{ first-name }}, {{last_name}}', { last_name: '' })).toBe(
      'Hi {{first-name}}, {{last_name}}',
    );
  });

  it('fills a placeholder used more than once everywhere', () => {
    expect(renderMergeFields('{{a}} and {{a}}', { a: 'x' })).toBe('x and x');
  });

  it('ignores braces that are not a valid field name', () => {
    const content = 'Keep {{1st}} and {{}} and {single}';
    expect(renderMergeFields(content, { '1st': 'no' })).toBe(content);
  });

  it('nests per-variable form fields under "variables."', () => {
    expect(VARIABLE_FIELD_PREFIX).toBe('variables.');
  });
});
