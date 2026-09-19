import { useT } from '@exyconn/i18n';
import { Box, ListItemButton, ListSubheader, Text } from '@/components/ui';
import { groupItems, type PaletteItem } from './palette.items';

interface PaletteResultsProps {
  items: readonly PaletteItem[];
  /** Index into `items` of the row the keyboard is on. */
  cursor: number;
  onPick: (item: PaletteItem) => void;
  onHover: (index: number) => void;
}

/**
 * The palette's rows, grouped under the module each result came from.
 *
 * The cursor is an index into the flat list rather than per group, because that is what the
 * arrow keys move through: a reader sees headings, the keyboard sees one list.
 */
export function PaletteResults({ items, cursor, onPick, onHover }: Readonly<PaletteResultsProps>) {
  const t = useT();
  let index = -1;
  return (
    <>
      {groupItems(items).map((group) => (
        <Box component="li" key={group.label} sx={{ listStyle: 'none' }}>
          <ListSubheader disableSticky sx={{ lineHeight: 2, bgcolor: 'transparent' }}>
            {t(group.label)}
          </ListSubheader>
          <Box component="ul" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {group.items.map((item) => {
              index += 1;
              const at = index;
              return (
                <Box component="li" key={item.id} sx={{ listStyle: 'none' }}>
                  <ListItemButton
                    component="button"
                    type="button"
                    selected={at === cursor}
                    onMouseEnter={() => onHover(at)}
                    onClick={() => onPick(item)}
                    sx={{ display: 'block', width: '100%', textAlign: 'left', py: 0.5 }}
                  >
                    <Text size="sm">{item.title}</Text>
                    {item.subtitle && (
                      <Text size="caption" color="text.secondary">
                        {item.subtitle}
                      </Text>
                    )}
                  </ListItemButton>
                </Box>
              );
            })}
          </Box>
        </Box>
      ))}
    </>
  );
}
