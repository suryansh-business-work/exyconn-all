import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { RhfChipsInput, RhfMultiSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useUpdateItSettingsMutation } from '@exyconn/shell/graphql/generated';
import { itSettingsSchema, toItSettingsValues } from './it-settings.schema';
import type { ItSettingsRow, ItSettingsValues } from './it-settings.types';

interface ItSettingsFormProps {
  settings: ItSettingsRow;
  onSaved: () => void;
}

/**
 * React Hook Form + Zod form for what the IT screens would otherwise hard-code: the
 * applications access can be requested for, the ones every joiner gets, the helpdesk's ticket
 * topics, and how far ahead expiries are flagged.
 */
export function ItSettingsForm({ settings, onSaved }: Readonly<ItSettingsFormProps>) {
  const notify = useNotify();
  const [save] = useUpdateItSettingsMutation();
  const methods = useForm<z.input<typeof itSettingsSchema>, unknown, ItSettingsValues>({
    resolver: zodResolver(itSettingsSchema),
    defaultValues: toItSettingsValues(settings),
  });
  const applications = useWatch({ control: methods.control, name: 'applications' }) ?? [];
  const onboardingOptions = applications.map((app) => ({ value: app, label: app }));

  const onSubmit = async (values: ItSettingsValues) => {
    try {
      const { data } = await save({ variables: { input: values } });
      methods.reset(toItSettingsValues(data?.updateItSettings));
      notify('IT settings saved');
      onSaved();
    } catch (error) {
      notify(errorMessage(error, 'Could not save the settings'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={() => methods.reset(toItSettingsValues(settings))}
      submitLabel="Save settings"
    >
      <RhfChipsInput
        name="applications"
        label="Applications"
        helperText="What access requests may name. Press Enter after each."
      />
      <RhfMultiSelect
        name="onboardingApplications"
        label="Given to every new joiner"
        options={onboardingOptions}
      />
      <RhfChipsInput
        name="ticketTopics"
        label="Helpdesk ticket topics"
        helperText="e.g. Hardware, VPN, Email. Press Enter after each."
      />
      <RhfTextField
        name="warrantyWarningDays"
        label="Warn about warranties (days ahead)"
        type="number"
      />
      <RhfTextField
        name="renewalWarningDays"
        label="Warn about renewals (days ahead)"
        type="number"
      />
      <RhfTextField
        name="certificateWarningDays"
        label="Warn about domains and certificates (days ahead)"
        type="number"
      />
    </EntityForm>
  );
}
