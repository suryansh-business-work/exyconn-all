import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  GoogleFontForm,
  type GoogleFontRow,
} from '../../../../../../src/pages/website/forms/cms-google-font';
import { renderWithProviders } from '../../../../test-utils';
import { pickOption } from '../form-helpers';

const gql = vi.hoisted(() => ({ fonts: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCmsGoogleFontsQuery: (options: unknown) => gql.fonts(options),
}));

const font = (family: string, variants: string[]): GoogleFontRow => ({
  family,
  category: 'Sans Serif',
  variants,
  subsets: ['latin'],
  popularity: 1,
});

const ROWS = [
  font('Inter', ['300', '400', '700']),
  font('Lora', ['400', '500']),
  font('Anton', ['700', '900']),
];

interface Setup {
  loaded?: readonly string[];
  onAdd?: () => void;
}

function setup({ loaded = [], onAdd = vi.fn() }: Readonly<Setup> = {}) {
  const onClose = vi.fn();
  renderWithProviders(<GoogleFontForm open loaded={loaded} onClose={onClose} onAdd={onAdd} />);
  return { user: userEvent.setup(), onClose, onAdd };
}

const addButton = () => screen.getByRole('button', { name: 'Add family' });
const family = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}`) });

describe('GoogleFontForm', () => {
  beforeEach(() => {
    gql.fonts.mockReset().mockReturnValue({
      data: { cmsGoogleFonts: { rows: ROWS, totalCount: 3 } },
      loading: false,
      error: undefined,
    });
  });

  it('adds the picked family in regular and bold', async () => {
    const { user, onAdd, onClose } = setup();

    expect(screen.getByRole('dialog', { name: 'Add a Google font' })).toBeInTheDocument();
    expect(addButton()).toBeDisabled();
    await user.click(family('Inter'));
    expect(screen.getByRole('checkbox', { name: 'Regular 400' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Bold 700' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Light 300' })).not.toBeChecked();
    await user.click(addButton());

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(onAdd).toHaveBeenCalledWith({
      provider: 'GOOGLE',
      family: 'Inter',
      variants: ['400', '700'],
    });
  });

  it('picks only regular for a family without bold', async () => {
    const { user, onAdd } = setup();

    await user.click(family('Lora'));
    await user.click(addButton());

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({ provider: 'GOOGLE', family: 'Lora', variants: ['400'] }),
    );
  });

  it('picks bold once for a family listed in bold', async () => {
    const { user, onAdd } = setup();

    await user.click(family('Anton'));
    await user.click(addButton());

    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith({
        provider: 'GOOGLE',
        family: 'Anton',
        variants: ['700'],
      }),
    );
  });

  it('refuses a family that is already loaded, whatever its case', async () => {
    const { user, onAdd, onClose } = setup({ loaded: ['inter'] });

    await user.click(family('Inter'));
    await user.click(addButton());

    expect(await screen.findByText('This family is already loaded')).toBeInTheDocument();
    expect(onAdd).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows why adding the family failed', async () => {
    const onAdd = vi.fn(() => {
      throw new Error('Too many families');
    });
    const { user, onClose } = setup({ onAdd });

    await user.click(family('Inter'));
    await user.click(addButton());

    expect(await screen.findByText('Too many families')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('searches and filters the catalogue', async () => {
    const { user } = setup();

    await user.type(screen.getByRole('textbox', { name: 'Search families' }), 'lo');
    await pickOption(user, 'Category', 'Serif');

    await waitFor(() =>
      expect(gql.fonts).toHaveBeenLastCalledWith(
        expect.objectContaining({ variables: { search: 'lo', category: 'Serif', limit: 30 } }),
      ),
    );
  });

  it('closes on cancel', async () => {
    const { user, onClose } = setup();
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
