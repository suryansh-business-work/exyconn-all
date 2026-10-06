import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useClientProjectOptionsQuery } from '@exyconn/shell/graphql/generated';
import {
  clientSchema,
  toClientValues,
  type ClientFormValues,
  type ClientRow,
} from './client.types';
import { ClientContactFields } from './client-contact.fields';
import { ClientLocationFields } from './client-location.fields';
import { ClientTaxFields } from './client-tax.fields';
import { ClientProjectsFields } from './client-projects.fields';
import { useClientSave } from './useClientSave';

interface ClientFormProps {
  initial: ClientRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form to create or update a client: contact, location, tax
 * registration (the kinds of number its country issues) and the projects linked to it.
 */
export function ClientForm({ initial, onDone, onCancel }: Readonly<ClientFormProps>) {
  const { data, loading } = useClientProjectOptionsQuery({ fetchPolicy: 'cache-and-network' });
  const projects = data?.clientProjectOptions;
  const methods = useForm<ClientFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(clientSchema),
    defaultValues: toClientValues(initial, []),
  });
  const onSubmit = useClientSave(initial, onDone);

  // The projects arrive after the form opens; preselect the ones already linked to this
  // client, unless somebody has started picking.
  const { getFieldState, setValue } = methods;
  useEffect(() => {
    if (!initial || !projects || getFieldState('projectIds').isDirty) {
      return;
    }
    const linked = projects.filter((project) => project.clientId === initial.id);
    setValue(
      'projectIds',
      linked.map((project) => project.id),
    );
  }, [initial, projects, getFieldState, setValue]);

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={Boolean(initial)} onCancel={onCancel}>
      <ClientContactFields />
      <ClientLocationFields />
      <ClientTaxFields />
      <ClientProjectsFields
        clientId={initial?.id ?? null}
        projects={projects ?? []}
        loading={loading && !projects}
      />
    </EntityForm>
  );
}
