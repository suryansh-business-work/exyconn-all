import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import {
  RhfSecretField,
  RhfTextField,
  RhfSelect,
  type SelectOption,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import {
  useCreateGoogleMapsConfigMutation,
  useUpdateGoogleMapsConfigMutation,
  TechSecret,
} from '@exyconn/shell/graphql/generated';
import { KEEP_SECRET_HINT } from '../../secret';
import { useTechSecretReveal } from '../../useTechSecretReveal';
import {
  makeGoogleMapsConfigSchema,
  type GoogleMapsConfigRow,
  type GoogleMapsConfigSchema,
  type GoogleMapsConfigValues,
} from './google-maps-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const toInput = ({ isActive, ...values }: GoogleMapsConfigValues) => ({
  ...values,
  isActive: isActive === 'true',
});

const toInitial = (row: GoogleMapsConfigRow | null): GoogleMapsConfigValues => ({
  label: row?.label ?? '',
  // Never prefilled: the API does not return them, and blank keeps the stored keys.
  browserKey: '',
  serverKey: '',
  isActive: row?.isActive === false ? 'false' : 'true',
});

interface GoogleMapsConfigFormProps {
  initial: GoogleMapsConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form for the Google Maps browser key and Places server key. */
export function GoogleMapsConfigForm({
  initial,
  onDone,
  onCancel,
}: Readonly<GoogleMapsConfigFormProps>) {
  const [createConfig] = useCreateGoogleMapsConfigMutation();
  const [updateConfig] = useUpdateGoogleMapsConfigMutation();
  const methods = useForm<z.input<GoogleMapsConfigSchema>, unknown, GoogleMapsConfigValues>({
    mode: 'onTouched',
    resolver: zodResolver(makeGoogleMapsConfigSchema(Boolean(initial))),
    defaultValues: toInitial(initial),
  });
  const revealFor = useTechSecretReveal(initial?.id);
  const { isEdit, onSubmit } = useEntitySave({
    label: 'Google Maps config',
    initial,
    create: (values: GoogleMapsConfigValues) =>
      createConfig({ variables: { input: toInput(values) } }),
    update: (row, values) => updateConfig({ variables: { id: row.id, input: toInput(values) } }),
    onDone,
  });
  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="label" label="Label" />
      <RhfSecretField
        name="browserKey"
        label="Maps JavaScript key (browser)"
        stored={initial?.hasBrowserKey}
        onReveal={revealFor(TechSecret.GoogleMapsBrowserKey)}
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'Shown to CRM users’ browsers: restrict it in Google Cloud to the CRM’s HTTP referrers and to the Maps JavaScript and Geocoding APIs'
        }
      />
      <RhfSecretField
        name="serverKey"
        label="Places API key (server)"
        stored={initial?.hasServerKey}
        onReveal={revealFor(TechSecret.GoogleMapsServerKey)}
        helperText={
          isEdit
            ? KEEP_SECRET_HINT
            : 'Used by the server only: enable Places API (New) and restrict the key to it'
        }
      />
      <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
    </EntityForm>
  );
}
