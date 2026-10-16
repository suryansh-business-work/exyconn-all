import { useRef, useState, type ChangeEvent } from 'react';
import { useController } from 'react-hook-form';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import VideocamIcon from '@mui/icons-material/Videocam';
import { useT } from '@exyconn/i18n';
import { Alert, Button, Chip, Flex, Text } from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { AttachmentPreview } from '../timeline/AttachmentPreview';
import { useCrmUpload, type UploadedFile } from './useCrmUpload';
import { useRecorder, type RecordingKind } from './useRecorder';

const ACCEPT = 'image/*,application/pdf,audio/*,video/*';

/**
 * The files on an activity: attach a photo, PDF or recording from the device, or record a
 * voice note or video right here. Each is uploaded as soon as it is chosen.
 */
export function MediaAttachField({ name }: Readonly<{ name: string }>) {
  const t = useT();
  const { field } = useController({ name });
  const files = (field.value ?? []) as UploadedFile[];
  const picker = useRef<HTMLInputElement>(null);
  const { send, uploading } = useCrmUpload();
  const { recording, start, stop } = useRecorder();
  const [problem, setProblem] = useState('');

  const add = async (file: File) => {
    setProblem('');
    try {
      field.onChange([...files, await send(file)]);
    } catch (error) {
      portalLogger.warn('crm: uploading an activity file failed', error);
      setProblem(errorMessage(error, t('The file could not be uploaded.')));
    }
  };
  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      add(file).catch((error: unknown) => portalLogger.warn('crm: attaching a file failed', error));
    }
  };
  const record = async (kind: RecordingKind) => {
    try {
      await start(kind);
    } catch (error) {
      portalLogger.warn('crm: starting a recording failed', error);
      setProblem(t('Allow the browser to use the microphone or camera to record.'));
    }
  };
  const finish = async () => add(await stop());

  return (
    <Flex direction="column" spacing={1}>
      <Text component="h3" size="label" weight="bold">
        {t('Files and recordings')}
      </Text>
      <input
        ref={picker}
        type="file"
        accept={ACCEPT}
        hidden
        onChange={onPick}
        aria-label={t('Choose a file')}
      />
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          startIcon={<AttachFileIcon />}
          onClick={() => picker.current?.click()}
          disabled={uploading || recording !== null}
        >
          {t('Attach file')}
        </Button>
        {recording === null ? (
          <>
            <Button
              size="small"
              startIcon={<MicIcon />}
              onClick={() => record('audio')}
              disabled={uploading}
            >
              {t('Record audio')}
            </Button>
            <Button
              size="small"
              startIcon={<VideocamIcon />}
              onClick={() => record('video')}
              disabled={uploading}
            >
              {t('Record video')}
            </Button>
          </>
        ) : (
          <Button
            size="small"
            color="error"
            variant="contained"
            startIcon={<StopIcon />}
            onClick={() =>
              finish().catch((error: unknown) =>
                portalLogger.warn('crm: saving a recording failed', error),
              )
            }
          >
            {t('Stop and attach')}
          </Button>
        )}
        {uploading && <Chip size="small" label={t('Uploading…')} />}
      </Flex>
      {problem && <Alert severity="error">{problem}</Alert>}
      {files.map((file) => (
        <Flex key={file.url} direction="row" spacing={1} alignItems="center">
          <AttachmentPreview attachment={file} />
          <Button
            size="small"
            color="error"
            onClick={() => field.onChange(files.filter((f) => f.url !== file.url))}
          >
            {t('Remove')}
          </Button>
        </Flex>
      ))}
    </Flex>
  );
}
