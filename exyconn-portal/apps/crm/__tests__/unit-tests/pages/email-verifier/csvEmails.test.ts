import { describe, expect, it } from 'vitest';
import { emailsInCsv } from '../../../../src/pages/email-verifier/csvEmails';

describe('emailsInCsv', () => {
  it('finds addresses in any column of a CRM export, dropping the header and other cells', () => {
    const csv = 'Name,Email,Phone\r\nAsha,asha@acme.com,98765\r\nRavi;"ravi@globex.io"\tnote';

    expect(emailsInCsv(csv)).toEqual(['asha@acme.com', 'ravi@globex.io']);
  });

  it('lower-cases and de-duplicates, so a repeated address is checked once', () => {
    expect(emailsInCsv('Asha@Acme.com\nasha@acme.com\n  ASHA@ACME.COM  ')).toEqual([
      'asha@acme.com',
    ]);
  });

  it('strips the quotes a spreadsheet puts around a cell', () => {
    expect(emailsInCsv('""sales@acme.com""')).toEqual(['sales@acme.com']);
  });

  it('returns nothing for a file without a valid address', () => {
    expect(emailsInCsv('')).toEqual([]);
    expect(emailsInCsv('name,phone\nasha,not-an-email@')).toEqual([]);
  });
});
