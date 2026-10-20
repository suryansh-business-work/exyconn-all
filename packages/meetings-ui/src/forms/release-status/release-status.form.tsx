import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useT } from '@exyconn/i18n';
import { HTTP_URL } from '@exyconn/regex';
import { RhfSelect, RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { MaReleaseStatus, useMaSetReleaseStatusMutation } from '@exyconn/shell/graphql/generated';
import { useRunNotified } from '../../lib/useRunNotified';
import type { ReleaseRow, ReleaseStatusInput, ReleaseStatusValues } from './release-status.types';

const MAX_NOTE = 1000;
const MAX_STORE_ID = 100;

const schema = z.object({
  status: z.enum(MaReleaseStatus),
  note: z
    .string()
    .trim()
    .min(1, 'Say why the status is changing')
    .max(MAX_NOTE, 'Keep the note under 1,000 characters'),
  storeItemId: z.string().trim().max(MAX_STORE_ID, 'Keep the item id under 100 characters'),
  storeUrl: z
    .string()
    .trim()
    .refine(
      (url) => url === '' || HTTP_URL.test(url),
      'Enter the full store address, starting https://',
    ),
});

/** The values as the server takes them: a store field left empty is not sent. */
export function toReleaseStatusInput(values: ReleaseStatusValues): ReleaseStatusInput {
  return {
    status: values.status,
    note: values.note,
    storeItemId: values.storeItemId || null,
    storeUrl: values.storeUrl || null,
  };
}

interface ReleaseStatusFormProps {
  release: ReleaseRow;
  onDone: () => void;
  onCancel: () => void;
}

/** Moves a release along its lifecycle (QA, internal, store review, published…) with a note. */
export function ReleaseStatusForm({ release, onDone, onCancel }: Readonly<ReleaseStatusFormProps>) {
  const t = useT();
  const [setStatus] = useMaSetReleaseStatusMutation();
  const runNotified = useRunNotified();
  const methods = useForm<ReleaseStatusValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: {
      status: release.status,
      note: '',
      storeItemId: release.storeItemId,
      storeUrl: release.storeUrl,
    },
  });
  const statuses = enumOptions(Object.values(MaReleaseStatus)).map((option) => ({
    ...option,
    label: t(option.label),
  }));

  const onSubmit = async (values: ReleaseStatusValues) => {
    const saved = await runNotified(
      () => setStatus({ variables: { id: release.id, input: toReleaseStatusInput(values) } }),
      'Release {version} updated',
      { version: release.version },
    );
    if (saved) {
      onDone();
    }
  };

  return (
    <EntityForm
      methods={methods}
      onSubmit={onSubmit}
      isEdit
      onCancel={onCancel}
      submitLabel="Change status"
    >
      <RhfSelect name="status" label="Status" options={statuses} />
      <RhfTextField
        name="note"
        label="Note"
        required
        multiline
        minRows={2}
        helperText="Kept in the release's history"
      />
      <RhfTextField name="storeItemId" label="Chrome Web Store item id (optional)" />
      <RhfTextField
        name="storeUrl"
        label="Chrome Web Store address (optional)"
        helperText="Only once the listing exists — it switches on the store button for everyone"
      />
    </EntityForm>
  );
}
