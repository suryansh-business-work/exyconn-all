import type { KeyboardEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import SendIcon from '@mui/icons-material/Send';
import { Box, IconButton, TextField } from '@exyconn/shell/components/ui';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  MAX_WIDGET_MESSAGE,
  widgetComposerSchema,
  type WidgetComposerProps,
  type WidgetComposerValues,
} from './widget-composer.types';

/**
 * The widget's message box. Typed text goes to the engine: a keyword starts its workflow, an
 * answer fills the field the workflow asked for, anything else is read by the AI (when set up).
 * Enter sends, Shift+Enter adds a line.
 */
export function WidgetComposerForm({ onSend, placeholder }: Readonly<WidgetComposerProps>) {
  const t = useT();
  const { register, handleSubmit, reset, watch } = useForm<WidgetComposerValues>({
    resolver: zodResolver(widgetComposerSchema),
    defaultValues: { message: '' },
  });
  const empty = watch('message').trim().length === 0;
  const submit = handleSubmit(({ message }) => {
    onSend(message);
    reset({ message: '' });
  });
  const send = () => {
    submit().catch((error: unknown) => portalLogger.error('website chat: send failed', error));
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };
  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      sx={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        p: 1,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <TextField
        {...register('message')}
        placeholder={placeholder}
        multiline
        maxRows={4}
        fullWidth
        size="small"
        onKeyDown={onKeyDown}
        slotProps={{
          htmlInput: {
            'aria-label': t('Type a message'),
            maxLength: MAX_WIDGET_MESSAGE,
            enterKeyHint: 'send',
          },
        }}
      />
      <IconButton type="submit" aria-label={t('Send')} disabled={empty} color="primary">
        <SendIcon />
      </IconButton>
    </Box>
  );
}
