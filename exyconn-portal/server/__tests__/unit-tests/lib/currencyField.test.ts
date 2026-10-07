import mongoose, { Schema } from 'mongoose';
import { currencyField } from '../../../src/lib/currencyField';

const { validator, message } = currencyField.validate;

describe('currencyField', () => {
  it('is a required, trimmed, upper-cased string', () => {
    expect(currencyField).toMatchObject({
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    });
  });

  it('accepts an ISO 4217 code the runtime knows', () => {
    expect(validator('USD')).toBe(true);
    expect(validator('INR')).toBe(true);
  });

  it('refuses free text and symbols', () => {
    expect(validator('₹')).toBe(false);
    expect(validator('Rupee')).toBe(false);
    expect(validator('ZZZ')).toBe(false);
  });

  it('explains the refusal with the offending value', () => {
    expect(message({ value: '₹' })).toBe('₹ is not an ISO 4217 currency code');
    expect(message({ value: null })).toBe('null is not an ISO 4217 currency code');
  });

  it('normalises and validates on a schema that declares it', () => {
    const schema = new Schema({ currency: currencyField });
    const Probe = mongoose.model('CurrencyFieldProbe', schema);
    const good = new Probe({ currency: ' usd ' });
    expect(good.currency).toBe('USD');
    expect(good.validateSync()).toBeUndefined();

    const bad = new Probe({ currency: 'rupee' });
    expect(bad.validateSync()?.errors.currency.message).toBe(
      'RUPEE is not an ISO 4217 currency code',
    );
  });
});
