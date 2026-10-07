import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { MockLink } from '@apollo/client/testing';
import { AiAssistButton, type AiAssistTask } from '@/components/ai';
import {
  AiDraftDocument,
  AiDraftKind,
  AiSummariseDocument,
  SummaryStyle,
} from '@/graphql/generated';
import { renderWithProviders } from '../../test-utils';

const NOTES = '  Met with Acme about renewal.  ';
const SOURCE = NOTES.trim();

function renderButton(
  task: AiAssistTask,
  mocks: ReadonlyArray<MockLink.MockedResponse>,
  props: { text?: string; label?: string; disabled?: boolean } = {},
) {
  const onResult = vi.fn();
  renderWithProviders(
    <AiAssistButton
      task={task}
      text={props.text ?? NOTES}
      onResult={onResult}
      label={props.label}
      disabled={props.disabled}
    />,
    { mocks },
  );
  return onResult;
}

const summarise = (
  result: MockLink.MockedResponse['result'],
  style?: SummaryStyle,
): MockLink.MockedResponse => ({
  request: { query: AiSummariseDocument, variables: { text: SOURCE, style } },
  result,
  delay: 150,
});

describe('AiAssistButton', () => {
  it('cannot be pressed without text or while disabled', () => {
    renderButton({ action: 'SUMMARISE' }, [], { text: '   ' });
    renderButton({ action: 'SUMMARISE' }, [], { disabled: true, label: 'Summarise notes' });

    expect(screen.getByRole('button', { name: 'AI assist' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Summarise notes' })).toBeDisabled();
  });

  it('summarises the trimmed text and hands the accepted answer back', async () => {
    const user = userEvent.setup();
    const onResult = renderButton({ action: 'SUMMARISE', style: SummaryStyle.Brief }, [
      summarise({ data: { aiSummarise: 'Renewal discussed.' } }, SummaryStyle.Brief),
    ]);

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    const dialog = screen.getByRole('dialog', { name: 'Summarise with AI' });
    expect(within(dialog).getByText(SOURCE)).toBeInTheDocument();
    expect(within(dialog).getByText(/counts against the/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Use this' })).toBeDisabled();

    await user.click(within(dialog).getByRole('button', { name: 'Run' }));
    expect(await within(dialog).findByText('Asking the model…')).toBeInTheDocument();
    expect(await within(dialog).findByText('Renewal discussed.')).toBeInTheDocument();
    expect(within(dialog).queryByText(/counts against the/)).not.toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Try again' })).toBeEnabled();

    await user.click(within(dialog).getByRole('button', { name: 'Use this' }));
    expect(onResult).toHaveBeenCalledWith('Renewal discussed.');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('drafts from the text as context for the chosen kind', async () => {
    const user = userEvent.setup();
    const onResult = renderButton({ action: 'DRAFT', kind: AiDraftKind.EmailReply }, [
      {
        request: {
          query: AiDraftDocument,
          variables: { kind: AiDraftKind.EmailReply, context: SOURCE },
        },
        result: { data: { aiDraft: 'Dear Acme,' } },
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    const dialog = screen.getByRole('dialog', { name: 'Draft with AI' });
    await user.click(within(dialog).getByRole('button', { name: 'Run' }));
    const useThis = within(dialog).getByRole('button', { name: 'Use this' });
    await waitFor(() => expect(useThis).toBeEnabled());
    await user.click(useThis);

    expect(onResult).toHaveBeenCalledWith('Dear Acme,');
  });

  it('treats an empty answer as no result', async () => {
    const user = userEvent.setup();
    renderButton({ action: 'DRAFT', kind: AiDraftKind.MeetingNotes }, [
      {
        request: {
          query: AiDraftDocument,
          variables: { kind: AiDraftKind.MeetingNotes, context: SOURCE },
        },
        result: { data: { aiDraft: null } },
      },
    ]);
    renderButton({ action: 'SUMMARISE' }, [summarise({ data: { aiSummarise: null } })], {
      label: 'Sum',
    });

    for (const label of ['AI assist', 'Sum']) {
      await user.click(screen.getByRole('button', { name: label }));
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: 'Run' }));
      await waitFor(() =>
        expect(within(dialog).getByRole('button', { name: 'Run' })).toBeEnabled(),
      );
      expect(within(dialog).getByRole('button', { name: 'Use this' })).toBeDisabled();
      await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    }
  });

  it('tells the user why a failed request failed', async () => {
    const user = userEvent.setup();
    renderButton({ action: 'SUMMARISE' }, [
      {
        request: { query: AiSummariseDocument, variables: { text: SOURCE } },
        error: new Error('AI budget exhausted'),
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Run' }));

    expect(await screen.findByText('AI budget exhausted')).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: 'Use this' }),
    ).toBeDisabled();
  });

  it('forgets the previous answer when the dialog is cancelled', async () => {
    const user = userEvent.setup();
    renderButton({ action: 'SUMMARISE' }, [summarise({ data: { aiSummarise: 'Short.' } })]);

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Run' }));
    expect(await screen.findByText('Short.')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: 'AI assist' }));
    expect(within(screen.getByRole('dialog')).queryByText('Short.')).not.toBeInTheDocument();
  });
});
