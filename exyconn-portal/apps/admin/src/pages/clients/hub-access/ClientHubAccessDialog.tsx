import { useT } from '@exyconn/i18n';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { Divider, Stack } from '@exyconn/shell/components/ui';
import { ClientHubAccessPanel } from './ClientHubAccessPanel';
import { ClientProjectsPicker } from './ClientProjectsPicker';

interface ClientHubAccessDialogProps {
  client: { id: string; name: string } | null;
  onClose: () => void;
}

/** Admin › Clients › key icon: who has client hub access, and the projects they follow there. */
export function ClientHubAccessDialog({ client, onClose }: Readonly<ClientHubAccessDialogProps>) {
  const t = useT();
  const title = client ? t('Client hub access — {name}', { name: client.name }) : '';
  return (
    <CrudDialog open={client !== null} title={title} onClose={onClose}>
      {client && (
        <Stack spacing={2}>
          <ClientHubAccessPanel clientId={client.id} />
          <Divider />
          <ClientProjectsPicker clientId={client.id} />
        </Stack>
      )}
    </CrudDialog>
  );
}
