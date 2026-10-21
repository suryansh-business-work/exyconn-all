import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  MaModelPurpose,
  useListEmployeeOptionsQuery,
  useMaAvailableModelsQuery,
  useMaSettingsQuery,
  useMaUpdateSettingsMutation,
} from '@exyconn/shell/graphql/generated';
import { MeetingSettingsPage } from '../../../src/settings/MeetingSettingsPage';
import { toSettingsValues } from '../../../src/forms/meeting-settings';
import { EMPLOYEES, makeSettings } from '../fixtures';
import { mutationTuple, queryResult, renderWithProviders } from '../test-utils';

vi.mock('@exyconn/shell/graphql/generated', async (orig) => ({
  ...(await orig<typeof import('@exyconn/shell/graphql/generated')>()),
  useMaSettingsQuery: vi.fn(),
  useMaUpdateSettingsMutation: vi.fn(),
  useListEmployeeOptionsQuery: vi.fn(),
  useMaAvailableModelsQuery: vi.fn(),
}));

const update = vi.fn();
const MODELS: Record<MaModelPurpose, string[]> = {
  [MaModelPurpose.Analysis]: ['gpt-4o', 'gpt-4o-mini'],
  [MaModelPurpose.Transcription]: ['gpt-4o-transcribe', 'whisper-1'],
};

beforeEach(() => {
  update.mockReset().mockResolvedValue({ data: {} });
  vi.mocked(useMaUpdateSettingsMutation).mockReturnValue(mutationTuple(update) as never);
  vi.mocked(useMaSettingsQuery).mockReturnValue(
    queryResult({ maSettings: makeSettings() }) as never,
  );
  vi.mocked(useListEmployeeOptionsQuery).mockReturnValue(queryResult(EMPLOYEES) as never);
  vi.mocked(useMaAvailableModelsQuery).mockImplementation(
    (options) =>
      queryResult({
        maAvailableModels: MODELS[(options.variables as { purpose: MaModelPurpose }).purpose],
      }) as never,
  );
});

describe('MeetingSettingsPage — models', () => {
  it('asks the server for the models of each purpose and offers them', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MeetingSettingsPage />);
    const purposes = vi
      .mocked(useMaAvailableModelsQuery)
      .mock.calls.map(([options]) => (options.variables as { purpose: string }).purpose);
    expect(new Set(purposes)).toEqual(
      new Set([MaModelPurpose.Analysis, MaModelPurpose.Transcription]),
    );
    const transcription = screen.getByRole('combobox', { name: /^Transcription model/ });
    await user.clear(transcription);
    await user.click(transcription);
    expect(await screen.findByRole('option', { name: 'whisper-1' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'gpt-4o' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: 'whisper-1' }));
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(update).toHaveBeenCalledWith({
      variables: {
        input: { ...toSettingsValues(makeSettings()), transcriptionModel: 'whisper-1' },
      },
    });
  });

  it('keeps a typed model name the list does not have', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MeetingSettingsPage />);
    const analysis = screen.getByRole('combobox', { name: /^Analysis model/ });
    await user.clear(analysis);
    await user.type(analysis, 'my-custom-model');
    expect(await screen.findByRole('option', { name: 'Use "my-custom-model"' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(update).toHaveBeenCalledWith({
      variables: {
        input: { ...toSettingsValues(makeSettings()), analysisModel: 'my-custom-model' },
      },
    });
  });

  it('refuses a model name with a space', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MeetingSettingsPage />);
    const analysis = screen.getByRole('combobox', { name: /^Analysis model/ });
    await user.clear(analysis);
    await user.type(analysis, 'gpt 4o');
    await user.click(screen.getByRole('button', { name: 'Save settings' }));
    expect(
      await screen.findByText('Use letters, digits and . _ : / - only, with no spaces'),
    ).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it('says why the list is missing, and still takes a typed name', async () => {
    vi.mocked(useMaAvailableModelsQuery).mockReturnValue(
      queryResult(undefined, { error: new Error('OpenAI is not configured.') }) as never,
    );
    renderWithProviders(<MeetingSettingsPage />);
    expect(
      screen.getAllByText('OpenAI is not configured. You can still type a name.'),
    ).toHaveLength(2);
    expect(screen.getByRole('combobox', { name: /^Analysis model/ })).toHaveValue('gpt-analysis');
  });
});
