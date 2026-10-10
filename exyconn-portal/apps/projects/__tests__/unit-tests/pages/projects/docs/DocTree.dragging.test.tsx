import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { DocTree } from '../../../../../src/pages/projects/docs/DocTree';
import { buildDocTree } from '../../../../../src/pages/projects/docs/doc-tree';
import { renderWithProviders } from '../../../test-utils';
import { docPage } from '../../../fixtures';
import { DndWrapper } from '../board/dnd-wrapper';

const flags = vi.hoisted(() => ({ isDragging: false, isOver: false }));

vi.mock('@dnd-kit/sortable', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/sortable')>();
  return {
    ...actual,
    useSortable: (args: Parameters<typeof actual.useSortable>[0]) => ({
      ...actual.useSortable(args),
      isDragging: flags.isDragging,
      isOver: flags.isOver,
    }),
  };
});

const PAGES = [docPage('runbooks', null, 'Runbooks')];

const rowOf = () => {
  renderWithProviders(
    <DndWrapper ids={['runbooks']}>
      <DocTree
        nodes={buildDocTree(PAGES)}
        selectedId={null}
        onSelect={vi.fn()}
        onAddChild={vi.fn()}
      />
    </DndWrapper>,
  );
  return screen.getByText('Runbooks');
};

const ancestorStyles = (el: HTMLElement, prop: 'outline' | 'opacity'): string[] => {
  const rules = [...document.styleSheets].flatMap((sheet) => [...sheet.cssRules]);
  const found: string[] = [];
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    const classes = [...node.classList];
    for (const rule of rules) {
      const css = rule.cssText;
      if (classes.some((name) => css.startsWith(`.${name}`)) && css.includes(prop)) {
        found.push(css);
      }
    }
  }
  return found;
};

describe('DocTree drag states', () => {
  it('outlines a row another page is being dragged over', () => {
    flags.isDragging = false;
    flags.isOver = true;

    expect(ancestorStyles(rowOf(), 'outline').join(' ')).toContain('2px solid');
  });

  it('fades the row being dragged and does not outline it', () => {
    flags.isDragging = true;
    flags.isOver = true;

    const row = rowOf();
    expect(ancestorStyles(row, 'opacity').join(' ')).toContain('opacity: 0.4');
    expect(ancestorStyles(row, 'outline').join(' ')).not.toContain('2px solid');
  });
});
