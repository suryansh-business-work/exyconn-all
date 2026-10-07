import { describe, expect, it } from 'vitest';
import { propsFormSchema } from '../../../../../../src/pages/website/forms/cms-component-props/cms-component-props.types';
import { toTree } from '../../../../../../src/pages/website/forms/cms-component-props';

const tree = toTree({ title: 'Hello' });

/** The first message a parse fails with for each field, as the form's resolver shows it. */
function errorsOf(values: unknown): Record<string, string> {
  const result = propsFormSchema.safeParse(values);
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('propsFormSchema', () => {
  it('accepts the fields view whatever the JSON box holds', () => {
    expect(errorsOf({ mode: 'fields', tree, json: 'not json' })).toEqual({});
  });

  it('accepts a JSON object in the JSON view', () => {
    expect(errorsOf({ mode: 'json', tree, json: '{ "title": "Hi" }' })).toEqual({});
  });

  it.each(['{ "title": ', '["a"]', 'null', '"text"'])(
    'rejects %s in the JSON view: only an object will do',
    (json) => {
      expect(errorsOf({ mode: 'json', tree, json })).toEqual({
        json: 'Enter a JSON object, like { "title": "Hello" }',
      });
    },
  );

  it('rejects settings too large to save', () => {
    const json = JSON.stringify({ text: 'x'.repeat(200_000) });

    expect(errorsOf({ mode: 'fields', tree, json }).json).toBe('These settings are too large');
  });

  it('needs a tree and a known view', () => {
    const errors = errorsOf({ mode: 'table', tree: null, json: '{}' });

    expect(Object.keys(errors).sort((a, b) => a.localeCompare(b))).toEqual(['mode', 'tree']);
  });
});
