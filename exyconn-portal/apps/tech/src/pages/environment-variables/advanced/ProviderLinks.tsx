import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useT } from '@exyconn/i18n';
import { Box, Button, Flex, IconButton, Link, Text, Tooltip } from '@exyconn/shell/components/ui';
import { CrudDialog } from '@exyconn/shell/components/data/CrudDialog';
import { useConfirm } from '@exyconn/shell/components/feedback/ConfirmProvider';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { useDeleteTechProviderLinkMutation } from '@exyconn/shell/graphql/generated';
import { ProviderLinkForm, type ProviderLinkRow } from './forms/provider-link';
import { LINK_KIND_LABELS } from './provider-link-kinds';

interface LinkLineProps {
  link: ProviderLinkRow;
  onEdit: (link: ProviderLinkRow) => void;
  onRemove: (link: ProviderLinkRow) => void;
}

/** One link: its kind, the address, and edit/remove for the team's own. */
function LinkLine({ link, onEdit, onRemove }: Readonly<LinkLineProps>) {
  const t = useT();
  return (
    <Flex direction="row" alignItems="center" spacing={1} wrap>
      <Text size="sm" color="text.secondary" sx={{ minWidth: 110 }}>
        {t(LINK_KIND_LABELS[link.kind].label)}
      </Text>
      <Link href={link.url} target="_blank" rel="noopener noreferrer">
        {t(link.label)} <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
      </Link>
      {link.custom && (
        <>
          <Tooltip title={t('Edit')}>
            <IconButton size="small" aria-label={t('edit')} onClick={() => onEdit(link)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('Remove')}>
            <IconButton size="small" aria-label={t('remove')} onClick={() => onRemove(link)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      )}
    </Flex>
  );
}

/** The provider's consoles: the built-in ones, then the team's own (editable). */
export function ProviderLinks({
  provider,
  links,
}: Readonly<{ provider: string; links: readonly ProviderLinkRow[] }>) {
  const t = useT();
  const confirm = useConfirm();
  const notify = useNotify();
  const [editing, setEditing] = useState<ProviderLinkRow | null | undefined>(undefined);
  const [remove] = useDeleteTechProviderLinkMutation({ refetchQueries: ['TechProviderProfile'] });
  const close = () => setEditing(undefined);

  const removeLink = async (link: ProviderLinkRow) => {
    const ok = await confirm({
      title: 'Remove link',
      message: 'Remove the link "{label}"?',
      messageValues: { label: link.label },
      confirmText: 'Remove',
      destructive: true,
    });
    if (!ok) {
      return;
    }
    try {
      await remove({ variables: { provider, id: link.id } });
      notify('Link removed');
    } catch (err) {
      notify(errorMessage(err, 'Could not remove the link'), 'error');
    }
  };

  return (
    <Box>
      <Flex direction="row" justifyContent="space-between" alignItems="center" wrap spacing={1}>
        <Text weight="medium">{t('Links: console, usage and billing')}</Text>
        <Button size="small" startIcon={<AddIcon />} onClick={() => setEditing(null)}>
          {t('Add link')}
        </Button>
      </Flex>
      <Flex direction="column" spacing={0.5} sx={{ mt: 1 }}>
        {links.length === 0 && <Text size="sm">{t('No links yet.')}</Text>}
        {links.map((link) => (
          <LinkLine
            key={link.id}
            link={link}
            onEdit={setEditing}
            onRemove={(row) => {
              removeLink(row).catch((err: unknown) =>
                notify(errorMessage(err, 'Could not remove'), 'error'),
              );
            }}
          />
        ))}
      </Flex>
      <CrudDialog
        open={editing !== undefined}
        title={editing ? t('Edit link') : t('Add link')}
        onClose={close}
      >
        {editing !== undefined && (
          <ProviderLinkForm provider={provider} initial={editing} onDone={close} onCancel={close} />
        )}
      </CrudDialog>
    </Box>
  );
}
