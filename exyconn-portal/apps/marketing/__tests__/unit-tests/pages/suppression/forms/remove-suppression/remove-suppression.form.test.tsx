import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { SuppressionReason } from '@exyconn/shell/graphql/generated';
import {
  MIN_JUSTIFICATION,
  RemoveSuppressionForm,
  removeSuppressionSchema,
} from '../../../../../../src/pages/suppression/forms/remove-suppression';
import { renderWithProviders } from '../../../../test-utils';
import { press } from '../../../../form-helpers';
import { typeInto } from '../../suppression.helpers';

const gql = vi.hoisted(() => ({ remove: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useRemoveMarketingSuppressionMutation: () => [gql.remove],
}));

const CONSENT_WARNING =
  'This person withdrew consent themselves. Only an administrator can remove it, and only with their renewed consent.';
const JUSTIFICATION = 'Re-subscribed on the website on 3 March';

function renderRemove(reason = SuppressionReason.Manual) {
  const onDone = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <RemoveSuppressionForm
      id="suppression-1"
      email="gone@acme.io"
      reason={reason}
      onDone={onDone}
      onCancel={onCancel}
    />,
  );
  return { onDone, onCancel };
}

function answer(justification: string, confirmEmail: string) {
  typeInto('Why are you removing it?', justification);
  typeInto('Type the address to confirm', confirmEmail);
}

describe('removeSuppressionSchema', () => {
  it('needs a justification of at least the server minimum', () => {
    const short = removeSuppressionSchema.safeParse({
      justification: ` ${'x'.repeat(MIN_JUSTIFICATION - 1)} `,
      confirmEmail: '',
    });
    expect(short.error?.issues[0].message).toBe('Say why in at least 10 characters');
    expect(
      removeSuppressionSchema.parse({
        justification: 'x'.repeat(MIN_JUSTIFICATION),
        confirmEmail: ' a@b.io ',
      }),
    ).toEqual({ justification: 'x'.repeat(MIN_JUSTIFICATION), confirmEmail: 'a@b.io' });
  });

  it('caps the justification at 500 characters', () => {
    expect(
      removeSuppressionSchema.safeParse({ justification: 'x'.repeat(500), confirmEmail: '' })
        .success,
    ).toBe(true);
    const long = removeSuppressionSchema.safeParse({
      justification: 'x'.repeat(501),
      confirmEmail: '',
    });
    expect(long.error?.issues[0].message).toBe('Keep it under 500 characters');
  });
});

describe('RemoveSuppressionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    gql.remove.mockResolvedValue({ data: { removeMarketingSuppression: true } });
  });

  it('says what removing means and shows the address to type back', () => {
    renderRemove();

    expect(
      screen.getByText(
        'Campaigns will be able to email gone@acme.io again. The removal and your reason are recorded.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: /^Type the address to confirm/ }),
    ).toHaveAccessibleDescription('gone@acme.io');
    expect(screen.queryByText(CONSENT_WARNING)).not.toBeInTheDocument();
  });

  it.each([SuppressionReason.Unsubscribed, SuppressionReason.SpamComplaint])(
    'warns that a %s suppression is the person’s own withdrawal of consent',
    (reason) => {
      renderRemove(reason);

      expect(screen.getByText(CONSENT_WARNING)).toBeInTheDocument();
    },
  );

  it('asks for a justification before anything else', async () => {
    renderRemove();

    await press('Remove suppression');

    expect(await screen.findByText('Say why in at least 10 characters')).toBeInTheDocument();
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('refuses a typed address that does not match', async () => {
    renderRemove();
    answer(JUSTIFICATION, 'other@acme.io');

    await press('Remove suppression');

    expect(await screen.findByText('Type the address exactly to confirm')).toBeInTheDocument();
    expect(gql.remove).not.toHaveBeenCalled();
  });

  it('removes once the address is typed back, ignoring case and spaces', async () => {
    const { onDone } = renderRemove();
    answer(`  ${JUSTIFICATION}  `, '  GONE@Acme.io ');

    await press('Remove suppression');

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(gql.remove).toHaveBeenCalledWith({
      variables: { id: 'suppression-1', justification: JUSTIFICATION },
    });
    expect(
      await screen.findByText('gone@acme.io removed from the suppression list'),
    ).toBeInTheDocument();
  });

  it('shows the server refusal and stays open', async () => {
    gql.remove.mockRejectedValue(new Error('Only an administrator can remove this'));
    const { onDone } = renderRemove(SuppressionReason.Unsubscribed);
    answer(JUSTIFICATION, 'gone@acme.io');

    await press('Remove suppression');

    expect(await screen.findByText('Only an administrator can remove this')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure is not an Error', async () => {
    gql.remove.mockRejectedValue('offline');
    renderRemove();
    answer(JUSTIFICATION, 'gone@acme.io');

    await press('Remove suppression');

    expect(await screen.findByText('The suppression could not be removed')).toBeInTheDocument();
  });

  it('cancels without removing', async () => {
    const { onCancel } = renderRemove();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(gql.remove).not.toHaveBeenCalled();
  });
});
