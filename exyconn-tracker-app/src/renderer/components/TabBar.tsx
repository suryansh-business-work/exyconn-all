import type { KeyboardEvent, ReactElement } from 'react';
import {
  Badge,
  Box,
  ButtonBase,
  color,
  radius,
  Stack,
  Tooltip,
  trackerTabBar,
  Typography,
} from '@exyconn/ui';
import type { Theme } from '@exyconn/ui';
import { useI18n, useT } from '@exyconn/i18n';
import { NAV_ITEMS, SECTIONS_TABS, type NavItem, type Section } from '../sections';
import { nextTabIndex, tabId, tabProps } from '../a11y/tabs';

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

/**
 * One tab: an icon, or — selected — a light pill with the icon and its short name.
 *
 * Named by that short name, so what a voice-control user reads on the pill is what they can
 * say (WCAG 2.5.3). Only the selected tab is in the Tab order; the arrow keys move between
 * them (the tabs pattern), so the bar is one stop rather than five.
 */
function Tab({ item, selected, count, onSelect }: Readonly<TabProps>): ReactElement {
  const t = useT();
  const Icon = item.icon;
  const name = t(item.short);
  const label = count > 0 ? t('{label}, {count} unread', { label: name, count }) : name;
  return (
    <Tooltip title={t(item.caption)}>
      <ButtonBase
        role="tab"
        {...tabProps(SECTIONS_TABS, item.id)}
        aria-selected={selected}
        aria-label={label}
        tabIndex={selected ? 0 : -1}
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
            {t(item.short)}
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
  const t = useT();
  const { direction } = useI18n();

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const current = NAV_ITEMS.findIndex((item) => item.id === section);
    const next = nextTabIndex(event.key, current, NAV_ITEMS.length, direction === 'rtl');
    if (next === null) {
      return;
    }
    event.preventDefault();
    const target = NAV_ITEMS[next].id;
    onSelect(target);
    document.getElementById(tabId(SECTIONS_TABS, target))?.focus();
  };

  return (
    <Box
      component="nav"
      aria-label={t('Sections')}
      sx={(theme) => ({
        position: 'absolute',
        // Above the page's own stacked pieces — an outlined field's label sits at z-index 1.
        zIndex: theme.zIndex.appBar,
        left: theme.spacing(1),
        right: theme.spacing(1),
        bottom: theme.spacing(2),
        display: 'flex',
        justifyContent: 'center',
        // The strip spans the window only to centre the pill and bound its width; the page
        // under its empty sides must stay clickable.
        pointerEvents: 'none',
      })}
    >
      {/* The WAI-ARIA tabs pattern: arrow keys are handled on the tablist while focus stays on
          the tabs themselves (roving tabindex), so the list is not a focus stop of its own. */}
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <Stack
        direction="row"
        role="tablist"
        aria-label={t('Sections')}
        onKeyDown={onKeyDown}
        sx={(theme) => ({
          alignItems: 'center',
          gap: 0.5,
          p: 0.75,
          // Never wider than the window: at 200% zoom the pill scrolls sideways rather than
          // pushing tabs off both edges where nothing can reach them (WCAG 1.4.10).
          minWidth: 0,
          overflowX: 'auto',
          pointerEvents: 'auto',
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
    </Box>
  );
}
