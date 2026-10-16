import { useRef, useState, type ChangeEvent } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT } from '@exyconn/i18n';
import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Link,
} from '@exyconn/shell/components/ui';
import { errorMessage } from '@exyconn/shell/utils/errorMessage';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import { useCrmUpload } from '../detail/media/useCrmUpload';
import { fileNameOf } from '../schema';
import { useHint, type FieldProps } from './field-hint';

/** A file property: upload one (photo, PDF, audio or video, 10 MB at most), replace or remove it. */
export function CustomFileInput({ property, name }: Readonly<FieldProps>) {
  const t = useT();
  const { control } = useFormContext();
  const hint = useHint();
  const picker = useRef<HTMLInputElement>(null);
  const { send, uploading } = useCrmUpload();
  const [problem, setProblem] = useState('');
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const onPick = (event: ChangeEvent<HTMLInputElement>) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) {
            return;
          }
          setProblem('');
          send(file)
            .then((uploaded) => field.onChange(uploaded.url))
            .catch((error: unknown) => {
              portalLogger.warn('crm: uploading a file property failed', error);
              setProblem(errorMessage(error, t('The file could not be uploaded.')));
            });
        };
        const url = typeof field.value === 'string' ? field.value : '';
        return (
          <FormControl
            required={property.required}
            error={Boolean(fieldState.error) || problem !== ''}
          >
            <FormLabel>{property.label}</FormLabel>
            <input ref={picker} type="file" hidden onChange={onPick} aria-label={property.label} />
            <Flex direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
              {url && (
                <Link href={url} target="_blank" rel="noopener noreferrer">
                  {fileNameOf(url)}
                </Link>
              )}
              <Button
                size="small"
                startIcon={<UploadFileIcon />}
                loading={uploading}
                onClick={() => picker.current?.click()}
              >
                {url ? t('Replace file') : t('Upload file')}
              </Button>
              {url && (
                <Button size="small" color="error" onClick={() => field.onChange('')}>
                  {t('Remove')}
                </Button>
              )}
            </Flex>
            <FormHelperText>{problem || hint(property, fieldState)}</FormHelperText>
          </FormControl>
        );
      }}
    />
  );
}
