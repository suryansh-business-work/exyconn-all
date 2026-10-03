import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  RhfRichText,
  RhfTextField,
  RhfSelect,
  RhfDatePicker,
} from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import { RichTextDownload } from '@exyconn/shell/components/form/RichTextDownload';
import { useEntitySave } from '@exyconn/shell/components/form/useEntitySave';
import { Flex } from '@exyconn/shell/components/ui';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import {
  ContractType,
  ContractStatus,
  useCreateContractMutation,
  useGetContractBodyQuery,
  useUpdateContractMutation,
} from '@exyconn/shell/graphql/generated';
import { BodyGate } from '../BodyGate';
import { legalBody } from '../body.schema';
import type { ContractFormValues, ContractRow } from './contract.types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  party: z.string().trim().min(1, 'Party is required'),
  type: z.nativeEnum(ContractType),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  expiryDate: z.string().min(1, 'Expiry date is required'),
  status: z.nativeEnum(ContractStatus),
  // The file a counterparty is asked to read. Optional, because a contract is often drafted
  // before there is a PDF of it — but a signature request refuses to go out without one.
  documentUrl: z.string().trim(),
  content: legalBody,
});
type Values = z.infer<typeof schema>;

const toInitial = (row: ContractRow | null, content: string): ContractFormValues => ({
  title: row?.title ?? '',
  party: row?.party ?? '',
  type: row?.type ?? ContractType.Nda,
  effectiveDate: row?.effectiveDate ?? '',
  expiryDate: row?.expiryDate ?? '',
  status: row?.status ?? ContractStatus.Draft,
  documentUrl: row?.documentUrl ?? '',
  content,
});

interface ContractFormProps {
  initial: ContractRow | null;
  onDone: () => void;
  onCancel: () => void;
}

/** The fields, once the contract's text is in hand. */
function ContractFields({
  initial,
  content,
  onDone,
  onCancel,
}: Readonly<ContractFormProps & { content: string }>) {
  const [createContract] = useCreateContractMutation();
  const [updateContract] = useUpdateContractMutation();
  const methods = useForm<Values>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: toInitial(initial, content),
  });
  const [title, body] = useWatch({ control: methods.control, name: ['title', 'content'] });

  const { isEdit, onSubmit } = useEntitySave({
    label: 'Contract',
    initial,
    create: (values: Values) => createContract({ variables: { input: values } }),
    update: (row, values) => updateContract({ variables: { id: row.id, input: values } }),
    onDone,
  });

  return (
    <EntityForm methods={methods} onSubmit={onSubmit} isEdit={isEdit} onCancel={onCancel}>
      <RhfTextField name="title" label="Title" />
      <RhfTextField name="party" label="Counterparty" />
      <RhfSelect name="type" label="Type" options={enumOptions(Object.values(ContractType))} />
      <RhfDatePicker name="effectiveDate" label="Effective date" />
      <RhfDatePicker name="expiryDate" label="Expiry date" />
      <RhfSelect
        name="status"
        label="Status"
        options={enumOptions(Object.values(ContractStatus))}
      />
      <RhfRichText
        name="content"
        label="Contract text"
        helperText="Draft the contract here, then download it as a PDF or Word file."
        folder="legal-contracts"
        minHeight={360}
      />
      <Flex justifyContent="flex-end">
        <RichTextDownload title={title} html={body} />
      </Flex>
      <RhfTextField
        name="documentUrl"
        label="Document URL"
        helperText="The PDF a counterparty reads before signing. Its bytes are hashed at the moment they sign."
      />
    </EntityForm>
  );
}

/**
 * React Hook Form + Zod form to create or update a contract, its text drafted in the
 * rich-text editor. Editing loads the text first — the grid row does not carry it.
 */
export function ContractForm({ initial, onDone, onCancel }: Readonly<ContractFormProps>) {
  const { data, loading, error } = useGetContractBodyQuery({
    variables: { id: initial?.id ?? '' },
    skip: !initial,
    fetchPolicy: 'network-only',
  });
  return (
    <BodyGate loading={loading} error={error}>
      <ContractFields
        initial={initial}
        content={data?.getContract.content ?? ''}
        onDone={onDone}
        onCancel={onCancel}
      />
    </BodyGate>
  );
}
