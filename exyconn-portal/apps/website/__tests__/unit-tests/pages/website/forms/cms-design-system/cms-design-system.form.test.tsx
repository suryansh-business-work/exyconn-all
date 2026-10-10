import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UseEntitySaveOptions } from '@exyconn/shell/components/form/useEntitySave';
import {
  DesignSystemForm,
  type CmsDesignSystemRow,
  type DesignSystemFormValues,
} from '../../../../../../src/pages/website/forms/cms-design-system';
import { renderWithProviders } from '../../../../test-utils';
import { UrlProbe } from '../../../cms/cms-helpers';

const gql = vi.hoisted(() => ({
  update: vi.fn(),
  saveOptions: null as UseEntitySaveOptions<DesignSystemFormValues, CmsDesignSystemRow> | null,
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateCmsDesignSystemMutation: () => [gql.update],
}));

/** The real save hook, with the options the form hands it recorded. */
vi.mock('@exyconn/shell/components/form/useEntitySave', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/form/useEntitySave')>();
  return {
    useEntitySave: (options: UseEntitySaveOptions<DesignSystemFormValues, CmsDesignSystemRow>) => {
      gql.saveOptions = options;
      return actual.useEntitySave(options);
    },
  };
});

const BASE = '/website/s/main/design-system';

const design: CmsDesignSystemRow = {
  id: 'ds-1',
  siteId: 'site-1',
  name: 'Brand',
  tokens: {
    palette: { 'brand-500': '#f9851f' },
    radii: { md: '0.5rem' },
  },
  extraCss: '',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

const savedTokens = {
  palette: { 'brand-500': '#f9851f' },
  colors: { light: {}, dark: {} },
  fonts: {},
  radii: { md: '0.5rem' },
  shadows: {},
  spacing: {},
  fontSources: [],
};

function setup(route = BASE) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <>
      <DesignSystemForm design={design} basePath={BASE} onDone={onDone} onCancel={onCancel} />
      <UrlProbe />
    </>,
    { route },
  );
  return { user: userEvent.setup(), onDone, onCancel };
}

const save = () => screen.getByRole('button', { name: 'Save design system' });

describe('DesignSystemForm', () => {
  beforeEach(() => {
    gql.update.mockReset();
  });

  it('opens on the palette, with a live preview beside it', async () => {
    setup();

    await waitFor(() =>
      expect(screen.getByLabelText('current url')).toHaveTextContent(`${BASE}/palette`),
    );
    expect(screen.getByRole('tab', { name: 'Palette' })).toHaveAttribute('aria-selected', 'true');
    const names = screen.getAllByRole('textbox', { name: 'Name' });
    expect(names[0]).toHaveValue('Brand');
    expect(names[1]).toHaveValue('brand-500');
    expect(screen.getByText('Preview')).toBeInTheDocument();
    expect(screen.getByTitle('md')).toBeInTheDocument();
  });

  it('saves a renamed design system as tokens of its site', async () => {
    gql.update.mockResolvedValue({ data: {} });
    const { user, onDone } = setup();

    const name = screen.getAllByRole('textbox', { name: 'Name' })[0];
    await user.clear(name);
    await user.type(name, 'Brand 2026');
    await user.click(save());

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        id: 'ds-1',
        input: { siteId: 'site-1', name: 'Brand 2026', tokens: savedTokens, extraCss: '' },
      },
    });
    expect(await screen.findByText('Design system updated')).toBeInTheDocument();
  });

  it('moves between token groups through the tabs', async () => {
    const { user } = setup(`${BASE}/palette`);

    await user.click(screen.getByRole('tab', { name: 'Radii' }));

    expect(screen.getByLabelText('current url')).toHaveTextContent(`${BASE}/radii`);
    expect(screen.getByText('--radius-md')).toBeInTheDocument();
  });

  it('refuses a token name used twice', async () => {
    const { user } = setup(`${BASE}/palette`);

    await user.click(screen.getByRole('button', { name: 'Add token' }));
    const names = screen.getAllByRole('textbox', { name: 'Name' });
    await user.type(names[2], 'brand-500');
    await user.type(screen.getAllByRole('textbox', { name: 'Value' })[1], '#000000');
    await user.click(save());

    expect(await screen.findByText('This name is used twice')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('shows why the save failed', async () => {
    gql.update.mockRejectedValue(new Error('Design system was deleted'));
    const { user, onDone } = setup(`${BASE}/palette`);

    await user.click(save());

    expect(await screen.findByText('Design system was deleted')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('never creates a design system: the create step resolves without a mutation', async () => {
    setup(`${BASE}/palette`);

    await expect(gql.saveOptions?.create({} as DesignSystemFormValues)).resolves.toBeUndefined();
    expect(gql.update).not.toHaveBeenCalled();
  });

  it('cancels', async () => {
    const { user, onCancel } = setup(`${BASE}/palette`);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
