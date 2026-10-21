import { useForm } from 'react-hook-form';
import { zodResolver } from '@/components/form/zodResolver';
import { EntityForm } from '@/components/form/EntityForm';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useAssignLegalItemsMutation } from '@/graphql/generated';
import { AssignableItemsField } from './AssignableItemsField';
import {
  assignLegalSchema,
  toAssignItems,
  type AssignLegalFormValues,
  type LegalAssignableRow,
} from './assign-legal.types';

interface AssignLegalFormProps {
  employeeId: string;
  /** What can still be handed over: everything the employee does not already hold. */
  options: readonly LegalAssignableRow[];
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form that hands contracts, policies and documents to one employee.
 * They then appear on the employee's own profile.
 */
export function AssignLegalForm({
  employeeId,
  options,
  onDone,
  onCancel,
}: Readonly<AssignLegalFormProps>) {
  const notify = useNotify();
  // The employee's list re-reads once the server has the new items.
  const [assign] = useAssignLegalItemsMutation({
    refetchQueries: ['EmployeeLegalAssignments'],
    awaitRefetchQueries: true,
  });
  const methods = useForm<AssignLegalFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(assignLegalSchema),
    defaultValues: { items: [] },
  });

  const onSubmit = async (values: AssignLegalFormValues) => {
    try {
      await assign({
        variables: { userId: employeeId, items: toAssignItems(values.items, options) },
      });
      notify('Assigned — the employee sees them on their profile');
      onDone();
    } catch (err) {
      notify(errorMessage(err, 'Could not assign'), 'error');
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit={false}
      submitLabel="Assign"
      onCancel={onCancel}
    >
      <AssignableItemsField options={options} />
    </EntityForm>
  );
}
