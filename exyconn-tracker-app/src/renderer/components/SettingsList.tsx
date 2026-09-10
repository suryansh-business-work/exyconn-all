import type { ReactElement } from 'react';
import { Box, Stack, Typography } from '@exyconn/ui';
import type { SettingRow } from '../settings-rows';

interface Props {
  rows: readonly SettingRow[];
}

/**
 * Read-only label/value list of the workspace's tracker settings.
 *
 * Deliberately NOT MUI's `ListItem secondaryAction`: that positions the value absolutely, so
 * it takes no part in the row's layout and a value longer than the space left over prints
 * straight over the label. Every setting whose value is a sentence — the webcam corner, the
 * capture sound, the tracking window — was unreadable because of it.
 *
 * Here both halves are in normal flow. The value takes the room it needs, wrapping onto its
 * own line in a 420px window rather than colliding with the label, and the label never shrinks
 * below the width of its own text.
 */
export default function SettingsList({ rows }: Readonly<Props>): ReactElement {
  return (
    <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
      {rows.map((row) => (
        <Stack
          key={row.id}
          direction="row"
          spacing={2}
          // Wraps instead of overlapping: a value that cannot fit beside its label drops to
          // the next line, which is what the old absolute positioning could never do.
          useFlexGap
          sx={{
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "baseline",
            py: 1.25
          }}>
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              flexShrink: 0
            }}>
            {row.label}
          </Typography>
          <Typography
            variant="subtitle2"
            sx={{ flex: '1 1 auto', textAlign: 'right', minWidth: 0 }}
          >
            {row.value}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
