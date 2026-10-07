import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CmsDocumentStatus, CmsPageKind } from '@exyconn/shell/graphql/generated';
import { PagesToolbar } from '../../../../../src/pages/cms/pages/PagesToolbar';
import type { PageFilters } from '../../../../../src/pages/cms/pages/useCmsPagesFetcher';
import { renderWithProviders } from '../../../test-utils';

function renderToolbar(filters: PageFilters) {
  const onChange = vi.fn();
  renderWithProviders(<PagesToolbar filters={filters} onChange={onChange} />);
  const [status, kind] = screen.getAllByRole('combobox');
  return { onChange, status, kind };
}

describe('PagesToolbar', () => {
  it('shows "any" for both filters when nothing is filtered', () => {
    const { status, kind } = renderToolbar({ status: '', kind: '' });

    expect(status).toHaveTextContent('Any status');
    expect(kind).toHaveTextContent('Pages and templates');
  });

  it('filters by status, keeping the kind', async () => {
    const { onChange, status } = renderToolbar({ status: '', kind: CmsPageKind.Page });

    await userEvent.click(status);
    expect(screen.getByRole('option', { name: 'Draft' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Changed' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Published' }));

    expect(onChange).toHaveBeenCalledWith({
      status: CmsDocumentStatus.Published,
      kind: CmsPageKind.Page,
    });
  });

  it('filters by kind, keeping the status', async () => {
    const { onChange, kind } = renderToolbar({ status: CmsDocumentStatus.Draft, kind: '' });

    await userEvent.click(kind);
    expect(screen.getByRole('option', { name: 'Pages' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('option', { name: 'Templates' }));

    expect(onChange).toHaveBeenCalledWith({
      status: CmsDocumentStatus.Draft,
      kind: CmsPageKind.Template,
    });
  });
});
