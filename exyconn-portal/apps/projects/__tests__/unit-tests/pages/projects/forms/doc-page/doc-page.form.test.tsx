import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { DocPageForm, type DocPageRow } from '../../../../../../src/pages/projects/forms/doc-page';
import { renderWithProviders } from '../../../../test-utils';
import { docPageWithBody } from '../../../../fixtures';
import { fill, press } from '../../../../helpers/form-helpers';

vi.mock('@exyconn/shell/components/form/rhf/RhfRichText', async () => ({
  RhfRichText: (await import('../../../../helpers/rich-text.stub')).RhfRichTextStub,
}));

const renderForm = (page: DocPageRow = docPageWithBody()) => {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  const view = renderWithProviders(
    <DocPageForm page={page} onSubmit={onSubmit} onCancel={onCancel} />,
  );
  return { ...view, onSubmit, onCancel };
};

describe('DocPageForm', () => {
  it('opens on the page’s title and body', () => {
    renderForm();

    expect(screen.getByLabelText('Title')).toHaveValue('Runbook');
    expect(screen.getByLabelText('Page')).toHaveValue('<p>Steps</p>');
    expect(screen.getByRole('button', { name: 'Save page' })).toBeInTheDocument();
  });

  it('will not save a page without a title', async () => {
    const { onSubmit } = renderForm();
    fill('Title', '   ');

    await press('Save page');

    expect(await screen.findByText('Title is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves the trimmed title with the body as written', async () => {
    const { onSubmit } = renderForm();
    fill('Title', '  Release runbook  ');
    fill('Page', '<p>Tag, build, ship</p>');

    await press('Save page');

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { title: 'Release runbook', body: '<p>Tag, build, ship</p>' },
        expect.anything(),
      ),
    );
  });

  it('re-seeds itself when another page is opened in the same editor', async () => {
    const { rerender, onSubmit, onCancel } = renderForm();

    rerender(
      <DocPageForm
        page={docPageWithBody({ id: 'page-2', title: 'Decisions', body: '<p>ADR</p>' })}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />,
    );

    await waitFor(() => expect(screen.getByLabelText('Title')).toHaveValue('Decisions'));
    expect(screen.getByLabelText('Page')).toHaveValue('<p>ADR</p>');
  });

  it('hands Cancel back without saving', async () => {
    const { onSubmit, onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
