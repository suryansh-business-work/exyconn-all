import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadSearchForm } from '../../../../../../src/pages/lead-generator/forms/lead-search';
import { renderWithProviders } from '../../../../test-utils';

const suggestions = vi.hoisted(() => ({ result: {} as Record<string, unknown> }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useLeadLocationSuggestionsQuery: () => suggestions.result,
}));

const KORAMANGALA = {
  placeId: 'kor',
  text: 'Koramangala, Bengaluru, India',
  mainText: 'Koramangala',
  secondaryText: 'Bengaluru, India',
};
const INDIA = { placeId: 'in', text: 'India', mainText: 'India', secondaryText: '' };

function renderField() {
  renderWithProviders(
    <LeadSearchForm
      searching={false}
      mapReady
      mapHint=""
      area={[]}
      onModeChange={vi.fn()}
      onCircleChange={vi.fn()}
      onSearch={vi.fn()}
    />,
  );
  return screen.getByRole('combobox', { name: 'Where' });
}

describe('LeadSearchLocationField', () => {
  beforeEach(() => {
    suggestions.result = { loading: false };
  });

  it("lists Google's places as names with their region underneath", async () => {
    suggestions.result = {
      loading: false,
      data: { leadLocationSuggestions: [KORAMANGALA, INDIA] },
    };
    const field = renderField();

    await userEvent.type(field, 'Kor');

    const options = await screen.findAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'KoramangalaBengaluru, India',
      'India',
    ]);
    expect(within(options[1]).getAllByText(/.+/)).toHaveLength(1);
  });

  it('fills in the full name of the place chosen, and clears it again', async () => {
    suggestions.result = { loading: false, data: { leadLocationSuggestions: [KORAMANGALA] } };
    const field = renderField();
    await userEvent.type(field, 'Kor');

    await userEvent.click(await screen.findByRole('option', { name: /Koramangala/ }));
    expect(field).toHaveValue('Koramangala, Bengaluru, India');

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(field).toHaveValue('');
  });

  it('accepts any text, such as a full street address', async () => {
    const field = renderField();

    await userEvent.type(field, '12 MG Road, Bengaluru');

    expect(field).toHaveValue('12 MG Road, Bengaluru');
  });

  it('shows that places are being looked up', async () => {
    suggestions.result = { loading: true };
    const field = renderField();

    await userEvent.type(field, 'Kor');

    expect(await screen.findByText('Looking up places…')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });
});
