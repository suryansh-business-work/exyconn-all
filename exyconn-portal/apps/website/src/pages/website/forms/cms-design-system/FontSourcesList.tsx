import DeleteIcon from '@mui/icons-material/Delete';
import { useT } from '@exyconn/i18n';
import { Chip, Flex, IconButton, Paper, Text, Tooltip } from '@exyconn/shell/components/ui';
import type { FontSource } from '../../../cms/design-system/font-sources';
import { variantLabel } from '../cms-google-font/cms-google-font.types';

interface FontSourcesListProps {
  sources: ReadonlyArray<FontSource & { id: string }>;
  onRemove: (index: number) => void;
}

const stylesOf = (source: FontSource): string[] =>
  source.provider === 'GOOGLE'
    ? source.variants.map(variantLabel)
    : source.files.map((file) => `${file.weight}${file.style === 'italic' ? ' italic' : ''}`);

/** The families the site loads, each in its own face, with its styles and a remove button. */
export function FontSourcesList({ sources, onRemove }: Readonly<FontSourcesListProps>) {
  const t = useT();
  if (sources.length === 0) {
    return (
      <Text color="text.secondary">
        {t('No families loaded yet: pages use the fallback stacks below.')}
      </Text>
    );
  }
  return (
    <Flex direction="column" gap={1}>
      {sources.map((source, index) => (
        <Paper key={source.id} variant="outlined" sx={{ p: 1.5 }}>
          <Flex alignItems="center" gap={1}>
            <Text
              size="lg"
              sx={{ fontFamily: `"${source.family}", sans-serif`, flexGrow: 1 }}
              noWrap
            >
              {source.family}
            </Text>
            <Chip
              size="small"
              variant="outlined"
              label={source.provider === 'GOOGLE' ? t('Google Fonts') : t('Uploaded')}
            />
            <Tooltip title={t('Remove')}>
              <IconButton
                aria-label={t('Remove {family}', { family: source.family })}
                onClick={() => onRemove(index)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Flex>
          <Text size="caption" color="text.secondary">
            {stylesOf(source).join(' · ')}
          </Text>
        </Paper>
      ))}
    </Flex>
  );
}
