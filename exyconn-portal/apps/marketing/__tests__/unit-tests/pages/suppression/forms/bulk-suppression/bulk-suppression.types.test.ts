import { describe, expect, it } from 'vitest';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import {
  bulkSuppressionSchema,
  extractAddresses,
  MAX_BULK,
} from '../../../../../../src/pages/suppression/forms/bulk-suppression';

describe('extractAddresses', () => {
  it('finds nothing in empty text', () => {
    expect(extractAddresses('')).toEqual({ valid: [], invalid: [], repeated: 0 });
  });

  it('reads pasted lines and commas, lower-casing and de-duplicating', () => {
    expect(extractAddresses('Ada@Acme.io, grace@acme.io\nada@acme.io\n  bob@acme.io  ')).toEqual({
      valid: ['ada@acme.io', 'grace@acme.io', 'bob@acme.io'],
      invalid: [],
      repeated: 1,
    });
  });

  it('splits cells on spaces and semicolons inside one line', () => {
    expect(extractAddresses('a@acme.io b@acme.io;c@acme.io').valid).toEqual([
      'a@acme.io',
      'b@acme.io',
      'c@acme.io',
    ]);
  });

  it('reads any column of a CSV and ignores headers and other words', () => {
    const csv = 'name,email,company\nAda,ada@acme.io,Acme\n"Hopper, Grace",grace@navy.mil,Navy';

    expect(extractAddresses(csv)).toEqual({
      valid: ['ada@acme.io', 'grace@navy.mil'],
      invalid: [],
      repeated: 0,
    });
  });

  it('reports each malformed address once and leaves it out of the valid list', () => {
    expect(extractAddresses('broken@, broken@\nok@acme.io\n@nobody\nnot an address')).toEqual({
      valid: ['ok@acme.io'],
      invalid: ['broken@', '@nobody'],
      repeated: 0,
    });
  });
});

describe('bulkSuppressionSchema', () => {
  const valid = { addresses: 'a@acme.io', reason: SuppressionReason.Manual, note: '' };

  it('accepts addresses with a reason and trims the note', () => {
    expect(bulkSuppressionSchema.parse({ ...valid, note: '  import  ' })).toEqual({
      ...valid,
      note: 'import',
    });
  });

  it('asks for addresses when the box is blank', () => {
    const result = bulkSuppressionSchema.safeParse({ ...valid, addresses: '  \n ' });
    expect(result.error?.issues[0].message).toBe('Paste some addresses or choose a CSV file');
  });

  it('allows a 500-character note and rejects 501', () => {
    expect(bulkSuppressionSchema.safeParse({ ...valid, note: 'x'.repeat(500) }).success).toBe(true);
    const result = bulkSuppressionSchema.safeParse({ ...valid, note: 'x'.repeat(501) });
    expect(result.error?.issues[0].message).toBe('Keep the note under 500 characters');
  });

  it('matches the server limit for one bulk add', () => {
    expect(MAX_BULK).toBe(5000);
  });
});
