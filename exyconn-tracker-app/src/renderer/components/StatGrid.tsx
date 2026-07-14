import Box from '@mui/material/Box';
import type { Tile } from '../dashboard-tiles';
import StatTile from './StatTile';

interface Props {
  tiles: readonly Tile[];
}

/** The responsive grid both stat blocks use — this session's counters, and the all-time totals. */
export default function StatGrid({ tiles }: Readonly<Props>): JSX.Element {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 1.5,
      }}
    >
      {tiles.map((tile) => (
        <StatTile key={tile.id} label={tile.label} value={tile.value} icon={tile.icon} />
      ))}
    </Box>
  );
}
