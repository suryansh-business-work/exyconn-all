import { useT } from '@exyconn/i18n';
import { Box, Heading, List, ListItem, ListItemText, Text } from '@exyconn/shell/components/ui';
import { LIST_SECTIONS, TEXT_SECTIONS, type NotesContent } from './notes-sections';

/** The notes laid out for reading: the prose sections, then every non-empty list. */
export function NotesView({ content }: Readonly<{ content: NotesContent }>) {
  const t = useT();
  return (
    <Box>
      {TEXT_SECTIONS.filter((section) => content[section.key].trim()).map((section) => (
        <Box key={section.key} sx={{ mb: 2 }}>
          <Heading level={3} sx={{ typography: 'subtitle1', mb: 0.5 }}>
            {t(section.label)}
          </Heading>
          <Text component="p" sx={{ whiteSpace: 'pre-line', m: 0 }}>
            {content[section.key]}
          </Text>
        </Box>
      ))}
      {LIST_SECTIONS.filter((section) => content[section.key].length > 0).map((section) => (
        <Box key={section.key} sx={{ mb: 2 }}>
          <Heading level={3} sx={{ typography: 'subtitle1' }}>
            {t(section.label)}
          </Heading>
          <List dense sx={{ listStyleType: 'disc', pl: 3 }}>
            {content[section.key].map((item) => (
              <ListItem key={item} sx={{ display: 'list-item', py: 0 }}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
}
