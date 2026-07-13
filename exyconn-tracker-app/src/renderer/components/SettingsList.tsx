import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { SettingRow } from '../settings-rows';

interface Props {
  rows: readonly SettingRow[];
}

/** Read-only label/value list of the workspace's tracker settings. */
export default function SettingsList({ rows }: Readonly<Props>): JSX.Element {
  return (
    <List disablePadding>
      {rows.map((row) => (
        <ListItem
          key={row.id}
          disableGutters
          divider
          secondaryAction={
            <Typography variant="subtitle2" noWrap>
              {row.value}
            </Typography>
          }
          sx={{ py: 1.25 }}
        >
          <ListItemText
            primary={row.label}
            primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
          />
        </ListItem>
      ))}
    </List>
  );
}
