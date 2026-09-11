import { useState } from 'react';
import { XStack } from 'tamagui';
import type { Tile } from '../../lib/dashboard/tile.types';
import { StatTile } from './StatTile';
import { TileDetailDialog } from './TileDetailDialog';

interface Props {
  tiles: readonly Tile[];
}

/**
 * The two-up grid both stat blocks use — this session's counters, and the all-time totals.
 *
 * The open tile is held here rather than in each screen: every grid on the dashboard behaves
 * the same way, and neither block has to know a dialog exists. The tile is looked up by id on
 * every render so an open detail keeps ticking with the live stats behind it.
 */
export function StatGrid({ tiles }: Readonly<Props>) {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = tiles.find((tile) => tile.id === openId) ?? null;

  return (
    <XStack flexWrap="wrap" gap="$3">
      {tiles.map((tile) => (
        <StatTile key={tile.id} tile={tile} onOpen={setOpenId} />
      ))}
      <TileDetailDialog tile={open} onClose={() => setOpenId(null)} />
    </XStack>
  );
}
