import { useForm } from 'react-hook-form';
import { zodResolver } from '@exyconn/shell/components/form/zodResolver';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { Box, Flex, Text } from '@exyconn/shell/components/ui';
import { RhfSelect } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  MaActionStatus,
  MaPriority,
  useMaBulkUpdateActionItemsMutation,
} from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';
import type { ActionBulkInput, ActionBulkValues } from './action-bulk.types';

const schema = z
  .object({
    status: z.union([z.enum(MaActionStatus), z.literal('')]),
    priority: z.union([z.enum(MaPriority), z.literal('')]),
  })
  .refine((values) => values.status || values.priority, {
    message: 'Pick a status or a priority to set',
    path: ['status'],
  });

/** The values as the bulk mutation takes them: a field left as it is is not sent. */
export function toBulkInput(ids: string[], values: ActionBulkValues): ActionBulkInput {
  return { ids, status: values.status || undefined, priority: values.priority || undefined };
}

interface ActionBulkFormProps {
  ids: string[];
  onDone: () => void;
  onCancel: () => void;
}

/** Sets the status and/or priority of every selected action item at once. */
export function ActionBulkForm({ ids, onDone, onCancel }: Readonly<ActionBulkFormProps>) {
  const t = useT();
  const [bulkUpdate] = useMaBulkUpdateActionItemsMutation();
  const runNotified = useRunNotified();
  const methods = useForm<ActionBulkValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { status: '', priority: '' },
  });
  const options = (values: string[]) => [
    { value: '', label: t('Leave as it is') },
    ...enumOptions(values).map((option) => ({ ...option, label: t(option.label) })),
  ];

  const onSubmit = async (values: ActionBulkValues) => {
    const done = await runNotified(
      () => bulkUpdate({ variables: { input: toBulkInput(ids, values) } }),
      '{count} action items updated',
      { count: ids.length },
    );
    if (done) {
      onDone();
    }
  };

  return (
    <Box sx={{ mb: 2 }}>
      <EntityForm
        methods={methods}
        onSubmit={onSubmit}
        isEdit={false}
        onCancel={onCancel}
        submitLabel="Apply to selected"
      >
        <Text size="sm" role="status">
          {t('{count} selected', { count: ids.length })}
        </Text>
        <Flex direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <RhfSelect
            name="status"
            label="Set status"
            options={options(Object.values(MaActionStatus))}
            helperText="Applied to every selected item; leave as it is to keep each one's status."
          />
          <RhfSelect
            name="priority"
            label="Set priority"
            options={options(Object.values(MaPriority))}
            helperText="Applied to every selected item; leave as it is to keep each one's priority."
          />
        </Flex>
      </EntityForm>
    </Box>
  );
}
