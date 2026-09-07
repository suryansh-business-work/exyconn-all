import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfAutocomplete, RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useListEmployeeOptionsQuery,
  useListOnboardingTemplatesQuery,
  useStartOnboardingMutation,
} from '@exyconn/shell/graphql/generated';

const schema = z.object({
  employeeId: z.string().min(1, 'Choose the employee joining'),
  templateId: z.string().min(1, 'Choose a template'),
});
type Values = z.infer<typeof schema>;

interface StartOnboardingFormProps {
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Starts one joiner's onboarding from a template.
 *
 * Only templates that are still offered are listed: a retired template is one HR decided
 * not to use again, and starting somebody on it would be a checklist nobody meant to give.
 */
export function StartOnboardingForm({ onDone, onCancel }: Readonly<StartOnboardingFormProps>) {
  const notify = useNotify();
  const [startOnboarding] = useStartOnboardingMutation();
  const { data: peopleData } = useListEmployeeOptionsQuery();
  const { data: templateData } = useListOnboardingTemplatesQuery();

  const employeeOptions = (peopleData?.listEmployeeOptions ?? []).map((person) => ({
    value: person.id,
    label: `${person.name} (${person.email})`,
  }));
  const templates = (templateData?.listOnboardingTemplates ?? []).filter((row) => row.active);
  const templateOptions = templates.map((template) => ({
    value: template.id,
    label: `${template.name} — ${template.taskCount} tasks`,
  }));

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: '', templateId: '' },
  });

  const onSubmit = async (values: Values) => {
    try {
      await startOnboarding({ variables: values });
      notify('Onboarding started — the employee has been told');
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not start onboarding', 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Start onboarding"
    >
      <Text size="sm" color="text.secondary">
        The template&apos;s tasks are copied onto the joiner and dated from their join date. An
        employee can only have one unfinished checklist at a time.
      </Text>
      <RhfAutocomplete name="employeeId" label="Employee" options={employeeOptions} />
      <RhfSelect
        name="templateId"
        label="Template"
        options={templateOptions}
        helperText={
          templateOptions.length ? undefined : 'Add a template in HR → Onboarding Templates first.'
        }
      />
    </EntityForm>
  );
}
