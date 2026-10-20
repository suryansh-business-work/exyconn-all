import { useFormatters, useT } from '@exyconn/i18n';
import { Heading, List, ListItem, ListItemText } from '@exyconn/shell/components/ui';
import type { MaNotesQuery } from '@exyconn/shell/graphql/generated';

type Revision = NonNullable<MaNotesQuery['maNotes']>['revisions'][number];

/** Every saved version of the notes: who saved it and when, newest first. */
export function NotesRevisions({ revisions }: Readonly<{ revisions: readonly Revision[] }>) {
  const t = useT();
  const { formatDateTime } = useFormatters();
  if (revisions.length === 0) {
    return null;
  }
  const newestFirst = revisions.toSorted((a, b) => b.version - a.version);
  return (
    <>
      <Heading level={3} sx={{ typography: 'subtitle1', mt: 2 }}>
        {t('Revision history')}
      </Heading>
      <List dense>
        {newestFirst.map((revision) => (
          <ListItem key={revision.version} disableGutters>
            <ListItemText
              primary={t('Version {version}', { version: revision.version })}
              secondary={t('{name} · {when}', {
                name: revision.byName,
                when: formatDateTime(revision.at),
              })}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
}
