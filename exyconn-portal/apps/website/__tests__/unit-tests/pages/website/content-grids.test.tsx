import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ICellRendererParams } from 'ag-grid-community';
import { BLOG_COLUMNS, type PagedBlogRow } from '../../../../src/pages/website/blog-grid';
import {
  CASE_STUDY_COLUMNS,
  type PagedCaseStudyRow,
} from '../../../../src/pages/website/case-studies-grid';
import { GIG_COLUMNS, type PagedGigRow } from '../../../../src/pages/website/gigs-grid';
import {
  JOB_COMPANY_COLUMNS,
  type PagedJobCompanyRow,
} from '../../../../src/pages/website/job-companies-grid';
import { JOB_COLUMNS, type PagedJobRow } from '../../../../src/pages/website/jobs-grid';
import { TOOL_COLUMNS, type PagedToolRow } from '../../../../src/pages/website/tools-grid';
import { activeStatus } from '../../../../src/pages/website/active-status';
import { actionSpecs, cellStatus, cellText, columnIds } from '../cms/cms-grid-helpers';
import { blogRow, jobCompanyRow, jobRow, toolRow } from './content-fixtures';

describe('activeStatus', () => {
  it('maps the isActive flag onto the shared status vocabulary', () => {
    expect(activeStatus({ isActive: true })).toBe('ACTIVE');
    expect(activeStatus({ isActive: false })).toBe('INACTIVE');
  });
});

describe('BLOG_COLUMNS', () => {
  it('lays out the blog grid with edit, live edit and delete actions', () => {
    expect(columnIds(BLOG_COLUMNS)).toEqual([
      'title',
      'slug',
      'author',
      'tags',
      'featured',
      'publishedAt',
      'actions',
    ]);
    expect(actionSpecs(BLOG_COLUMNS).map((spec) => spec.key)).toEqual([
      'edit',
      'liveEdit',
      'delete',
    ]);
  });

  it('shows the author by name and the tags as a list', () => {
    const row: PagedBlogRow = blogRow({ tags: ['ai', 'graphql'] });

    expect(cellText(BLOG_COLUMNS, 'author', row)).toBe('Ada Lovelace');
    expect(cellText(BLOG_COLUMNS, 'tags', row)).toBe('ai, graphql');
    expect(cellText(BLOG_COLUMNS, 'tags', blogRow({ tags: [] }))).toBe('');
    expect(cellText(BLOG_COLUMNS, 'author', undefined)).toBe('');
  });
});

describe('CASE_STUDY_COLUMNS', () => {
  it('lays out the case studies grid with edit, live edit and delete actions', () => {
    expect(columnIds<PagedCaseStudyRow>(CASE_STUDY_COLUMNS)).toEqual([
      'title',
      'slug',
      'category',
      'author',
      'featured',
      'publishedAt',
      'actions',
    ]);
    expect(actionSpecs(CASE_STUDY_COLUMNS).map((spec) => spec.key)).toEqual([
      'edit',
      'liveEdit',
      'delete',
    ]);
  });
});

describe('GIG_COLUMNS', () => {
  it('lays out the gigs grid with the default edit and delete actions', () => {
    expect(columnIds<PagedGigRow>(GIG_COLUMNS)).toEqual([
      'title',
      'gigCode',
      'category',
      'budget',
      'status',
      'postedDate',
      'actions',
    ]);
    expect(actionSpecs(GIG_COLUMNS).map((spec) => spec.key)).toEqual(['edit', 'delete']);
  });
});

describe('JOB_COMPANY_COLUMNS', () => {
  it('shows the status from the active flag and the order as a number', () => {
    const row: PagedJobCompanyRow = jobCompanyRow({ isActive: false, order: 3 });

    expect(columnIds(JOB_COMPANY_COLUMNS)).toEqual([
      'name',
      'slug',
      'companyCode',
      'industry',
      'isActive',
      'order',
      'actions',
    ]);
    expect(cellStatus(JOB_COMPANY_COLUMNS, 'isActive', row)).toBe('INACTIVE');
    expect(cellText(JOB_COMPANY_COLUMNS, 'order', row)).toBe('3');
    expect(cellStatus(JOB_COMPANY_COLUMNS, 'isActive', undefined)).toBeNull();
  });
});

describe('JOB_COLUMNS', () => {
  it('shows the status of an opening from its active flag', () => {
    const row: PagedJobRow = jobRow({ isActive: true });

    expect(columnIds(JOB_COLUMNS)).toEqual([
      'title',
      'jobCode',
      'companySlug',
      'category',
      'jobType',
      'workMode',
      'isActive',
      'actions',
    ]);
    expect(cellStatus(JOB_COLUMNS, 'isActive', row)).toBe('ACTIVE');
  });
});

describe('TOOL_COLUMNS', () => {
  const urlCell = TOOL_COLUMNS.find((column) => column.colId === 'url')?.cellRenderer as (
    params: Readonly<ICellRendererParams<PagedToolRow>>,
  ) => ReactElement;
  const renderUrl = (data: PagedToolRow | undefined) =>
    render(urlCell({ data } as ICellRendererParams<PagedToolRow>));

  it('lays out the tools grid with a display-only URL column', () => {
    const row = toolRow({ isActive: false, order: 7 });

    expect(columnIds(TOOL_COLUMNS)).toEqual([
      'name',
      'toolCode',
      'categorySlug',
      'url',
      'isActive',
      'isMVP',
      'order',
      'actions',
    ]);
    expect(TOOL_COLUMNS[3]).toMatchObject({ sortable: false, filter: false });
    expect(cellStatus(TOOL_COLUMNS, 'isActive', row)).toBe('INACTIVE');
    expect(cellText(TOOL_COLUMNS, 'order', row)).toBe('7');
  });

  it('links the tool URL in a new tab', () => {
    renderUrl(toolRow({ url: 'https://tools.exyconn.com/json' }));

    const link = screen.getByRole('link', { name: 'https://tools.exyconn.com/json' });
    expect(link).toHaveAttribute('href', 'https://tools.exyconn.com/json');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows a dash when the tool has no URL', () => {
    renderUrl(toolRow({ url: '' }));
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('shows a dash for a row that has not loaded', () => {
    renderUrl(undefined);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
