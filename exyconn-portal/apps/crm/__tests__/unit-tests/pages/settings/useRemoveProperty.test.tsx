import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CrmObject,
  CrmObjectSchemaDocument,
  CrmPropertiesDocument,
} from '@exyconn/shell/graphql/generated';
import { useRemoveProperty } from '../../../../src/pages/settings/useRemoveProperty';
import { renderHookWithProviders } from '../../test-utils';
import { propertyRow } from './settings-fixtures';

const gql = vi.hoisted(() => ({ remove: vi.fn(), options: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useDeleteCrmPropertyMutation: (options: unknown) => {
    gql.options(options);
    return [gql.remove];
  },
}));

const PROPERTY = propertyRow({ id: 'prop-7', label: 'Tier' });

/** Starts a delete and answers the confirmation with the button named `answer`. */
async function removeAnswering(answer: 'Delete' | 'Cancel') {
  const { result } = renderHookWithProviders(() => useRemoveProperty(CrmObject.Company));
  let done: Promise<void> = Promise.resolve();
  act(() => {
    done = result.current(PROPERTY);
  });
  const dialog = await screen.findByRole('dialog');
  expect(
    within(dialog).getByText(
      'Delete "Tier"? Its value is removed from every record that has one. This cannot be undone.',
    ),
  ).toBeInTheDocument();
  await userEvent.click(within(dialog).getByRole('button', { name: answer }));
  await act(() => done);
}

describe('useRemoveProperty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.remove.mockResolvedValue({ data: { deleteCrmProperty: true } });
  });

  it('re-reads the record type schema and properties once a delete lands', () => {
    renderHookWithProviders(() => useRemoveProperty(CrmObject.Company));

    expect(gql.options).toHaveBeenCalledWith({
      refetchQueries: [
        { query: CrmObjectSchemaDocument, variables: { object: CrmObject.Company } },
        { query: CrmPropertiesDocument, variables: { object: CrmObject.Company } },
      ],
      awaitRefetchQueries: true,
    });
  });

  it('deletes the property once confirmed and says so', async () => {
    await removeAnswering('Delete');

    expect(gql.remove).toHaveBeenCalledWith({ variables: { id: 'prop-7' } });
    expect(await screen.findByText('Property "Tier" deleted')).toBeInTheDocument();
  });

  it('keeps the property when the prompt is cancelled', async () => {
    await removeAnswering('Cancel');

    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('shows the server reason when the delete fails', async () => {
    gql.remove.mockRejectedValueOnce(new Error('Property is in use by an import'));

    await removeAnswering('Delete');

    expect(await screen.findByText('Property is in use by an import')).toBeInTheDocument();
  });

  it('falls back to a plain message for a failure without a reason', async () => {
    gql.remove.mockRejectedValueOnce({ code: 'NETWORK' });

    await removeAnswering('Delete');

    expect(await screen.findByText('Could not delete the property')).toBeInTheDocument();
  });
});
