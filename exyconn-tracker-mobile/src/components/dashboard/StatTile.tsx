import { Pressable } from 'react-native';
import { XStack } from 'tamagui';
import type { Tile } from '../../lib/dashboard/tile.types';
import { useBrand } from '../../theme/BrandProvider';
import { Icon } from '../ui/Icon';
import { Surface } from '../ui/Surface';
import { Caption, Heading } from '../ui/Typography';

interface Props {
  tile: Tile;
  /** Opens this tile's detail — every number on the dashboard can explain itself. */
  onOpen: (id: string) => void;
}

/** A single labelled stat in the dashboard grid. Tapping it explains the number. */
export function StatTile({ tile, onOpen }: Readonly<Props>) {
  const brand = useBrand();
  return (
    <Pressable
      onPress={() => onOpen(tile.id)}
      accessibilityRole="button"
      accessibilityLabel={`${tile.label}: ${tile.value}. Open details`}
      style={({ pressed }) => ({ flexGrow: 1, flexBasis: '40%', opacity: pressed ? 0.8 : 1 })}
    >
      <Surface padding="$3" gap="$2" flexGrow={1}>
        <XStack gap="$2" alignItems="center">
          <Icon name={tile.icon} size={18} color={brand.primary} />
          <Caption numberOfLines={1} flex={1}>
            {tile.label}
          </Caption>
        </XStack>
        <Heading accessibilityRole="none" numberOfLines={1}>
          {tile.value}
        </Heading>
      </Surface>
    </Pressable>
  );
}
