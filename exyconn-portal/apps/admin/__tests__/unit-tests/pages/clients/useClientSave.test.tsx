import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '../../test-utils';
import { useClientSave } from '../../../../src/pages/clients/forms/client/useClientSave';
import { client, clientValues } from './client.fixtures';

const api = vi.hoisted(() => ({
  create: vi.fn<(options: unknown) => Promise<unknown>>(),
  update: vi.fn<(options: unknown) => Promise<unknown>>(),
  setProjects: vi.fn<(options: unknown) => Promise<unknown>>(),
}));

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@exyconn/shell/graphql/generated')>();
  return {
    ...actual,
    useCreateClientMutation: () => [api.create],
    useUpdateClientMutation: () => [api.update],
    useSetClientProjectsMutation: () => [api.setProjects],
  };
});

const snackbar = () => document.querySelector('.MuiSnackbar-root');
const created = (id: string) => ({ data: { createClient: { id } } });

beforeEach(() => {
  api.create.mockReset();
  api.update.mockReset();
  api.setProjects.mockReset();
  api.create.mockResolvedValue(created('client-new'));
  api.update.mockResolvedValue({ data: { updateClient: { id: 'client-1' } } });
  api.setProjects.mockResolvedValue({ data: { setClientProjects: true } });
});

describe('useClientSave', () => {
  it('creates a new client, links its projects and reports it created', async () => {
    const onDone = vi.fn();
    const { result } = renderHookWithProviders(() => useClientSave(null, onDone));
    await act(() => result.current(clientValues({ projectIds: ['project-1'] })));

    expect(api.create).toHaveBeenCalledWith({
      variables: { input: expect.objectContaining({ name: 'Priya Shah', taxIdType: null }) },
    });
    expect(api.update).not.toHaveBeenCalled();
    expect(api.setProjects).toHaveBeenCalledWith({
      variables: { clientId: 'client-new', projectIds: ['project-1'] },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(snackbar()).toHaveTextContent('Client created'));
  });

  it('updates an existing client in place and reports it updated', async () => {
    const onDone = vi.fn();
    const { result } = renderHookWithProviders(() => useClientSave(client(), onDone));
    await act(() => result.current(clientValues({ projectIds: [] })));

    expect(api.update).toHaveBeenCalledWith({
      variables: { id: 'client-1', input: expect.objectContaining({ company: 'Acme' }) },
    });
    expect(api.create).not.toHaveBeenCalled();
    expect(api.setProjects).toHaveBeenCalledWith({
      variables: { clientId: 'client-1', projectIds: [] },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(snackbar()).toHaveTextContent('Client updated'));
  });

  it('reports a failed save and links nothing', async () => {
    api.create.mockRejectedValue(new Error('Email already used'));
    const onDone = vi.fn();
    const { result } = renderHookWithProviders(() => useClientSave(null, onDone));
    await act(() => result.current(clientValues()));

    expect(api.setProjects).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    await waitFor(() => expect(snackbar()).toHaveTextContent('Email already used'));
  });

  it('treats a create that returns no client as a failed save', async () => {
    api.create.mockResolvedValue({ data: null });
    const onDone = vi.fn();
    const { result } = renderHookWithProviders(() => useClientSave(null, onDone));
    await act(() => result.current(clientValues()));

    expect(api.setProjects).not.toHaveBeenCalled();
    expect(onDone).not.toHaveBeenCalled();
    await waitFor(() => expect(snackbar()).toHaveTextContent('Save failed'));
  });

  it('keeps the form open when the projects fail, and updates the new client on the retry', async () => {
    api.setProjects.mockRejectedValueOnce(new Error('Project is archived'));
    const onDone = vi.fn();
    const { result } = renderHookWithProviders(() => useClientSave(null, onDone));

    await act(() => result.current(clientValues({ projectIds: ['project-1'] })));
    expect(onDone).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(snackbar()).toHaveTextContent(
        'The client was saved, but its projects could not be linked: Project is archived',
      ),
    );

    await act(() => result.current(clientValues({ projectIds: ['project-1'] })));
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(api.update).toHaveBeenCalledWith({
      variables: { id: 'client-new', input: expect.any(Object) },
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('names a generic reason when the project failure carries none', async () => {
    api.setProjects.mockRejectedValue('offline');
    const { result } = renderHookWithProviders(() => useClientSave(client(), vi.fn()));
    await act(() => result.current(clientValues()));

    await waitFor(() =>
      expect(snackbar()).toHaveTextContent(
        'The client was saved, but its projects could not be linked: Could not change the project',
      ),
    );
  });
});
