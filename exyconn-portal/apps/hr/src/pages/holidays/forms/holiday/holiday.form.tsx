import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfAutocomplete,
  RhfChipsInput,
  RhfDatePicker,
  RhfMultiSelect,
  RhfSelect,
  RhfTextField,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { useCountryOptions } from '@exyconn/shell/components/localization';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  HolidayType,
  useCreateHolidayMutation,
  useUpdateHolidayMutation,
} from '@exyconn/shell/graphql/generated';
import type { HolidayRow } from './holiday.types';

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.nativeEnum(HolidayType),
  description: z.string().trim(),
  // Empty is a holiday the whole company observes.
  country: z.string(),
  excludedCountries: z.array(z.string()),
  // Empty is the whole country. Only a country holiday can be narrowed to cities.
  cities: z.array(z.string().trim().min(1).max(100, 'Keep city names under 100 characters')),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: HolidayRow | null) => ({
  name: row?.name ?? '',
  date: row?.date ?? '',
  type: row?.type ?? Object.values(HolidayType)[0],
  description: row?.description ?? '',
  country: row?.country ?? '',
  excludedCountries: row?.excludedCountries ?? [],
  cities: row?.cities ?? [],
});

/** The empty country: every country observes it. */
const ALL_COUNTRIES: SelectOption = { value: '', label: 'All countries' };

/**
 * Empty optional inputs are "not set", which the API models as null. Opt-outs only mean
 * something on a company-wide holiday and cities only on a country one, so neither kind
 * carries the other's stale values.
 */
const toInput = (values: Values) => {
  const companyWide = values.country === '';
  return {
    ...values,
    description: values.description === '' ? null : values.description,
    excludedCountries: companyWide ? values.excludedCountries : [],
    cities: companyWide ? [] : values.cities,
  };
};

interface HolidayFormProps {
  initial: HolidayRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a holiday. */
export function HolidayForm({ initial, onDone, onCancel }: Readonly<HolidayFormProps>) {
  const [createHoliday] = useCreateHolidayMutation();
  const [updateHoliday] = useUpdateHolidayMutation();

  const countries = useCountryOptions();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });
  const companyWide = methods.watch('country') === '';

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Holiday',
    initial,
    create: (values: Values) => createHoliday({ variables: { input: toInput(values) } }),
    update: (row, values) => updateHoliday({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="name" label="Name" />
      <RhfDatePicker name="date" label="Date" />
      <RhfSelect name="type" label="Type" options={enumOptions(Object.values(HolidayType))} />
      <RhfTextField name="description" label="Description" multiline minRows={3} />
      <RhfAutocomplete
        name="country"
        label="Country"
        options={[ALL_COUNTRIES, ...countries]}
        helperText="Pick a country for a holiday only employees there observe."
      />
      {companyWide ? (
        <RhfMultiSelect
          name="excludedCountries"
          label="Not observed in"
          options={countries}
          helperText="Countries whose employees work on this day."
        />
      ) : (
        <RhfChipsInput
          name="cities"
          label="Cities"
          helperText="Type a city and press Enter. Leave empty for the whole country."
        />
      )}
    </EntityForm>
  );
}
