import { useFormatters, useT } from '@exyconn/i18n';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import EditIcon from '@mui/icons-material/Edit';
import { Button, Flex, Text, ToggleButton, ToggleButtonGroup } from '@exyconn/shell/components/ui';
import type { MaNotesQuery } from '@exyconn/shell/graphql/generated';
import { enumOptions } from '@exyconn/shell/utils/enumOptions';
import { NotesExportMenu } from '../../notes/NotesExportMenu';
import type { NotesContent } from '../../notes/notes-sections';

export type Notes = NonNullable<MaNotesQuery['maNotes']>;
export type NotesVersion = 'current' | 'original';

interface NotesToolbarProps {
  notes: Notes;
  title: string;
  shown: NotesContent;
  version: NotesVersion;
  onVersion: (version: NotesVersion) => void;
  onEdit: () => void;
  onRegenerate: () => void;
}

/** Which version is shown, how it was made, and what can be done with it. */
export function NotesToolbar({
  notes,
  title,
  shown,
  version,
  onVersion,
  onEdit,
  onRegenerate,
}: Readonly<NotesToolbarProps>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  const [style] = enumOptions([notes.style]);
  const made = t('Version {version} · {style} · {model} · written {when}', {
    version: notes.version,
    style: t(style.label),
    model: notes.model,
    when: formatDateTime(notes.generatedAt),
  });
  return (
    <Flex direction="column" spacing={1} sx={{ mb: 2 }}>
      <Text size="sm" color="text.secondary">
        {notes.edited ? t('{made} · edited since', { made }) : made}
      </Text>
      <Flex direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <ToggleButtonGroup
          exclusive
          size="small"
          value={version}
          onChange={(_event, next: NotesVersion | null) => {
            if (next) {
              onVersion(next);
            }
          }}
          aria-label={t('Notes version')}
        >
          <ToggleButton value="current">{t('Current')}</ToggleButton>
          <ToggleButton value="original">{t('As the AI wrote it')}</ToggleButton>
        </ToggleButtonGroup>
        <Button size="small" startIcon={<EditIcon />} onClick={onEdit}>
          {t('Edit notes')}
        </Button>
        <Button size="small" startIcon={<AutorenewIcon />} onClick={onRegenerate}>
          {t('Regenerate')}
        </Button>
        <NotesExportMenu title={title} content={shown} />
      </Flex>
    </Flex>
  );
}
