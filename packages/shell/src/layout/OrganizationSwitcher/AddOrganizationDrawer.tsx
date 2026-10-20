import { useT } from '@exyconn/i18n';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Drawer, Flex, Heading, IconButton } from '@/components/ui';
import { OrganizationForm } from '@/pages/organizations/forms/organization';

interface AddOrganizationDrawerProps {
  open: boolean;
  onClose: () => void;
  /** Called once the company exists (and its people are invited). */
  onCreated: () => void;
}

/** The new-organization form, slid in from the side so the page beneath stays put. */
export function AddOrganizationDrawer({
  open,
  onClose,
  onCreated,
}: Readonly<AddOrganizationDrawerProps>) {
  const t = useT();
  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', md: 720 } } } }}
    >
      <Flex direction="column" sx={{ height: '100%' }}>
        <Flex
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Heading level={2} sx={{ fontSize: 'h6.fontSize' }}>
            {t('Add organization')}
          </Heading>
          <IconButton aria-label={t('Close')} onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Flex>
        <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>
          {open && <OrganizationForm initial={null} onDone={onCreated} onCancel={onClose} />}
        </Box>
      </Flex>
    </Drawer>
  );
}
