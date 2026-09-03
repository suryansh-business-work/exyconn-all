import { useState } from 'react';
import Box from '@mui/material/Box';
import type { Tile } from '../tiles';
import StatTile from './StatTile';
import TileDetailDialog from './TileDetailDialog';

interface Props {
  tiles: readonly Tile[];
}

/**
 * The responsive grid both stat blocks use — this session's counters, and the all-time totals.
 *
 * The open tile is held here rather than in each screen: every grid on the dashboard behaves
 * the same way, and neither block has to know a dialog exists. The tile is looked up by id on
 * every render so an open detail keeps ticking with the live stats behind it.
 */
export default function StatGrid({ tiles }: Readonly<Props>): JSX.Element {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = tiles.find((tile) => tile.id === openId) ?? null;

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 1.5,
      }}
    >
      {tiles.map((tile) => (
        <StatTile
          key={tile.id}
          label={tile.label}
          value={tile.value}
          icon={tile.icon}
          onOpen={() => setOpenId(tile.id)}
        />
      ))}
      <TileDetailDialog tile={open} onClose={() => setOpenId(null)} />
    </Box>
  );
}
