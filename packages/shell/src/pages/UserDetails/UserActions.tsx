import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useT } from '@exyconn/i18n';
import { Flex, IconButton, Tooltip, type IconButtonProps } from '@/components/ui';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import EditIcon from '@mui/icons-material/Edit';
import EmailIcon from '@mui/icons-material/Email';
import BlockIcon from '@mui/icons-material/Block';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import { CrudDialog } from '@/components/data/CrudDialog';

import { UserForm } from '../user-forms/user';
import { BlockUserForm } from '../user-forms/block-user';
import { useUserActions } from './useUserActions';
import { openCustomMail } from './CustomMailWindow';
import type { UserDetail } from './user-details.types';

type ActiveDialog = 'edit' | 'block' | null;

interface UserActionsProps {
  user: UserDetail;
  onChanged: () => void;
  /**
   * Where "Edit details" goes instead of opening the dialog.
   *
   * HR's employee record is a full page — a photo, an address, a brief and the working
   * arrangement do not fit a modal — so HR passes its edit route and Admin, whose record is
   * still short enough to edit in place, does not.
   */
  editPath?: string;
}

interface ActionIconProps {
  label: string;
  icon: ReactNode;
  color?: IconButtonProps['color'];
  onClick: () => void;
}

/** One toolbar action: an icon button named by its tooltip (and, for screen readers, its label). */
function ActionIcon({ label, icon, color, onClick }: Readonly<ActionIconProps>) {
  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} color={color} onClick={onClick}>
        {icon}
      </IconButton>
    </Tooltip>
  );
}

/** Administrative action toolbar for a single user (credentials, status, mail). */
export function UserActions({ user, onChanged, editPath }: Readonly<UserActionsProps>) {
  const t = useT();
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  const navigate = useNavigate();
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
  const blockLabel = user.isBlocked ? t('Unblock') : t('Temporarily block');

  return (
    <Flex spacing={0.5} flexWrap="wrap">
      <ActionIcon
        label={t('Reset & send credentials')}
        icon={<VpnKeyIcon />}
        onClick={handleResetPassword}
      />
      <ActionIcon
        label={t('Send custom email')}
        icon={<EmailIcon />}
        onClick={() => openCustomMail(user)}
      />
      <ActionIcon
        label={t('Edit details')}
        icon={<EditIcon />}
        onClick={() => (editPath ? navigate(editPath) : setDialog('edit'))}
      />
      <ActionIcon
        label={user.isActive ? t('Deactivate') : t('Activate')}
        icon={user.isActive ? <ToggleOffIcon /> : <ToggleOnIcon />}
        color={user.isActive ? 'warning' : 'success'}
        onClick={() => handleToggleActive(!user.isActive)}
      />
      <ActionIcon
        label={blockLabel}
        icon={user.isBlocked ? <LockOpenIcon /> : <BlockIcon />}
        color="error"
        onClick={() => (user.isBlocked ? handleUnblock() : setDialog('block'))}
      />

      <CrudDialog open={dialog === 'edit'} title="Edit user" onClose={close}>
        <UserForm initial={user} onCancel={close} onDone={done} />
      </CrudDialog>
      <CrudDialog open={dialog === 'block'} title={`Block ${user.name}`} onClose={close}>
        <BlockUserForm userId={user.id} onCancel={close} onDone={done} />
      </CrudDialog>
    </Flex>
  );
}
