import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfDatePicker } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useConvertLeadMutation } from '@exyconn/shell/graphql/generated';
import type { ConvertLeadTarget } from './convert-lead.types';

const schema = z.object({
  companyName: z.string().trim().min(1, 'Company is required'),
  dealTitle: z.string().trim().min(1, 'Deal title is required'),
  value: z.coerce.number({ message: 'Value must be a number' }).min(0, 'Value cannot be negative'),
  expectedCloseDate: z.date().nullable(),
  contactName: z.string().trim().min(1, 'Contact name is required'),
  contactEmail: z.string().trim().min(1, 'Contact email is required').email('Enter a valid email'),
});
type Values = z.infer<typeof schema>;

const toInitial = (lead: ConvertLeadTarget): Values => ({
  companyName: '',
  dealTitle: `${lead.name} opportunity`,
  value: lead.value,
  expectedCloseDate: null,
  contactName: lead.name,
  contactEmail: lead.email,
});

interface ConvertLeadFormProps {
  lead: ConvertLeadTarget;
  /** Runs after the deal exists — the page uses it to open the pipeline. */
  onDone: () => void;
  onCancel: () => void;
}

/**
 * Turns a lead into a company, a contact and a deal in one step. The company is
 * matched by name (or by the lead's email domain) before one is created, so
 * converting a second lead from the same account does not duplicate it.
 */
export function ConvertLeadForm({ lead, onDone, onCancel }: Readonly<ConvertLeadFormProps>) {
  const notify = useNotify();
  const [convertLead] = useConvertLeadMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(lead),
  });

  const onSubmit = async (values: Values) => {
    try {
      const res = await convertLead({
        variables: {
          id: lead.id,
          input: {
            ...values,
            expectedCloseDate: values.expectedCloseDate?.toISOString() ?? null,
          },
        },
      });
      notify(`Deal "${res.data?.convertLead.title ?? values.dealTitle}" created`);
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Conversion failed'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      onCancel={onCancel}
      submitLabel="Convert"
    >
      <Text size="sm" color="text.secondary">
        Converting “{lead.name}” marks the lead won and opens a deal at the top of the pipeline.
      </Text>
      <RhfTextField
        name="companyName"
        label="Company"
        helperText="An existing company with this name, or on the lead's email domain, is reused."
      />
      <RhfTextField name="contactName" label="Contact name" />
      <RhfTextField name="contactEmail" label="Contact email" type="email" />
      <RhfTextField name="dealTitle" label="Deal title" />
      <RhfTextField name="value" label="Deal value" type="number" />
      <RhfDatePicker name="expectedCloseDate" label="Expected close" />
    </EntityForm>
  );
}
