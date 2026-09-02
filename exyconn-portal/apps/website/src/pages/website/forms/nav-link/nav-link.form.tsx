import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, RhfSwitch } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateNavLinkMutation,
  useUpdateNavLinkMutation,
} from '@exyconn/shell/graphql/generated';
import { NAV_CATEGORIES, toOptions } from '../../website.constants';
import type { NavLinkRow } from './nav-link.types';

const schema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  href: z.string().trim().min(1, 'Link URL is required'),
  description: z.string().trim(),
  category: z.string().trim().min(1, 'Category is required'),
  keywords: z.string().trim(),
  isActive: z.boolean(),
  order: z.coerce.number({ message: 'Order must be a number' }).min(0, 'Must be ≥ 0'),
});
type Values = z.infer<typeof schema>;

const CATEGORY_OPTIONS = toOptions(NAV_CATEGORIES);

const toInitial = (row: NavLinkRow | null): Values => ({
  label: row?.label ?? '',
  href: row?.href ?? '',
  description: row?.description ?? '',
  category: row?.category ?? '',
  keywords: row?.keywords ?? '',
  isActive: row?.isActive ?? true,
  order: row?.order ?? 0,
});

interface NavLinkFormProps {
  initial: NavLinkRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update a website navigation link. */
export function NavLinkForm({ initial, onDone, onCancel }: Readonly<NavLinkFormProps>) {
  const notify = useNotify();
  const [createNavLink] = useCreateNavLinkMutation();
  const [updateNavLink] = useUpdateNavLinkMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<z.input<typeof schema>, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    try {
      if (isEdit && initial) await updateNavLink({ variables: { id: initial.id, input: values } });
      else await createNavLink({ variables: { input: values } });
      notify(`Nav link ${isEdit ? 'updated' : 'created'}`);
      onDone();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} noValidate>
        <Flex direction="column" spacing={2.5}>
          <RhfTextField name="label" label="Label" />
          <RhfTextField name="href" label="Link URL" helperText="e.g. /services/ai-consulting" />
          <RhfTextField name="description" label="Description" multiline minRows={2} />
          <RhfSelect name="category" label="Category" options={CATEGORY_OPTIONS} />
          <RhfTextField
            name="keywords"
            label="Keywords"
            helperText="Comma-separated search keywords."
          />
          <RhfTextField name="order" label="Order" type="number" />
          <RhfSwitch name="isActive" label="Active" />
          <FormActions
            submitting={methods.formState.isSubmitting}
            isEdit={isEdit}
            onCancel={onCancel}
          />
        </Flex>
      </form>
    </FormProvider>
  );
}
