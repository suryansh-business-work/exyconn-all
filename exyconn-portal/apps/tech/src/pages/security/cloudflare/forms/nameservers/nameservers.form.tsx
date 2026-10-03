import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DOMAIN } from '@exyconn/regex';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { EntityForm } from '@exyconn/shell/components/form/EntityForm';
import type { NameserversFormValues } from './nameservers.types';

/** Registries accept between two and thirteen nameservers. */
const MIN_NAMESERVERS = 2;
const MAX_NAMESERVERS = 13;

/** The typed lines as host names: trimmed, lower case, without a trailing dot or blanks. */
export const nameServerLines = (value: string): string[] =>
  value
    .split('\n')
    .map((line) => line.trim().toLowerCase().replace(/\.$/, ''))
    .filter((line) => line !== '');

const schema = z.object({
  nameServers: z
    .string()
    .refine((value) => nameServerLines(value).length >= MIN_NAMESERVERS, {
      message: `Enter at least ${MIN_NAMESERVERS} nameservers, one per line`,
    })
    .refine((value) => nameServerLines(value).length <= MAX_NAMESERVERS, {
      message: `Enter at most ${MAX_NAMESERVERS} nameservers`,
    })
    .refine((value) => nameServerLines(value).every((host) => DOMAIN.test(host)), {
      message: 'Each line must be a host name, e.g. ns1.example.com',
    }),
});

interface NameserversFormProps {
  /** Prefilled with the nameservers the registry holds now. */
  current: readonly string[];
  onSubmit: (nameServers: string[]) => Promise<void>;
  onCancel: () => void;
}

/** React Hook Form + Zod form for pointing a domain at nameservers of your own choosing. */
export function NameserversForm({ current, onSubmit, onCancel }: Readonly<NameserversFormProps>) {
  const methods = useForm<NameserversFormValues>({
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: { nameServers: current.join('\n') },
  });

  return (
    <EntityForm
      methods={methods}
      onSubmit={(values) => onSubmit(nameServerLines(values.nameServers))}
      isEdit
      onCancel={onCancel}
      submitLabel="Set nameservers"
    >
      <RhfTextField
        name="nameServers"
        label="Nameservers"
        multiline
        minRows={4}
        helperText="One host per line. The registry applies the change within minutes; resolvers follow as caches expire (up to 48 hours)."
      />
    </EntityForm>
  );
}
