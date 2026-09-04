import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RhfRichText, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import type { DocPageRow } from './doc-page.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  body: z.string(),
});
type Values = z.infer<typeof schema>;

const toInitial = (page: DocPageRow): Values => ({ title: page.title, body: page.body });

interface DocPageFormProps {
  page: DocPageRow;
  onSubmit: (values: Values) => Promise<void>;
  onCancel: () => void;
}

/**
 * The page editor: a title and a body, nothing else. A wiki page is mostly its prose, so the
 * form gets out of the way — the same rich-text field the rest of the portal writes with.
 *
 * The form is re-seeded when a different page is opened, because the editor stays mounted
 * while the selection moves around the tree.
 */
export function DocPageForm({ page, onSubmit, onCancel }: Readonly<DocPageFormProps>) {
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(page),
  });
  const { reset } = methods;

  useEffect(() => {
    reset(toInitial(page));
  }, [page, reset]);

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Save page"
    >
      <RhfTextField name="title" label="Title" />
      <RhfRichText name="body" label="Page" />
    </EntityForm>
  );
}
