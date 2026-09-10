import { useState } from 'react';
import { List, Typography } from '@/components/ui';
import type { ModuleDefinition } from '@/config/modules';
import { moduleNavItems, navSections } from './moduleNav';
import { activeNavPath } from './activeNavPath';
import { NavLink } from './NavLink';
import { NavSectionGroup } from './NavSectionGroup';

interface ModuleNavListProps {
  module: ModuleDefinition;
  pathname: string;
  query: string;
  onSelect: (path: string) => void;
}

/**
 * This portal's own pages, grouped into the sections its config declares.
 *
 * A section opens when the page you are on lives inside it, and stays open once you open
 * one yourself. Nothing is remembered between visits on purpose: where you are is a better
 * answer to "what should be open" than where you were last week.
 *
 * While a search is running every match is shown, whatever is collapsed — a result you
 * cannot see is not a result.
 */
export function ModuleNavList({ module, pathname, query, onSelect }: Readonly<ModuleNavListProps>) {
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const searching = query.trim() !== '';
  const sections = navSections(module, query);

  // Matched against every page, not just the visible ones, so the deepest page wins.
  const active = activeNavPath(
    pathname,
    moduleNavItems(module).map((item) => item.path),
  );
  const activeSection = navSections(module).find((s) =>
    s.items.some((item) => item.path === active),
  )?.label;

  const matched = sections.reduce((total, section) => total + section.items.length, 0);
  // The ungrouped run always leads and never has a heading; only the rest collapse.
  const lead = sections.find((section) => section.label === '');
  const groups = sections.filter((section) => section.label !== '');

  const toggle = (label: string) =>
    setOpened((prev) => ({ ...prev, [label]: !(prev[label] ?? label === activeSection) }));

  return (
    <>
      <Typography
        variant="overline"
        sx={{
          color: "text.secondary",
          px: 2,
          pt: 0.5,
          display: 'block',
          letterSpacing: 1
        }}>
        {module.label}
      </Typography>
      <List component="div" sx={{ px: 1, py: 0.5 }}>
        {matched === 0 && (
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              px: 1.5
            }}>
            No page matches “{query}”.
          </Typography>
        )}
        {lead?.items.map((item) => (
          <NavLink
            key={item.key}
            item={item}
            selected={active === item.path}
            accent={module.accent}
            onSelect={onSelect}
          />
        ))}
        {groups.map((section) => (
          <NavSectionGroup
            key={section.label}
            label={section.label}
            items={section.items}
            activePath={active}
            accent={module.accent}
            expanded={searching || (opened[section.label] ?? section.label === activeSection)}
            onToggle={toggle}
            onSelect={onSelect}
          />
        ))}
      </List>
    </>
  );
}
