import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import {
  AiModelPriceForm,
  type AiModelPriceRow,
} from '../../../../../../src/pages/environment-variables/forms/ai-model-price';
import { renderWithProviders } from '../../../../test-utils';
import {
  doneOnce,
  expectMessages,
  fill,
  formCallbacks,
  pickOption,
  press,
  toast,
} from '../form.helpers';

const gql = vi.hoisted(() => ({ save: vi.fn() }));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useSaveAiModelPriceMutation: () => [gql.save],
}));

const cb = formCallbacks();

const stored = (overrides: Partial<AiModelPriceRow> = {}): AiModelPriceRow => ({
  id: 'price-1',
  model: 'gpt-4o-mini',
  inputPer1kUsd: 0.00015,
  outputPer1kUsd: 0.0006,
  active: true,
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...overrides,
});

const renderForm = (initial: AiModelPriceRow | null = null) =>
  renderWithProviders(
    <AiModelPriceForm initial={initial} onDone={cb.onDone} onCancel={cb.onCancel} />,
  );

describe('AiModelPriceForm', () => {
  beforeEach(() => {
    gql.save.mockReset().mockResolvedValue({ data: {} });
    cb.reset();
  });

  it('starts a new price at zero, active, with an editable model name', () => {
    renderForm();
    expect(screen.getByLabelText('Model')).toBeEnabled();
    expect(screen.getByLabelText('Input price (USD / 1K tokens)')).toHaveValue('0');
    expect(screen.getByLabelText('Output price (USD / 1K tokens)')).toHaveValue('0');
    expect(screen.getByRole('combobox', { name: /^Use this price/ })).toHaveTextContent('Yes');
    expect(screen.getByText(/we never guess a rate/)).toBeInTheDocument();
  });

  it('asks which model the price is for', async () => {
    renderForm();
    await press('Save price');
    await expectMessages('Name the model this price is for');
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('refuses prices that are not numbers, negative or quoted per million', async () => {
    renderForm();
    fill('Model', 'gpt-4o');
    fill('Input price (USD / 1K tokens)', 'cheap');
    fill('Output price (USD / 1K tokens)', '-1');
    await press('Save price');
    await expectMessages('The input price must be a number', 'The output price cannot be negative');

    fill('Input price (USD / 1K tokens)', '15');
    fill('Output price (USD / 1K tokens)', '10.5');
    await press('Save price');
    await expectMessages(
      'The input price looks wrong — it is per 1,000 tokens, not per million',
      'The output price looks wrong — it is per 1,000 tokens, not per million',
    );
    expect(gql.save).not.toHaveBeenCalled();
  });

  it('saves a new model price as numbers and says so', async () => {
    renderForm();
    fill('Model', 'gpt-4.1');
    fill('Input price (USD / 1K tokens)', '0.002');
    fill('Output price (USD / 1K tokens)', '10');
    await press('Save price');

    await doneOnce(cb.onDone);
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: { model: 'gpt-4.1', inputPer1kUsd: 0.002, outputPer1kUsd: 10, active: true },
      },
    });
    expect(await toast()).toHaveTextContent('Price for gpt-4.1 saved');
  });

  it('corrects a stored price without renaming the model and can switch it off', async () => {
    renderForm(stored());
    expect(screen.getByLabelText('Model')).toBeDisabled();
    expect(screen.getByLabelText('Input price (USD / 1K tokens)')).toHaveValue('0.00015');
    await pickOption(/^Use this price/, 'No');
    await press('Save price');

    await doneOnce(cb.onDone);
    expect(gql.save).toHaveBeenCalledWith({
      variables: {
        input: {
          model: 'gpt-4o-mini',
          inputPer1kUsd: 0.00015,
          outputPer1kUsd: 0.0006,
          active: false,
        },
      },
    });
  });

  it('keeps an inactive price inactive when saved untouched', async () => {
    renderForm(stored({ active: false }));
    expect(screen.getByRole('combobox', { name: /^Use this price/ })).toHaveTextContent('No');
    await press('Save price');
    await doneOnce(cb.onDone);
    expect(gql.save.mock.calls[0][0].variables.input.active).toBe(false);
  });

  it('shows the server reason when the save fails, and stays open', async () => {
    gql.save.mockRejectedValue(new Error('Model gpt-4.1 is retired'));
    renderForm(stored());
    await press('Save price');
    expect(await toast()).toHaveTextContent('Model gpt-4.1 is retired');
    expect(cb.onDone).not.toHaveBeenCalled();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    gql.save.mockRejectedValue('offline');
    renderForm(stored());
    await press('Save price');
    expect(await toast()).toHaveTextContent('Could not save the price');
  });

  it('hands control back on Cancel without saving', async () => {
    renderForm();
    await press('Cancel');
    expect(cb.onCancel).toHaveBeenCalledTimes(1);
    expect(gql.save).not.toHaveBeenCalled();
  });
});
