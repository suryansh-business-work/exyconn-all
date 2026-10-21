import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { portalLogger } from '@exyconn/shell/logging/portalLogger';
import {
  EditVariantForm,
  editVariantSchema,
} from '../../../../src/records/cold-email/forms/edit-variant';
import { renderWithProviders } from '../../test-utils';
import { variant } from './cold-email-fixtures';

const gql = vi.hoisted(() => ({ update: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useUpdateColdEmailVariantMutation: () => [gql.update],
}));

const subject = () => screen.getByRole('textbox', { name: /^Subject\s*\*?$/ });
const message = () => screen.getByRole('textbox', { name: /^Message\s*\*?$/ });

function renderForm() {
  const onDone = vi.fn();
  renderWithProviders(
    <EditVariantForm
      draftId="draft-1"
      variant={variant('v1')}
      onDone={onDone}
      onCancel={vi.fn()}
    />,
  );
  return onDone;
}

describe('editVariantSchema', () => {
  it('trims both fields and holds them to their limits', () => {
    expect(editVariantSchema.parse({ subject: '  Hi ', body: ' Body ' })).toEqual({
      subject: 'Hi',
      body: 'Body',
    });
    expect(editVariantSchema.safeParse({ subject: '   ', body: 'x' }).success).toBe(false);
    expect(editVariantSchema.safeParse({ subject: 'x'.repeat(201), body: 'x' }).success).toBe(
      false,
    );
    expect(
      editVariantSchema.safeParse({ subject: 'x'.repeat(200), body: 'x'.repeat(5000) }).success,
    ).toBe(true);
    expect(editVariantSchema.safeParse({ subject: 'x', body: 'x'.repeat(5001) }).success).toBe(
      false,
    );
  });
});

describe('EditVariantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(portalLogger, 'warn').mockImplementation(() => undefined);
  });

  it('starts from the version and will not save it without a subject', async () => {
    const onDone = renderForm();
    expect(subject()).toHaveValue('Subject v1');
    expect(message()).toHaveValue('Body v1');

    await userEvent.clear(subject());
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Write a subject')).toBeInTheDocument();
    expect(gql.update).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('saves the edited version, trimmed, and closes', async () => {
    gql.update.mockResolvedValue({});
    const onDone = renderForm();

    await userEvent.clear(subject());
    await userEvent.type(subject(), '  Checkout audit ');
    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(gql.update).toHaveBeenCalledWith({
      variables: {
        draftId: 'draft-1',
        variantId: 'v1',
        subject: 'Checkout audit',
        body: 'Body v1',
      },
    });
    expect(await screen.findByText('Version saved')).toBeInTheDocument();
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('says why the version could not be saved, logs it, and stays open', async () => {
    gql.update.mockRejectedValue(new Error('Already sent'));
    const onDone = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByText('Already sent')).toBeInTheDocument();
    expect(portalLogger.warn).toHaveBeenCalledWith(
      'crm: saving a cold email version failed',
      expect.any(Error),
    );
    expect(onDone).not.toHaveBeenCalled();
  });
});
