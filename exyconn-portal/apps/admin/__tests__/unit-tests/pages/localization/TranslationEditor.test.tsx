import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { SetTranslationDocument } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { TranslationEditor } from '../../../../src/pages/localization/TranslationEditor';

const SOURCE = 'Save changes';
const FIELD = `Translation of "${SOURCE}"`;

const saved = (text: string, delay = 0): MockLink.MockedResponse => ({
  request: { query: SetTranslationDocument, variables: { locale: 'fr', source: SOURCE, text } },
  result: {
    data: {
      setTranslation: { __typename: 'Translation', key: 'k-1', source: SOURCE, text },
    },
  },
  delay,
});

function mount(mocks: MockLink.MockedResponse[] = []) {
  const onSaved = vi.fn();
  const user = userEvent.setup();
  renderWithProviders(
    <TranslationEditor locale="fr" source={SOURCE} text="Enregistrer" onSaved={onSaved} />,
    { mocks },
  );
  return { user, onSaved };
}

describe('TranslationEditor', () => {
  it('offers no save until the text is changed to something that is not blank', async () => {
    const { user } = mount();
    const field = screen.getByRole('textbox', { name: FIELD });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(field).toHaveValue('Enregistrer');
    expect(save).toBeDisabled();

    await user.clear(field);
    await user.type(field, '   ');
    expect(save).toBeDisabled();

    await user.clear(field);
    await user.type(field, 'Enregistrer');
    expect(save).toBeDisabled();

    await user.type(field, ' tout');
    expect(save).toBeEnabled();
  });

  it('saves the correction, says so, and lets the list reload', async () => {
    const { user, onSaved } = mount([saved('Sauvegarder', 30)]);
    const field = screen.getByRole('textbox', { name: FIELD });
    await user.clear(field);
    await user.type(field, 'Sauvegarder');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    // Locked while the save is in flight, so it cannot be sent twice.
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(await screen.findByText('Translation saved')).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });

  it('says why a correction could not be saved and keeps what was typed', async () => {
    const { user, onSaved } = mount([
      {
        request: {
          query: SetTranslationDocument,
          variables: { locale: 'fr', source: SOURCE, text: 'Garder' },
        },
        error: new Error('Translations are read-only'),
      },
    ]);
    const field = screen.getByRole('textbox', { name: FIELD });
    await user.clear(field);
    await user.type(field, 'Garder');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Translations are read-only')).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
    expect(field).toHaveValue('Garder');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled());
  });
});
