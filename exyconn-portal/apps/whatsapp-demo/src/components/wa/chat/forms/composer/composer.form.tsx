import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import { Box, IconButton, TextField } from '@exyconn/shell/components/ui';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticonOutlined';
import AddIcon from '@mui/icons-material/Add';
import PhotoCameraIcon from '@mui/icons-material/PhotoCameraOutlined';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import type { KeyboardEvent } from 'react';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useCompact, useWaPalette } from '../../../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../../../theme/wa.tokens';
import { composerSchema, MAX_MESSAGE_LENGTH } from './composer.schema';
import type { ComposerProps, ComposerValues } from './composer.types';

/**
 * The message bar. Free text goes to the engine, which routes it by keyword, validates it
 * when a workflow is waiting for an answer, or hands it to the AI reader. Enter sends,
 * Shift+Enter adds a line.
 */
export function ComposerForm({ onSend, onUnavailable }: Readonly<ComposerProps>) {
  const t = useT();
  const c = useWaPalette();
  const compact = useCompact();
  const { register, handleSubmit, reset, watch } = useForm<ComposerValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: { message: '' },
  });
  const hasText = watch('message').trim().length > 0;
  const submit = handleSubmit(({ message }) => {
    onSend(message);
    reset({ message: '' });
  });
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit().catch((error: unknown) => portalLogger.error('wa-demo: send failed', error));
    }
  };
  const iconSx = { color: c.icon };
  return (
    <Box
      component="form"
      onSubmit={(e) => {
        submit(e).catch((error: unknown) => portalLogger.error('wa-demo: send failed', error));
      }}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: WA_SPACE.xxs,
        px: WA_SPACE.sm,
        py: WA_SPACE.xs,
        bgcolor: c.composer,
        flexShrink: 0,
        pb: `max(${WA_SPACE.xs}, env(safe-area-inset-bottom))`,
      }}
    >
      <IconButton aria-label={t('Emoji')} onClick={onUnavailable} sx={iconSx}>
        <InsertEmoticonIcon />
      </IconButton>
      <IconButton aria-label={t('Attach')} onClick={onUnavailable} sx={iconSx}>
        <AddIcon />
      </IconButton>
      <TextField
        {...register('message')}
        placeholder={t('Type a message')}
        multiline
        maxRows={5}
        fullWidth
        onKeyDown={onKeyDown}
        slotProps={{
          htmlInput: {
            'aria-label': t('Type a message'),
            maxLength: MAX_MESSAGE_LENGTH,
            enterKeyHint: 'send',
          },
          input: {
            sx: {
              borderRadius: WA_RADIUS.input,
              bgcolor: c.input,
              color: c.text,
              fontSize: WA_FONT.preview,
              py: WA_SPACE.sm,
              '& fieldset': { border: 'none' },
            },
          },
        }}
      />
      {compact && !hasText ? (
        <IconButton aria-label={t('Camera')} onClick={onUnavailable} sx={iconSx}>
          <PhotoCameraIcon />
        </IconButton>
      ) : null}
      {hasText ? (
        <IconButton
          type="submit"
          aria-label={t('Send')}
          sx={{ ...iconSx, width: WA_SIZE.iconButton, height: WA_SIZE.iconButton }}
        >
          <SendIcon />
        </IconButton>
      ) : (
        <IconButton aria-label={t('Voice message')} onClick={onUnavailable} sx={iconSx}>
          <MicIcon />
        </IconButton>
      )}
    </Box>
  );
}
