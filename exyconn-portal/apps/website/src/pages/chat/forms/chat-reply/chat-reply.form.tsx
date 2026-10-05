import type { ChangeEvent, KeyboardEvent } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useT } from '@exyconn/i18n';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import { Box, Flex, IconButton, Text, Tooltip } from '@exyconn/shell/components/ui';
import { RhfTextField } from '@exyconn/shell/components/form/rhf';
import { useNotify } from '@exyconn/shell/components/feedback/NotificationProvider';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { chatReplySchema, type ChatReplyFormValues, type SendChatReply } from './chat-reply.types';
import { useChatAttachments } from './useChatAttachments';
import { useVoiceRecorder, voiceNotesSupported } from './useVoiceRecorder';
import { useTypingSignal } from './useTypingSignal';
import { PendingAttachments } from './PendingAttachments';
import { VoiceNoteControls } from './VoiceNoteControls';

interface ChatReplyFormProps {
  /** Largest file the chatbot settings allow, in MB. */
  maxUploadMb: number;
  onSend: SendChatReply;
  onTyping: (on: boolean) => void;
}

/**
 * The agent's reply box under the live thread (React Hook Form + Zod): text (Enter sends,
 * Shift+Enter starts a new line), pictures and clips from the device, and voice notes.
 */
export function ChatReplyForm({ maxUploadMb, onSend, onTyping }: Readonly<ChatReplyFormProps>) {
  const t = useT();
  const notify = useNotify();
  const attachments = useChatAttachments(maxUploadMb);
  const voice = useVoiceRecorder(maxUploadMb, attachments.add);
  const typing = useTypingSignal(onTyping);
  const methods = useForm<ChatReplyFormValues>({
    mode: 'onChange',
    resolver: zodResolver(chatReplySchema),
    defaultValues: { body: '' },
  });

  const send = methods.handleSubmit(({ body }) => {
    const text = body.trim();
    if (!text && attachments.files.length === 0) {
      return;
    }
    const files = attachments.files.map(({ name, data }) => ({ name, data }));
    if (onSend(text, files)) {
      methods.reset({ body: '' });
      attachments.clear();
      typing.stopped();
    }
  });
  const submit = () => {
    send().catch((error: unknown) => notify(errorMessage(error, 'Could not send'), 'error'));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
      return;
    }
    typing.typed();
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    attachments.pick(Array.from(event.target.files ?? []));
    event.target.value = '';
  };

  return (
    <FormProvider {...methods}>
      <Box
        component="form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      >
        <PendingAttachments files={attachments.files} onRemove={attachments.remove} />
        {voice.recording ? (
          <VoiceNoteControls seconds={voice.seconds} onStop={voice.stop} onCancel={voice.cancel} />
        ) : (
          <Flex direction="row" spacing={1} alignItems="flex-end" sx={{ p: 1.5 }}>
            <Tooltip title={t('Attach a picture or video')}>
              <span>
                <IconButton
                  component="label"
                  aria-label={t('Attach a picture or video')}
                  disabled={!attachments.canAddMore}
                >
                  <AttachFileIcon />
                  <Box
                    component="input"
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    hidden
                    onChange={onPick}
                  />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={t('Record a voice note')}>
              <span>
                <IconButton
                  aria-label={t('Record a voice note')}
                  onClick={voice.start}
                  disabled={!voiceNotesSupported() || !attachments.canAddMore}
                >
                  <MicIcon />
                </IconButton>
              </span>
            </Tooltip>
            <RhfTextField
              name="body"
              label="Reply"
              placeholder={t('Write a reply… (Enter sends, Shift+Enter for a new line)')}
              multiline
              maxRows={6}
              size="small"
              onKeyDown={onKeyDown}
            />
            <IconButton type="submit" color="primary" aria-label={t('Send')}>
              <SendIcon />
            </IconButton>
          </Flex>
        )}
      </Box>
    </FormProvider>
  );
}

/** In place of the reply box once the chat has ended. */
export function ChatReplyClosed() {
  const t = useT();
  return (
    <Text size="sm" color="text.secondary" sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {t('This chat is closed, so replies are switched off.')}
    </Text>
  );
}
