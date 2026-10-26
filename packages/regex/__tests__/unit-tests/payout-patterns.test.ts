import { describe, expect, it } from 'vitest';
import {
  ABA_ROUTING,
  AU_ACCOUNT_NUMBER,
  AU_BSB,
  BANK_ACCOUNT_NUMBER,
  BIC,
  CA_ACCOUNT_NUMBER,
  CA_ROUTING,
  GB_ACCOUNT_NUMBER,
  IBAN,
  IFSC,
  IN_ACCOUNT_NUMBER,
  NZ_ACCOUNT_NUMBER,
  UK_SORT_CODE,
  UPI_ID,
  US_ACCOUNT_NUMBER,
} from '../../src';

/** Payout identifiers, checked after spaces and dashes are removed (see @exyconn/payout). */
const CASES: ReadonlyArray<[string, RegExp, readonly string[], readonly string[]]> = [
  ['IBAN', IBAN, ['DE89370400440532013000', 'NO9386011117947'], ['DE89', '89DE370400440532013000', 'de89370400440532013000']],
  ['BIC', BIC, ['DEUTDEFF', 'HDFCINBB', 'COBADEFFXXX'], ['DEUTDEF', 'DEUT1EFF', 'HDFCINBBX']],
  ['IFSC', IFSC, ['HDFC0001234', 'SBIN0ABC123'], ['HDFC1001234', 'HDF0001234', 'HDFC00012345']],
  ['UPI_ID', UPI_ID, ['ravi@okhdfcbank', 'r.k-1@ybl', 'Ravi@PAYTM'], ['ravi', '@okhdfc', 'ravi@1bank', 'r@ok']],
  ['ABA_ROUTING', ABA_ROUTING, ['021000021'], ['02100002', '0210000210']],
  ['UK_SORT_CODE', UK_SORT_CODE, ['123456'], ['12-34-56', '12345']],
  ['AU_BSB', AU_BSB, ['062000'], ['062-000', '06200']],
  ['CA_ROUTING', CA_ROUTING, ['00312345'], ['0031234', '003123456']],
  ['BANK_ACCOUNT_NUMBER', BANK_ACCOUNT_NUMBER, ['0123', 'AB12CD34'], ['123', 'ab12', 'A'.repeat(35)]],
  ['IN_ACCOUNT_NUMBER', IN_ACCOUNT_NUMBER, ['123456789', '50100123456789'], ['12345678', '1'.repeat(19)]],
  ['US_ACCOUNT_NUMBER', US_ACCOUNT_NUMBER, ['1234', '1'.repeat(17)], ['123', '1'.repeat(18)]],
  ['GB_ACCOUNT_NUMBER', GB_ACCOUNT_NUMBER, ['31926819'], ['3192681', '319268190']],
  ['CA_ACCOUNT_NUMBER', CA_ACCOUNT_NUMBER, ['1234567', '1'.repeat(12)], ['123456', '1'.repeat(13)]],
  ['AU_ACCOUNT_NUMBER', AU_ACCOUNT_NUMBER, ['12345', '123456789'], ['1234', '1234567890']],
  ['NZ_ACCOUNT_NUMBER', NZ_ACCOUNT_NUMBER, ['123456789012345', '1234567890123456'], ['12345678901234', '12345678901234567']],
]; // prettier-ignore

describe('payout identifier patterns', () => {
  it.each(CASES)('%s takes well-formed values and turns away the rest', (_name, pattern, valid, invalid) => {
    for (const value of valid) expect(pattern.test(value)).toBe(true);
    for (const value of invalid) expect(pattern.test(value)).toBe(false);
  });
});
