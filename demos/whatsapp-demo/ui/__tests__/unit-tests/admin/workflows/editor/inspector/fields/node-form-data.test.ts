import { NODE_SCHEMAS } from '@exyconn/wa-flow';
import type { FieldValues, Resolver } from 'react-hook-form';
import {
  compact,
  fromFormValues,
  nodeResolver,
  toFormValues,
} from '../../../../../../../src/admin/workflows/editor/inspector/fields/node-form-data';

const OPTIONS: Parameters<Resolver<FieldValues>>[2] = {
  fields: {},
  shouldUseNativeValidation: false,
};

async function errorsOf(schema: Parameters<typeof nodeResolver>[0], values: FieldValues) {
  const result = await nodeResolver(schema)(values, undefined, OPTIONS);
  return result.errors as Record<string, { message?: string }>;
}

describe('toFormValues', () => {
  it('turns every nested set map into key/value rows', () => {
    const data = {
      text: 'Hi',
      set: { fee: '$price:650', count: 3 },
      buttons: [{ id: 'yes', title: 'Yes', set: { picked: 'yes' } }],
    };
    expect(toFormValues(data)).toEqual({
      text: 'Hi',
      set: [
        { key: 'fee', value: '$price:650' },
        { key: 'count', value: '3' },
      ],
      buttons: [{ id: 'yes', title: 'Yes', set: [{ key: 'picked', value: 'yes' }] }],
    });
  });

  it('leaves a set that is already rows as it is', () => {
    const rows = [{ key: 'a', value: '1' }];
    expect(toFormValues({ set: rows })).toEqual({ set: rows });
  });

  it('leaves primitives, arrays of primitives and nulls alone', () => {
    expect(toFormValues({ cells: ['a', 'b'], flag: null, n: 1 })).toEqual({
      cells: ['a', 'b'],
      flag: null,
      n: 1,
    });
  });
});

describe('fromFormValues', () => {
  it('turns rows back into a map, trimming keys and dropping blank ones', () => {
    expect(
      fromFormValues({
        set: [
          { key: ' fee ', value: '650' },
          { key: '  ', value: 'ignored' },
        ],
        cards: [{ set: [{ key: 'size', value: 'M' }] }],
      }),
    ).toEqual({ set: { fee: '650' }, cards: [{ set: { size: 'M' } }] });
  });

  it('keeps a set that is already a map', () => {
    expect(fromFormValues({ set: { a: '1' } })).toEqual({ set: { a: '1' } });
  });

  it('stores no map when every row is blank', () => {
    expect(fromFormValues({ text: 'x', set: [{ key: '', value: 'v' }] })).toEqual({
      text: 'x',
      set: undefined,
    });
  });
});

describe('compact', () => {
  it('drops undefined values and empty optional text, deeply', () => {
    expect(
      compact({
        text: 'Hi',
        header: '',
        footer: undefined,
        buttons: [{ id: 'a', title: 'A', description: '' }],
        image: { title: '', subtitle: 'Sub' },
      }),
    ).toEqual({ text: 'Hi', buttons: [{ id: 'a', title: 'A' }], image: { subtitle: 'Sub' } });
  });

  it('keeps an empty string where it is not optional', () => {
    expect(compact({ text: '', var: '' })).toEqual({ text: '', var: '' });
  });
});

describe('nodeResolver', () => {
  it('returns the stored shape when the values are valid', async () => {
    const result = await nodeResolver(NODE_SCHEMAS.text.shape.data)(
      { text: 'Hello', set: [{ key: 'a', value: '1' }] },
      undefined,
      OPTIONS,
    );
    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ text: 'Hello', set: { a: '1' } });
  });

  it('asks for a required text', async () => {
    const errors = await errorsOf(NODE_SCHEMAS.text.shape.data, { text: '  ' });
    expect(errors.text.message).toBe('This is required');
  });

  it('says a text is too short when its minimum is above one', async () => {
    const errors = await errorsOf(NODE_SCHEMAS.contact.shape.data, {
      contact: { name: 'Desk', phone: '12' },
    });
    expect((errors.contact as unknown as Record<string, { message: string }>).phone.message).toBe(
      'Too short',
    );
  });

  it('asks for at least one item and flags a number under its minimum', async () => {
    expect(
      (await errorsOf(NODE_SCHEMAS.buttons.shape.data, { text: 'x', buttons: [] })).buttons.message,
    ).toBe('Add at least one');
    expect((await errorsOf(NODE_SCHEMAS.delay.shape.data, { ms: 50 })).ms.message).toBe(
      'Too small',
    );
  });

  it('names WhatsApp limits on long text, long lists and large numbers', async () => {
    const long = await errorsOf(NODE_SCHEMAS.text.shape.data, { text: 'a'.repeat(1025) });
    expect(long.text.message).toBe('Too long for WhatsApp');
    const button = { id: 'b', title: 'B' };
    const many = await errorsOf(NODE_SCHEMAS.buttons.shape.data, {
      text: 'x',
      buttons: [button, { ...button, id: 'c' }, { ...button, id: 'd' }, { ...button, id: 'e' }],
    });
    expect(many.buttons.message).toBe('Too many items');
    expect((await errorsOf(NODE_SCHEMAS.delay.shape.data, { ms: 70_000 })).ms.message).toBe(
      'Too large',
    );
  });

  it('tells a missing value from a wrong one', async () => {
    expect((await errorsOf(NODE_SCHEMAS.text.shape.data, {})).text.message).toBe(
      'This is required',
    );
    expect((await errorsOf(NODE_SCHEMAS.text.shape.data, { text: 5 })).text.message).toBe(
      'Enter a valid value',
    );
  });

  it("leaves other problems to Zod's own message", async () => {
    const errors = await errorsOf(NODE_SCHEMAS.input.shape.data, { var: 'name', kind: 'colour' });
    expect(errors.kind.message).toEqual(expect.any(String));
    expect(errors.kind.message).not.toMatch(/required|valid value|Too/);
  });
});
