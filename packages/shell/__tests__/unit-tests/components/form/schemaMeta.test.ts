import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { fieldMeta } from '@/components/form/schemaMeta';

const schema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').describe('What people will see'),
    phone: z.string().regex(/^\d+$/).or(z.literal('')),
    summary: z.string().max(500),
    email: z.email(),
    code: z.string().regex(/^[A-Z]+$/),
    kind: z.enum(['A', 'B']),
    count: z.coerce.number().min(0),
    note: z.string().optional().describe('Optional note'),
    nickname: z.string().nullable(),
    level: z.number().default(1),
    active: z.boolean(),
    trimmed: z
      .string()
      .min(1)
      .transform((value) => value.trim()),
    tags: z.array(z.string()).min(1),
    extras: z.array(z.string()),
    links: z.object({ site: z.string().min(1).describe('Your site') }),
    rows: z.array(z.object({ name: z.string().min(2) })),
    either: z.union([z.literal(null), z.string().min(1)]),
    frozen: z.string().min(1).readonly(),
  })
  .superRefine(() => undefined);

const required = (path: string) => fieldMeta(schema, path).required;

describe('fieldMeta', () => {
  it('stars what refuses an empty value', () => {
    for (const path of ['title', 'email', 'code', 'kind', 'count', 'trimmed', 'tags', 'frozen']) {
      expect([path, required(path)]).toEqual([path, true]);
    }
  });

  it('leaves out what may stay empty', () => {
    for (const path of [
      'phone',
      'summary',
      'note',
      'nickname',
      'level',
      'active',
      'extras',
      'either',
    ]) {
      expect([path, required(path)]).toEqual([path, false]);
    }
  });

  it('reads the hint written with describe(), through wrappers', () => {
    expect(fieldMeta(schema, 'title').description).toBe('What people will see');
    expect(fieldMeta(schema, 'note').description).toBe('Optional note');
    expect(fieldMeta(schema, 'summary').description).toBeUndefined();
  });

  it('follows nested objects and array items', () => {
    expect(fieldMeta(schema, 'links.site')).toEqual({ required: true, description: 'Your site' });
    expect(required('rows.0.name')).toBe(true);
  });

  it('says nothing about an unknown path or something that is not a schema', () => {
    expect(fieldMeta(schema, 'missing')).toEqual({ required: false });
    expect(fieldMeta(schema, 'title.deeper')).toEqual({ required: false });
    expect(fieldMeta(undefined, 'title')).toEqual({ required: false });
    expect(fieldMeta(z.string().transform(Number), 'any')).toEqual({ required: false });
  });

  it('stops at the first missing step of a longer path', () => {
    expect(fieldMeta(schema, 'missing.deeper.still')).toEqual({ required: false });
  });

  it('reads a schema-shaped object missing the parts Zod always fills in', () => {
    const node = (def: object) => ({ _zod: { def } });
    const shaped = node({
      type: 'object',
      shape: {
        pipe: node({ type: 'pipe' }),
        literal: node({ type: 'literal' }),
        union: node({ type: 'union' }),
        list: node({ type: 'array', checks: [{ _zod: { def: { check: 'min_length' } } }] }),
      },
    });

    expect(fieldMeta(shaped, 'pipe').required).toBe(false);
    expect(fieldMeta(shaped, 'literal').required).toBe(true);
    expect(fieldMeta(shaped, 'union').required).toBe(true);
    expect(fieldMeta(shaped, 'list').required).toBe(false);
  });
});
