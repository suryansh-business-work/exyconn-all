import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { PayType } from '@/graphql/generated';
import { CompensationFields, toCompensationValues } from '@/components/pay';
import { renderWithProviders } from '../../test-utils';
import { FormHarness } from '../form/formHarness';

function renderFields(payType: PayType) {
  const defaultValues = { ...toCompensationValues(null, 'INR'), payType };
  return renderWithProviders(
    <FormHarness defaultValues={defaultValues}>
      <CompensationFields />
    </FormHarness>,
  );
}

const field = (name: string) => document.querySelector(`input[name="${name}"]`);

describe('CompensationFields', () => {
  it('asks a fixed salary for its monthly components, not a single rate', () => {
    renderFields(PayType.Fixed);

    expect(screen.getByText('Compensation')).toBeInTheDocument();
    expect(screen.getByLabelText('Basic')).toBeInTheDocument();
    expect(
      screen.getByText('Loss of pay for unpaid leave is prorated on this.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('HRA')).toBeInTheDocument();
    expect(screen.getByLabelText('Allowances')).toBeInTheDocument();
    expect(field('rate')).toBeNull();
    expect(field('payTypeNote')).toBeNull();
  });

  it('asks hourly pay for a rate per hour', () => {
    renderFields(PayType.Hourly);

    expect(screen.getByLabelText('Rate per hour')).toHaveAttribute('type', 'number');
    expect(field('basic')).toBeNull();
    expect(field('payTypeNote')).toBeNull();
  });

  it('asks an "other" arrangement for its description and a monthly amount', () => {
    renderFields(PayType.Other);

    expect(screen.getByLabelText('Pay arrangement')).toBeInTheDocument();
    expect(screen.getByLabelText('Amount per month')).toBeInTheDocument();
    expect(field('hra')).toBeNull();
  });

  it('always asks for deductions, the billing rate, tax regime and effective date', () => {
    renderFields(PayType.Stipend);

    expect(screen.getByLabelText('Deductions')).toHaveAttribute('min', '0');
    expect(screen.getByLabelText('Billing rate per hour')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Tax regime/ })).toBeInTheDocument();
    expect(field('effectiveFrom')).not.toBeNull();
    expect(screen.getByRole('combobox', { name: /Pay type/ })).toHaveTextContent('Stipend');
  });
});
