import type { ReactElement } from 'react';
import { List, ListItem, ListItemText, Typography } from '@exyconn/ui';
import type { SettingRow } from '../settings-rows';

interface Props {
  rows: readonly SettingRow[];
}

/** Read-only label/value list of the workspace's tracker settings. */
export default function SettingsList({ rows }: Readonly<Props>): ReactElement {
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
