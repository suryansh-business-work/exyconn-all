import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  AiSpendLimitForm,
  type AiSpendLimit,
} from '../../../../../../src/pages/environment-variables/forms/ai-spend-limit';
import { renderWithProviders } from '../../../../test-utils';
import { doneOnce, expectMessages, fill, formCallbacks, press, toast } from '../form.helpers';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveAiSpendLimitMutation: () => [gql.save],
}));

const cb = formCallbacks();

const MONTHLY = 'Whole workspace, this calendar month (USD)';
const DAILY = 'Per person, today (USD)';

const limit = (overrides: Partial<AiSpendLimit> = {}): AiSpendLimit => ({
  monthlyUsdCap: 250,
  perUserDailyUsdCap: 5,
  enabled: true,
  ...overrides,
});

const renderForm = (initial: AiSpendLimit = limit()) =>
  renderWithProviders(
    <AiSpendLimitForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('AiSpendLimitForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('shows the stored budget and explains that 0 switches a cap off', () => {
    renderForm();
    expect(screen.getByLabelText(MONTHLY)).toHaveValue('250');
    expect(screen.getByLabelText(DAILY)).toHaveValue('5');
    expect(screen.getByRole('switch', { name: 'Enforce the AI budget' })).toBeChecked();
    expect(screen.getByText(/Leave a cap at 0 to switch it off/)).toBeInTheDocument();
  });

  it('saves edited caps as numbers and can stop enforcing them', async () => {
    renderForm();
    fill(MONTHLY, '1000');
    fill(DAILY, '0');
    await userEvent.click(screen.getByRole('switch', { name: 'Enforce the AI budget' }));
    await press('Save budget');

    await doneOnce(cb.onDone);
    expect(gql.save).toHaveBeenCalledWith({
      variables: { input: { monthlyUsdCap: 1000, perUserDailyUsdCap: 0, enabled: false } },
    });
    expect(await toast()).toHaveTextContent('AI budget saved');
  });

  it('turns an unenforced budget back on', async () => {
    renderForm(limit({ enabled: false }));
    const toggle = screen.getByRole('switch', { name: 'Enforce the AI budget' });
    expect(toggle).not.toBeChecked();
    await userEvent.click(toggle);
    await press('Save budget');
    await doneOnce(cb.onDone);
    expect(gql.save.mock.calls[0][0].variables.input.enabled).toBe(true);
  });

  it('refuses a cap that is not a number or is negative', async () => {
    renderForm();
    fill(MONTHLY, 'lots');
    fill(DAILY, '-2');
    await press('Save budget');
    await expectMessages(
      'The monthly cap must be a number',
      'The per-person daily cap cannot be negative',
    );
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('treats a cap above $100,000 as a typo', async () => {
    renderForm();
    fill(MONTHLY, '100001');
    fill(DAILY, '250000');
    await press('Save budget');
    expect(await screen.findByText(/^The monthly cap must be at most \$100/)).toBeInTheDocument();
    expect(screen.getByText(/^The per-person daily cap must be at most \$100/)).toBeInTheDocument();
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('accepts exactly $100,000', async () => {
    renderForm();
    fill(MONTHLY, '100000');
    await press('Save budget');
    await doneOnce(cb.onDone);
    expect(gql.save.mock.calls[0][0].variables.input.monthlyUsdCap).toBe(100000);
  });

  it('shows why the budget could not be saved', async () => {
    gql.save.mockRejectedValue(new Error('Only a super admin may change the budget'));
    renderForm();
    await press('Save budget');
    expect(await toast()).toHaveTextContent('Only a super admin may change the budget');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message for an unexplained failure', async () => {
    gql.save.mockRejectedValue({ code: 500 });
    renderForm();
    await press('Save budget');
    expect(await toast()).toHaveTextContent('Could not save the budget');
  });

  it('hands control back on Cancel', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
  });
});
