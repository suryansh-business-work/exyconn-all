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
import { glass } from '@exyconn/shell/components/glass/glass';
import type { DirectReport } from './team.types';

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Who reports to the signed-in user. */
export function DirectReportsList({ reports }: Readonly<{ reports: DirectReport[] }>) {
  return (
    <Box sx={[glass, { p: 2 }]}>
      <Heading level={6}>Direct reports</Heading>
      <Text size="sm" color="text.secondary">
        {reports.length} {reports.length === 1 ? 'person reports' : 'people report'} to you.
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
