import { DEFAULT_PAY_TYPE, PAY_TYPES } from '../../../src/constants/pay';

describe('pay types', () => {
  it('lists how an employee can be paid', () => {
    expect(PAY_TYPES).toEqual(['FIXED', 'HOURLY', 'STIPEND', 'OTHER']);
  });

  it('defaults a new salary structure to a fixed salary', () => {
    expect(DEFAULT_PAY_TYPE).toBe('FIXED');
    expect(PAY_TYPES).toContain(DEFAULT_PAY_TYPE);
  });
});
