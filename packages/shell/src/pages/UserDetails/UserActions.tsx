import { useState } from 'react';
import { Button, Flex, Paper, Text } from '@/components/ui';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { CrudDialog } from '@/components/data/CrudDialog';
import { glass } from '@/components/glass/glass';
import { UserForm } from '../user-forms/user';
import { CustomMailForm } from '../user-forms/custom-mail';
import { BlockUserForm } from '../user-forms/block-user';
import { useUserActions } from './useUserActions';
import type { UserDetail } from './user-details.types';

type ActiveDialog = 'edit' | 'mail' | 'block' | null;

interface UserActionsProps {
  user: UserDetail;
  onChanged: () => void;
}

/** Administrative action panel for a single user (credentials, status, mail). */
export function UserActions({ user, onChanged }: UserActionsProps) {
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const { handleResetPassword, handleToggleActive, handleUnblock } = useUserActions(
    user.id,
    user.name,
    onChanged,
  );
  const close = () => setDialog(null);
  const done = () => {
    close();
    onChanged();
  };

  return (
    <Paper sx={[glass, { p: 3 }]}>
      <Text size="overline" color="text.secondary">
        Actions
      </Text>
      <Flex direction="column" spacing={1.5} sx={{ mt: 1 }}>
        <Button startIcon={<VpnKeyIcon />} variant="outlined" onClick={handleResetPassword}>
          Reset &amp; send credentials
        </Button>
        <Button startIcon={<EmailIcon />} variant="outlined" onClick={() => setDialog('mail')}>
          Send custom email
        </Button>
        <Button startIcon={<EditIcon />} variant="outlined" onClick={() => setDialog('edit')}>
          Edit details
        </Button>
        <Button
          startIcon={user.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
          color={user.isActive ? 'warning' : 'success'}
          variant="outlined"
          onClick={() => handleToggleActive(!user.isActive)}
        >
          {user.isActive ? 'Deactivate' : 'Activate'}
        </Button>
        <Button
          startIcon={user.isBlocked ? <LockOpenIcon /> : <BlockIcon />}
          color="error"
          variant="outlined"
          onClick={() => (user.isBlocked ? handleUnblock() : setDialog('block'))}
        >
          {user.isBlocked ? 'Unblock' : 'Temporarily block'}
        </Button>
      </Flex>

      <CrudDialog open={dialog === 'edit'} title="Edit user" onClose={close}>
        <UserForm initial={user} onCancel={close} onDone={done} />
      </CrudDialog>
      <CrudDialog open={dialog === 'mail'} title={`Email ${user.name}`} onClose={close}>
        <CustomMailForm userId={user.id} onCancel={close} onDone={close} />
      </CrudDialog>
      <CrudDialog open={dialog === 'block'} title={`Block ${user.name}`} onClose={close}>
        <BlockUserForm userId={user.id} onCancel={close} onDone={done} />
      </CrudDialog>
    </Paper>
  );
}
