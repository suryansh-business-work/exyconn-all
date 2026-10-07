import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ColDef, ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import type { RowActionSpec } from '@exyconn/crud';
import { PromptCategory } from '@exyconn/shell/graphql/generated';
import { PROMPT_COLUMNS, type PagedPromptRow } from '../../../../src/pages/ai/prompts-grid';

type Params = ICellRendererParams<PagedPromptRow>;

const row = (over: Partial<PagedPromptRow> = {}): PagedPromptRow => ({
  id: 'prompt-1',
  title: 'Weekly digest',
  category: PromptCategory.Writing,
  content: 'x'.repeat(80),
  description: null,
  tags: ['weekly', 'team'],
  variables: ['company', 'product'],
  ...over,
});

const column = (key: string): ColDef<PagedPromptRow> => {
  const found = PROMPT_COLUMNS.find((col) => col.field === key || col.colId === key);
  if (!found) {
    throw new Error(`No column ${key}`);
  }
  return found;
};

const format = (key: string, data: PagedPromptRow) => {
  const formatter = column(key).valueFormatter as (
    p: ValueFormatterParams<PagedPromptRow>,
  ) => string;
  return formatter({
    data,
    context: { t: (s: string) => s },
  } as ValueFormatterParams<PagedPromptRow>);
};

const renderTags = (data: PagedPromptRow | undefined) => {
  const Cell = column('tags').cellRenderer as ComponentType<Params>;
  return render(<Cell {...({ data } as Params)} />);
};

describe('PROMPT_COLUMNS', () => {
  it('previews only the first 60 characters of the prompt body', () => {
    expect(format('content', row())).toHaveLength(60);
    expect(format('content', row({ content: 'Short' }))).toBe('Short');
  });

  it('lists the variables, or a dash when the prompt has none', () => {
    expect(format('variables', row())).toBe('company, product');
    expect(format('variables', row({ variables: [] }))).toBe('—');
  });

  it('renders one chip per tag', () => {
    renderTags(row());
    expect(screen.getByText('weekly')).toBeInTheDocument();
    expect(screen.getByText('team')).toBeInTheDocument();
  });

  it('renders a dash for a prompt with no tags', () => {
    renderTags(row({ tags: [] }));
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('renders nothing while the row is still loading', () => {
    const { container } = renderTags(undefined);
    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the tags column out of sorting and filtering', () => {
    expect(column('tags')).toMatchObject({ sortable: false, filter: false, floatingFilter: false });
  });

  it('offers run, copy, edit and delete actions', () => {
    const specs = column('actions').cellRendererParams.actionSpecs as RowActionSpec[];
    expect(specs.map((spec) => spec.key)).toEqual(['run', 'copy', 'edit', 'delete']);
  });
});
