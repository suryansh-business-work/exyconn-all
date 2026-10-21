import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodePane } from '../../../../../../../src/pages/marketing/forms/campaign/design/CodePane';
import { renderWithProviders } from '../../../../../test-utils';
import { StudioFormHarness, type StudioForm } from '../form-harness';
import { VARIABLES, preview } from '../studio.fixtures';
import { editorApi } from '../code-editor-stub';

vi.mock('@exyconn/code-editor', () => import('../code-editor-stub'));

function renderPane(issues = preview().issues) {
  let form: StudioForm | undefined;
  renderWithProviders(
    <StudioFormHarness
      values={{ mjml: '<mjml></mjml>' }}
      onForm={(value) => {
        form = value;
      }}
    >
      <CodePane variables={VARIABLES} preview={preview({ issues })} />
    </StudioFormHarness>,
  );
  return () => form as StudioForm;
}

describe('CodePane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('edits the MJML of the form', () => {
    const form = renderPane();
    const editor = screen.getByLabelText('MJML source');
    expect(editor).toHaveValue('<mjml></mjml>');
    fireEvent.change(editor, { target: { value: '<mjml><mj-body/></mjml>' } });
    expect(form().getValues('mjml')).toBe('<mjml><mj-body/></mjml>');
  });

  it('marks the server’s compile errors on their lines', () => {
    renderPane([
      { line: 2, message: 'Unclosed mj-section' },
      { line: 9, message: 'Unknown tag' },
    ]);
    expect(screen.getByLabelText('MJML source problems')).toHaveTextContent(
      'error 2:1 Unclosed mj-sectionerror 9:1 Unknown tag',
    );
  });

  it('has no problems without a preview', () => {
    renderWithProviders(
      <StudioFormHarness>
        <CodePane variables={VARIABLES} preview={null} />
      </StudioFormHarness>,
    );
    expect(screen.getByLabelText('MJML source problems')).toBeEmptyDOMElement();
  });

  it('shows the validation error once the code is emptied and left', async () => {
    const form = renderPane();
    const editor = screen.getByLabelText('MJML source');
    fireEvent.change(editor, { target: { value: '' } });
    fireEvent.blur(editor);
    await act(() => form().trigger('mjml'));
    expect(screen.getByText('The email has no content yet')).toBeInTheDocument();
  });

  it('inserts a picked variable at the editor’s cursor', async () => {
    renderPane();
    await userEvent.click(screen.getByRole('combobox', { name: 'Insert variable' }));
    await userEvent.click(screen.getByRole('option', { name: /Unsubscribe link/ }));
    expect(editorApi.insertAtCursor).toHaveBeenCalledWith('{{unsubscribe_url}}');
  });
});
