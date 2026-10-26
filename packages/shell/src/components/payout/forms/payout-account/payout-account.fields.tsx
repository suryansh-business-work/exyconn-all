import { useFormContext } from 'react-hook-form';
import { fieldsFor, isSecretField, type FieldSpec, type PayoutMethod } from '@exyconn/payout';
import { RhfSecretField, RhfSelect, RhfTextField } from '@/components/form/rhf';
import { SECRET_ENUM } from './payout-account.schema';
import type { PayoutAccountApi, PayoutAccountRow } from './payout-account.types';

const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CURRENT', label: 'Current / checking' },
  { value: 'SAVINGS', label: 'Savings' },
];

interface DetailFieldProps {
  spec: FieldSpec;
  row: PayoutAccountRow | null;
  reveal: PayoutAccountApi['reveal'];
}

/** One field as its spec asks: sealed details behind an eye, the account type as a select. */
function DetailField({ spec, row, reveal }: Readonly<DetailFieldProps>) {
  const { field, label, hint, need } = spec;
  const required = need === 'required';
  if (isSecretField(field)) {
    const stored = Boolean(row?.hints[field]);
    const onReveal = row && stored ? () => reveal(row, SECRET_ENUM[field]) : undefined;
    return (
      <RhfSecretField
        name={field}
        label={label}
        helperText={hint}
        required={required && !stored}
        stored={stored}
        onReveal={onReveal}
      />
    );
  }
  if (field === 'accountType') {
    return (
      <RhfSelect
        name={field}
        label={label}
        options={ACCOUNT_TYPE_OPTIONS}
        helperText={hint}
        required={required}
      />
    );
  }
  return <RhfTextField name={field} label={label} helperText={hint} required={required} />;
}

interface PayoutDetailFieldsProps {
  row: PayoutAccountRow | null;
  reveal: PayoutAccountApi['reveal'];
}

/**
 * The details the chosen method needs in the chosen country — an IBAN in Germany, an IFSC and
 * account number in India, an ABA routing number and account type in the US, a UPI ID or
 * linked mobile for UPI. Read from @exyconn/payout, the same table the server checks.
 */
export function PayoutDetailFields({ row, reveal }: Readonly<PayoutDetailFieldsProps>) {
  const { watch } = useFormContext();
  const [method, country] = watch(['method', 'country']) as [PayoutMethod, string];
  return (
    <>
      {fieldsFor(method, country).map((spec) => (
        <DetailField key={spec.field} spec={spec} row={row} reveal={reveal} />
      ))}
    </>
  );
}
