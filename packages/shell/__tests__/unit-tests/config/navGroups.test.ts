import { createElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NAV_GROUP_ICONS } from '@/config/navGroups';
import { MODULES, type ModuleChild } from '@/config/modules';

function groupsOf(children: readonly ModuleChild[] = []): string[] {
  return children.flatMap((child) => [
    ...(child.group ? [child.group] : []),
    ...groupsOf(child.children),
  ]);
}

describe('NAV_GROUP_ICONS', () => {
  it('gives every sidebar section an icon the collapsed rail can draw', () => {
    for (const [group, icon] of Object.entries(NAV_GROUP_ICONS)) {
      const { container, unmount } = render(createElement(icon));
      expect(container.querySelector('svg'), group).not.toBeNull();
      unmount();
    }
  });

  it('covers every section a module page is filed under', () => {
    const used = new Set(MODULES.flatMap((module) => groupsOf(module.children)));
    expect(used.size).toBeGreaterThan(0);
    for (const group of used) {
      expect(NAV_GROUP_ICONS, group).toHaveProperty([group]);
    }
  });
});
