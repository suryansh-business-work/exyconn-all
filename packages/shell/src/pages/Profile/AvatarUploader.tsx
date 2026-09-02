import { useRef, useState } from 'react';
import { Avatar, Box, Button, CircularProgress } from '@/components/ui';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { useAuth } from '@/auth/AuthContext';
import { useNotify } from '@/components/feedback/NotificationProvider';
import { useUploadAvatarMutation, useUpdateProfileMutation } from '@/graphql/generated';
import { fileToDataUrl, MAX_AVATAR_BYTES } from '@/utils/file';

/** Avatar with an upload control that stores the image via ImageKit. */
export function AvatarUploader() {
  const { user, updateUser } = useAuth();
  const notify = useNotify();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadAvatar] = useUploadAvatarMutation();
  const [updateProfile] = useUpdateProfileMutation();

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_AVATAR_BYTES) {
      notify('Image must be 2 MB or smaller', 'error');
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const { data } = await uploadAvatar({ variables: { file: dataUrl } });
      const url = data?.uploadAvatar;
      if (url) {
        await updateProfile({ variables: { input: { avatarUrl: url } } });
        updateUser({ avatarUrl: url });
        notify('Profile photo updated');
      }
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
      <Avatar
        src={user?.avatarUrl ?? undefined}
        sx={{ width: 96, height: 96, bgcolor: 'primary.main', fontSize: 36 }}
      >
        {user?.name?.charAt(0).toUpperCase()}
      </Avatar>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleFile}
        data-testid="avatar-input"
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={uploading ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? 'Uploading…' : 'Change photo'}
      </Button>
    </Box>
  );
}
