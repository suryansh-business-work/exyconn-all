import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfTextField, RhfSelect, RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  SupportCategory,
  useCreateCannedReplyMutation,
  useUpdateCannedReplyMutation,
} from '@exyconn/shell/graphql/generated';
import type { CannedReplyRow } from './canned-reply.types';

const schema = z.object({
  title: z.string().trim().min(3, 'Name it for what it does — "Ask for a screenshot"'),
  category: z.nativeEnum(SupportCategory),
  body: z.string().trim().min(10, 'A snippet this short is quicker to type than to find'),
  isActive: z.boolean(),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: CannedReplyRow | null): Values => ({
  title: row?.title ?? '',
  category: row?.category ?? SupportCategory.Other,
  body: row?.body ?? '',
  isActive: row?.isActive ?? true,
});

interface CannedReplyFormProps {
  initial: CannedReplyRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/**
 * React Hook Form + Zod form for a canned reply.
 *
 * The title is what an agent picks it by under time pressure, so it is validated as an
 * intent rather than a label — a snippet called "Reply 4" is one nobody will ever find.
 */
export function CannedReplyForm({ initial, onDone, onCancel }: Readonly<CannedReplyFormProps>) {
  const [createReply] = useCreateCannedReplyMutation();
  const [updateReply] = useUpdateCannedReplyMutation();
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Canned reply',
    initial,
    create: (values: Values) => createReply({ variables: { input: values } }),
    update: (row, values) => updateReply({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Snippet name" />
      <RhfSelect
        name="category"
        label="Category"
        options={enumOptions(Object.values(SupportCategory))}
      />
      <RhfTextField name="body" label="Text" multiline rows={6} />
      {/* A retired snippet stays in the register but is not offered in the composer. */}
      <RhfSwitch name="isActive" label="Offer in the composer" />
    </EntityForm>
  );
}
