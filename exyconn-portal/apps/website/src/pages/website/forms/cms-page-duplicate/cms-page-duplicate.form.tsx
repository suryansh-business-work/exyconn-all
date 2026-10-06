import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Dialog, DialogContent, DialogTitle } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { useDuplicateCmsPageMutation } from '@exyconn/shell/graphql/generated';
import {
  duplicateSchema,
  type DuplicateFormValues,
  type DuplicateSource,
} from './cms-page-duplicate.types';

interface DuplicatePageFormProps {
  /** The page to copy; null keeps the dialog closed. */
  source: DuplicateSource | null;
  onClose: () => void;
  onDone: () => void;
}

const copyPath = (path: string) => (path === '/' ? '/home-copy' : `${path}-copy`);

/** Copies a page's draft to a new path (the copy starts unpublished). */
export function DuplicatePageForm({ source, onClose, onDone }: Readonly<DuplicatePageFormProps>) {
  const t = useT();
  const [duplicate] = useDuplicateCmsPageMutation();
  const methods = useForm<DuplicateFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(duplicateSchema),
    defaultValues: { path: '' },
  });
  const { reset } = methods;
  useEffect(() => reset({ path: source ? copyPath(source.path) : '' }), [source, reset]);

  const { onSubmit } = useEntitySave<DuplicateFormValues, null>({
    label: 'Page copy',
    initial: null,
    create: (values) => duplicate({ variables: { id: source?.id ?? '', path: values.path } }),
    update: () => Promise.resolve(),
    onDone,
  });

  return (
    <Dialog
      open={source !== null}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="duplicate-title"
    >
      <DialogTitle id="duplicate-title">
        {t('Duplicate {title}', { title: source?.title ?? '' })}
      </DialogTitle>
      <DialogContent>
        <EntityForm
          methods={methods}
          onSubmit={onSubmit}
          isEdit={false}
          onCancel={onClose}
          submitLabel="Duplicate"
        >
          <RhfTextField name="path" label="New path" helperText="Where the copy will live." />
        </EntityForm>
      </DialogContent>
    </Dialog>
  );
}
