import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import {
  PAYOUT_METHOD_LABELS,
  UPI_COUNTRY,
  UPI_CURRENCY,
  type PayoutMethodList,
} from '@exyconn/payout';
import { zodResolver } from '@/components/form/zodResolver';
import { RhfAutocomplete, RhfCurrencyField, RhfSelect, RhfSwitch } from '@/components/form/rhf';
import { EntityForm } from '@/components/form/EntityForm';
import { useCountryOptions } from '@/components/localization';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { PayoutDetailFields } from './payout-account.fields';
import {
  payoutAccountSchema,
  storedSecrets,
  toFormValues,
  toPayoutInput,
} from './payout-account.schema';
import type {
  PayoutAccountApi,
  PayoutAccountFormValues,
  PayoutAccountRow,
} from './payout-account.types';

interface PayoutAccountFormProps {
  initial: PayoutAccountRow | null;
  /** The methods this kind of account may use: salary or refund. */
  methods: PayoutMethodList;
  /** Where a new account starts: the payee's country and the company's currency. */
  defaultCountry: string;
  defaultCurrency: string;
  api: PayoutAccountApi;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for one payout account. The fields follow the method and the
 * country (ISO 3166-1); sealed details already on file show masked and stay as they are when
 * left blank, and the eye fetches one in full (the server logs who looked).
 */
export function PayoutAccountForm({
  initial,
  methods: allowed,
  defaultCountry,
  defaultCurrency,
  api,
  onDone,
  onCancel,
}: Readonly<PayoutAccountFormProps>) {
  const notify = useNotify();
  const countries = useCountryOptions();
  const schema = useMemo(() => payoutAccountSchema(storedSecrets(initial)), [initial]);
  const methods = useForm<PayoutAccountFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toFormValues(initial, allowed[0], defaultCountry, defaultCurrency),
  });
  const method = methods.watch('method');

  // UPI exists only in India, in rupees: picking it sets both rather than letting the save fail.
  useEffect(() => {
    if (method === 'UPI') {
      methods.setValue('country', UPI_COUNTRY);
      methods.setValue('currency', UPI_CURRENCY);
    }
  }, [method, methods]);

  const methodOptions = allowed.map((value) => ({
    value,
    label: PAYOUT_METHOD_LABELS[value].label,
  }));

  const onSubmit = async (values: PayoutAccountFormValues) => {
    try {
      await api.save(initial?.id ?? null, toPayoutInput(values));
      notify(initial ? 'Account updated' : 'Account added');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Could not save the account'), 'error');
    }
  };

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={Boolean(initial)} onCancel={onCancel}>
      <RhfSelect
        name="method"
        label="Payment method"
        options={methodOptions}
        helperText="How the money reaches them."
        required
      />
      <RhfAutocomplete
        name="country"
        label="Country"
        options={countries}
        helperText="Where the account is held, or where the cash is collected. Decides which bank details are asked for."
      />
      <RhfCurrencyField
        helperText="The currency they are paid in (ISO 4217)."
        defaultToCompany={!initial}
      />
      <PayoutDetailFields row={initial} reveal={api.reveal} />
      <RhfSwitch name="isPrimary" label="Use this account by default" />
    </EntityForm>
  );
}
