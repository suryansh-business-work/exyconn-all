import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flex } from '@exyconn/shell/components/ui';
import { RhfTextField, RhfSelect, type SelectOption } from '@exyconn/shell/components/form/rhf';
import { FormActions } from '@exyconn/shell/components/form/FormActions';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import {
  useCreateImageConfigMutation,
  useUpdateImageConfigMutation,
} from '@exyconn/shell/graphql/generated';
import type { ImageConfigRow } from './image-config.types';

const BOOL_OPTIONS: SelectOption[] = [
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
];

const PROVIDER_OPTIONS: SelectOption[] = [{ value: 'imagekit', label: 'ImageKit' }];

const schema = z.object({
  label: z.string().trim().min(1, 'Label is required'),
  provider: z.string().trim().min(1, 'Provider is required'),
  publicKey: z.string().trim().min(1, 'Public key is required'),
  privateKey: z.string().trim().min(1, 'Private key is required'),
  urlEndpoint: z.string().trim().min(1, 'URL endpoint is required').url('Enter a valid URL'),
  isActive: z.enum(['true', 'false']),
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ImageConfigRow | null): Values => ({
  label: row?.label ?? '',
  provider: row?.provider ?? 'imagekit',
  publicKey: row?.publicKey ?? '',
  privateKey: row?.privateKey ?? '',
  urlEndpoint: row?.urlEndpoint ?? '',
  isActive: row ? (row.isActive ? 'true' : 'false') : 'true',
});

interface ImageConfigFormProps {
  initial: ImageConfigRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** React Hook Form + Zod form to create or update an image-upload (ImageKit) config. */
export function ImageConfigForm({ initial, onDone, onCancel }: ImageConfigFormProps) {
  const notify = useNotify();
  const [createConfig] = useCreateImageConfigMutation();
  const [updateConfig] = useUpdateImageConfigMutation();
  const isEdit = Boolean(initial);
  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial),
  });

  const onSubmit = async (values: Values) => {
    const input = {
      label: values.label,
      provider: values.provider,
      publicKey: values.publicKey,
      privateKey: values.privateKey,
      urlEndpoint: values.urlEndpoint,
      isActive: values.isActive === 'true',
    };
    try {
      if (isEdit && initial) await updateConfig({ variables: { id: initial.id, input } });
      else await createConfig({ variables: { input } });
      notify(`Image config ${isEdit ? 'updated' : 'created'}`);
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
          <RhfSelect name="provider" label="Provider" options={PROVIDER_OPTIONS} />
          <RhfTextField name="publicKey" label="Public key" />
          <RhfTextField name="privateKey" label="Private key" type="password" />
          <RhfTextField name="urlEndpoint" label="URL endpoint" />
          <RhfSelect name="isActive" label="Set as active" options={BOOL_OPTIONS} />
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
