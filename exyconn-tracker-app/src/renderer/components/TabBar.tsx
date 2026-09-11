import type { ReactElement } from 'react';
import {
  Badge,
  ButtonBase,
  color,
  radius,
  Stack,
  Tooltip,
  trackerTabBar,
  Typography,
} from '@exyconn/ui';
import type { Theme } from '@exyconn/ui';
import { NAV_ITEMS, type NavItem, type Section } from '../sections';

function barFill(theme: Theme): string {
  return trackerTabBar[theme.palette.mode];
}

interface TabProps {
  item: NavItem;
  selected: boolean;
  /** Unread messages — 0 draws no badge. */
  count: number;
  onSelect: (section: Section) => void;
}

/** One tab: an icon, or — selected — a light pill with the icon and its short name. */
function Tab({ item, selected, count, onSelect }: Readonly<TabProps>): ReactElement {
  const Icon = item.icon;
  const unread = count > 0 ? `, ${count} unread` : '';
  return (
    <Tooltip title={item.caption}>
      <ButtonBase
        role="tab"
        aria-selected={selected}
        aria-label={`${item.label}${unread}`}
        onClick={() => onSelect(item.id)}
        sx={{
          height: 44,
          minWidth: 44,
          px: selected ? 2 : 1.25,
          gap: 0.75,
          borderRadius: `${radius.pill}px`,
          color: selected ? color.slate[900] : color.neutral[300],
          backgroundColor: selected ? color.white : 'transparent',
          transition: 'background-color 160ms ease, padding 160ms ease',
          '&:hover': { color: selected ? color.slate[900] : color.white },
          '&.Mui-focusVisible': { outline: `2px solid ${color.white}`, outlineOffset: 2 },
        }}
      >
        <Badge badgeContent={count} color="error" overlap="circular">
          <Icon fontSize="small" />
        </Badge>
        {selected ? (
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {item.short}
          </Typography>
        ) : null}
      </ButtonBase>
    </Tooltip>
  );
}

interface Props {
  section: Section;
  unreadMessages: number;
  onSelect: (section: Section) => void;
}

/** The floating pill of the five sections at the foot of the window. */
export default function TabBar({
  section,
  unreadMessages,
  onSelect,
}: Readonly<Props>): ReactElement {
  return (
    <Stack
      direction="row"
      role="tablist"
      aria-label="Sections"
      sx={(theme) => ({
        position: 'absolute',
        left: '50%',
        bottom: theme.spacing(2),
        transform: 'translateX(-50%)',
        alignItems: 'center',
        gap: 0.5,
        p: 0.75,
        borderRadius: `${radius.pill}px`,
        backgroundColor: barFill(theme),
        boxShadow: theme.shadows[8],
      })}
    >
      {NAV_ITEMS.map((item) => (
        <Tab
          key={item.id}
          item={item}
          selected={item.id === section}
          count={item.id === 'messages' ? unreadMessages : 0}
          onSelect={onSelect}
        />
      ))}
    </Stack>
  );
}
