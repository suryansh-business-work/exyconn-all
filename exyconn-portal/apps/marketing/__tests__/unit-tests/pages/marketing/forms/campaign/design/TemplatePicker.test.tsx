import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorMode } from '@exyconn/shell/graphql/generated';
import { TemplatePicker } from '../../../../../../../src/pages/marketing/forms/campaign/design/TemplatePicker';
import {
  DEFAULT_SETTINGS,
  newBlock,
} from '../../../../../../../src/pages/marketing/forms/campaign/design/blocks';
import { renderWithProviders } from '../../../../../test-utils';

const gql = vi.hoisted(() => ({ saved: vi.fn(), tech: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useListCampaignTemplatesQuery: (options: unknown) => gql.saved(options),
  useTechEmailTemplateOptionsQuery: () => gql.tech(),
}));

const BLOCKS = [newBlock('text')];

const template = (id: string, category: string, overrides: Record<string, unknown> = {}) => ({
  id,
  name: `Template ${id}`,
  category,
  description: '',
  editorMode: EditorMode.Visual,
  blocks: { blocks: BLOCKS },
  mjml: `<mjml>${id}</mjml>`,
  version: 3,
  updatedByName: 'Asha',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

const TEMPLATES = [
  template('t1', 'Newsletters', { description: 'Monthly digest' }),
  template('t2', 'Offers'),
  template('t3', 'Newsletters', { editorMode: EditorMode.Code, blocks: {} }),
];
const TECH = [{ key: 'welcome', name: 'Welcome email', mjml: '<mjml>welcome</mjml>' }];

const answer = (saved: unknown[], tech: unknown[]) => {
  gql.saved.mockReturnValue({ data: { listCampaignTemplates: saved }, loading: false });
  gql.tech.mockReturnValue({ data: { techEmailTemplateOptions: tech } });
};

const useButtonOf = (name: string) =>
  within(screen.getByText(name).closest('li') as HTMLElement).getByRole('button', { name: 'Use' });

describe('TemplatePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    answer(TEMPLATES, TECH);
  });

  it('shows a placeholder until the saved templates first arrive', () => {
    gql.saved.mockReturnValue({ data: undefined, loading: true });
    gql.tech.mockReturnValue({ data: undefined });
    const { container } = renderWithProviders(<TemplatePicker onPick={vi.fn()} />);
    expect(container.querySelector('.MuiSkeleton-root')).not.toBeNull();
    expect(gql.saved).toHaveBeenCalledWith({ fetchPolicy: 'cache-and-network' });
  });

  it('groups templates by category, then the Tech > Email ones', () => {
    renderWithProviders(<TemplatePicker onPick={vi.fn()} />);
    const headers = screen.getAllByText(/^(Newsletters|Offers|From Tech > Email)$/);
    expect(headers.map((header) => header.textContent)).toEqual([
      'Newsletters',
      'Offers',
      'From Tech > Email',
    ]);
    expect(screen.getByText('Monthly digest')).toBeInTheDocument();
    expect(screen.getAllByText('Version 3')).toHaveLength(2);
    expect(screen.getByText('welcome')).toBeInTheDocument();
    expect(screen.getByText(/never changes the template/)).toBeInTheDocument();
  });

  it('gives a visual template’s design and MJML', async () => {
    const onPick = vi.fn();
    renderWithProviders(<TemplatePicker onPick={onPick} />);
    await userEvent.click(useButtonOf('Template t1'));
    expect(onPick).toHaveBeenCalledWith({
      editorMode: EditorMode.Visual,
      design: { settings: DEFAULT_SETTINGS, blocks: BLOCKS },
      mjml: '<mjml>t1</mjml>',
    });
  });

  it('gives a code template without a design', async () => {
    const onPick = vi.fn();
    renderWithProviders(<TemplatePicker onPick={onPick} />);
    await userEvent.click(useButtonOf('Template t3'));
    expect(onPick).toHaveBeenCalledWith({
      editorMode: EditorMode.Code,
      design: null,
      mjml: '<mjml>t3</mjml>',
    });
  });

  it('gives a Tech > Email template as code', async () => {
    const onPick = vi.fn();
    renderWithProviders(<TemplatePicker onPick={onPick} />);
    await userEvent.click(useButtonOf('Welcome email'));
    expect(onPick).toHaveBeenCalledWith({
      editorMode: EditorMode.Code,
      design: null,
      mjml: '<mjml>welcome</mjml>',
    });
  });

  it('says when there are no templates of either kind', () => {
    answer([], []);
    renderWithProviders(<TemplatePicker onPick={vi.fn()} />);
    expect(
      screen.getByText('No templates yet. Save a design as a template to reuse it.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('From Tech > Email')).not.toBeInTheDocument();
  });

  it('shows only the Tech > Email group when nothing is saved', () => {
    answer([], TECH);
    renderWithProviders(<TemplatePicker onPick={vi.fn()} />);
    expect(screen.getByText('From Tech > Email')).toBeInTheDocument();
    expect(screen.queryByText(/No templates yet/)).not.toBeInTheDocument();
  });

  it('shows why the saved or Tech templates failed to load', () => {
    gql.saved.mockReturnValue({ data: undefined, loading: false, error: new Error('Saved down') });
    gql.tech.mockReturnValue({ data: undefined, error: new Error('Tech down') });
    const { unmount } = renderWithProviders(<TemplatePicker onPick={vi.fn()} />);
    expect(screen.getByText('Saved down')).toBeInTheDocument();
    expect(screen.queryByText('Tech down')).not.toBeInTheDocument();
    unmount();
    gql.saved.mockReturnValue({ data: undefined, loading: false });
    renderWithProviders(<TemplatePicker onPick={vi.fn()} />);
    expect(screen.getByText('Tech down')).toBeInTheDocument();
  });
});
