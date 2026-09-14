import { useT } from '@exyconn/i18n';
import {
  Avatar,
  Box,
  Heading,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Text,
} from '@exyconn/shell/components/ui';

import type { DirectReport } from './team.types';
import { panel } from '@exyconn/shell/components/glass/glass';

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Who reports to the signed-in user. */
export function DirectReportsList({ reports }: Readonly<{ reports: DirectReport[] }>) {
  const t = useT();
  let summary = t('{count} people report to you.', { count: reports.length });
  if (reports.length === 1) {
    summary = t('{count} person reports to you.', { count: reports.length });
  }
  return (
    <Box sx={panel}>
      <Heading level={6}>{t('Direct reports')}</Heading>
      <Text size="sm" color="text.secondary">
        {summary}
      </Text>
      <List dense disablePadding sx={{ mt: 1 }}>
        {reports.map((person) => (
          <ListItem key={person.id} disableGutters>
            <ListItemAvatar>
              <Avatar>{initialsOf(person.name)}</Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={person.name}
              secondary={[person.designation, person.email].filter(Boolean).join(' · ')}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
