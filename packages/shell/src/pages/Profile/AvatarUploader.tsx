import { useState } from 'react';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useT } from '@exyconn/i18n';
import { Avatar, Badge, Box, Button, ImageUploadDialog, fontSize } from '@/components/ui';
import { useAuth } from '@/auth/AuthContext';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { errorMessage } from '@/utils/errorMessage';
import { useUpdateProfileMutation } from '@/graphql/generated';
import { userInitials } from '../UserDetails/user-details.types';

interface AvatarUploaderProps {
  online: boolean;
}

/**
 * The person's photo with a presence dot, and the shared upload dialog (device or stock photo,
 * cropped, stored on ImageKit) to change it. The new photo is saved as soon as it is uploaded.
 */
export function AvatarUploader({ online }: Readonly<AvatarUploaderProps>) {
  const t = useT();
  const { user, updateUser } = useAuth();
  const notify = useNotify();
  const [open, setOpen] = useState(false);
  const [updateProfile] = useUpdateProfileMutation();

  const saveAvatar = async (url: string) => {
    setOpen(false);
    try {
      await updateProfile({ variables: { input: { avatarUrl: url } } });
      updateUser({ avatarUrl: url });
      notify('Profile photo updated');
    } catch (err) {
      notify(errorMessage(err, 'Could not save the photo'), 'error');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Badge
        overlap="circular"
        variant="dot"
        color={online ? 'success' : 'default'}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        aria-label={t(online ? 'Online' : 'Offline')}
        sx={{
          '& .MuiBadge-dot': {
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: 3,
            borderColor: 'background.paper',
            bgcolor: online ? 'success.main' : 'grey.400',
          },
        }}
      >
        <Avatar
          src={user?.avatarUrl ?? undefined}
          alt={user?.name ?? ''}
          sx={{ width: 112, height: 112, bgcolor: 'primary.main', fontSize: fontSize['4xl'] }}
        >
          {userInitials(user?.name ?? '')}
        </Avatar>
      </Badge>
      <Button
        variant="outlined"
        size="small"
        startIcon={<PhotoCameraIcon />}
        onClick={() => setOpen(true)}
      >
        {t('Change photo')}
      </Button>
      <ImageUploadDialog
        open={open}
        title={t('Profile photo')}
        folder="avatars"
        media="image"
        currentUrl={user?.avatarUrl}
        onClose={() => setOpen(false)}
        onUploaded={(url) => {
          saveAvatar(url).catch((err: unknown) => console.error('Saving the photo failed', err));
        }}
      />
    </Box>
  );
}
