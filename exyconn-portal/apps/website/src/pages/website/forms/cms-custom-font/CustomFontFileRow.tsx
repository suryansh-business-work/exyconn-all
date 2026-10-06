import { Controller, useFormContext } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import {
  Chip,
  Flex,
  IconButton,
  MenuItem,
  Text,
  TextField,
  Tooltip,
} from '@exyconn/shell/components/ui';
import { formatBytes } from '@exyconn/shell/utils/file';
import { FONT_WEIGHTS, type CustomFontFormValues } from './cms-custom-font.types';

interface CustomFontFileRowProps {
  index: number;
  onRemove: () => void;
}

/** One uploaded file: its name and format, and which weight and style it is. */
export function CustomFontFileRow({ index, onRemove }: Readonly<CustomFontFileRowProps>) {
  const t = useT();
  const { control, getValues } = useFormContext<CustomFontFormValues>();
  const { file, format } = getValues(`files.${index}`);

  return (
    <Flex gap={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
      <Text size="sm" noWrap sx={{ flex: '1 1 180px', minWidth: 0 }} title={file.name}>
        {file.name} · {formatBytes(file.size)}
      </Text>
      <Chip size="small" label={format} />
      <Controller
        control={control}
        name={`files.${index}.weight`}
        render={({ field }) => (
          <TextField {...field} select size="small" label={t('Weight')} sx={{ width: 110 }}>
            {FONT_WEIGHTS.map((weight) => (
              <MenuItem key={weight} value={weight}>
                {weight}
              </MenuItem>
            ))}
          </TextField>
        )}
      />
      <Controller
        control={control}
        name={`files.${index}.style`}
        render={({ field }) => (
          <TextField {...field} select size="small" label={t('Style')} sx={{ width: 120 }}>
            <MenuItem value="normal">{t('Normal')}</MenuItem>
            <MenuItem value="italic">{t('Italic')}</MenuItem>
          </TextField>
        )}
      />
      <Tooltip title={t('Remove')}>
        <IconButton aria-label={t('Remove {name}', { name: file.name })} onClick={onRemove}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Flex>
  );
}
