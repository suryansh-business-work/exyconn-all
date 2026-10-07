import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequestType, useCreateMyRequestMutation } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../../../test-utils';
import { mutationTuple } from '../../apolloHookMocks';
import { RaiseRequestForm } from '../../../../../../src/pages/employee/forms/raise-request';

vi.mock('@exyconn/shell/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/shell/graphql/generated')>()),
  useCreateMyRequestMutation: vi.fn(),
}));

const createMyRequest = vi.fn();

function setup() {
  const onCancel = vi.fn();
  const onDone = vi.fn();
  renderWithProviders(<RaiseRequestForm onCancel={onCancel} onDone={onDone} />);
  return { onCancel, onDone };
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Submit' }));

async function fillValid() {
  await userEvent.type(screen.getByLabelText('Subject'), ' Work from home Friday ');
  await userEvent.type(screen.getByLabelText('Details'), 'Plumber visiting between 10 and 2.');
}

beforeEach(() => {
  createMyRequest.mockReset();
  vi.mocked(useCreateMyRequestMutation).mockReturnValue(
    mutationTuple<typeof useCreateMyRequestMutation>(createMyRequest),
  );
});

describe('RaiseRequestForm', () => {
  it('requires a subject and enough detail for HR to act on', async () => {
    setup();
    await submit();

    expect(await screen.findByText('Subject is required')).toBeInTheDocument();
    expect(
      screen.getByText('Give HR enough detail to act on (10+ characters)'),
    ).toBeInTheDocument();
    expect(createMyRequest).not.toHaveBeenCalled();
  });

  it('keeps the subject under 120 characters', async () => {
    setup();
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 's'.repeat(121) } });
    await submit();

    expect(await screen.findByText('Keep it under 120 characters')).toBeInTheDocument();
  });

  it('raises a work-from-home request by default and resets after', async () => {
    createMyRequest.mockResolvedValue({ data: { createMyRequest: { id: 'req-1' } } });
    const { onDone } = setup();
    expect(screen.getByRole('combobox', { name: /Request type/ })).toHaveTextContent('Wfh');
    await fillValid();
    await submit();

    await waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(createMyRequest).toHaveBeenCalledWith({
      variables: {
        input: {
          type: RequestType.Wfh,
          subject: 'Work from home Friday',
          details: 'Plumber visiting between 10 and 2.',
        },
      },
    });
    expect(await screen.findByText('Request submitted — pending approval')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toHaveValue('');
  });

  it('raises the request type the employee picks', async () => {
    createMyRequest.mockResolvedValue({ data: { createMyRequest: { id: 'req-2' } } });
    setup();
    await userEvent.click(screen.getByRole('combobox', { name: /Request type/ }));
    await userEvent.click(
      within(screen.getByRole('listbox')).getByRole('option', { name: 'Travel' }),
    );
    await fillValid();
    await submit();

    await waitFor(() => expect(createMyRequest).toHaveBeenCalledTimes(1));
    expect(createMyRequest.mock.calls[0][0].variables.input.type).toBe(RequestType.Travel);
  });

  it('shows the server’s message when raising fails', async () => {
    createMyRequest.mockRejectedValue(new Error('You already have a pending WFH request'));
    const { onDone } = setup();
    await fillValid();
    await submit();

    expect(await screen.findByText('You already have a pending WFH request')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-Error failure', async () => {
    createMyRequest.mockRejectedValue(undefined);
    setup();
    await fillValid();
    await submit();

    expect(await screen.findByText('Could not submit the request')).toBeInTheDocument();
  });

  it('cancels without raising', async () => {
    const { onCancel } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
