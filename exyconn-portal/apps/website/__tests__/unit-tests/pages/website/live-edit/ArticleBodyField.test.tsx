import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { FormProvider, useForm, useFormState } from 'react-hook-form';
import { ArticleBodyField } from '../../../../../src/pages/website/live-edit';
import { renderWithProviders } from '../../../test-utils';

const dialog = vi.hoisted(() => ({ failure: null as unknown }));

vi.mock('@exyconn/shell/components/form/rhf', async () => {
  const stub = await import('./rich-text-stub');
  return { RhfRichText: stub.RhfRichTextStub };
});

vi.mock('@exyconn/shell/components/feedback/ConfirmProvider', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@exyconn/shell/components/feedback/ConfirmProvider')>();
  return {
    ...actual,
    useConfirm: () => {
      const confirm = actual.useConfirm();
      return dialog.failure === null ? confirm : () => Promise.reject(dialog.failure);
    },
  };
});

interface ArticleValues {
  content: string;
  contentCss?: string;
}

function DirtyFlag() {
  const { isDirty } = useFormState();
  return <output aria-label="form dirty">{String(isDirty)}</output>;
}

function ArticleForm({ values }: Readonly<{ values: ArticleValues }>) {
  const form = useForm<ArticleValues>({ defaultValues: values });
  return (
    <FormProvider {...form}>
      <ArticleBodyField folder="website/blog" />
      <DirtyFlag />
    </FormProvider>
  );
}

const DESIGNED = { content: '<div class="cols">Hi</div>', contentCss: '.cols{display:flex}' };

beforeEach(() => {
  dialog.failure = null;
});

describe('ArticleBodyField', () => {
  it('edits a plain body as rich text in the record’s media folder', () => {
    renderWithProviders(<ArticleForm values={{ content: '<p>Hi</p>', contentCss: '' }} />);
    const editor = screen.getByRole('region', { name: 'Content' });
    expect(editor).toHaveTextContent('field: content');
    expect(editor).toHaveTextContent('folder: website/blog');
    expect(editor).toHaveTextContent('placeholder: Write the article…');
    expect(editor).toHaveTextContent('min height: 320');
    expect(editor).toHaveTextContent(
      'Shown on the public page. For layouts and styling, use Live edit from the list.',
    );
    expect(screen.queryByText('Designed in the live editor')).not.toBeInTheDocument();
  });

  it('treats a form with no CSS field as a plain body', () => {
    renderWithProviders(<ArticleForm values={{ content: '<p>Hi</p>' }} />);
    expect(screen.getByRole('region', { name: 'Content' })).toBeInTheDocument();
  });

  it('protects a body designed in the live editor instead of editing it', () => {
    renderWithProviders(<ArticleForm values={DESIGNED} />);
    expect(screen.queryByRole('region', { name: 'Content' })).not.toBeInTheDocument();
    expect(screen.getByText('Designed in the live editor')).toBeInTheDocument();
    expect(
      screen.getByText(
        'This body has a custom layout. Change it with the Live edit action in the list, so the design is kept.',
      ),
    ).toBeInTheDocument();
  });
});

describe('LiveDesignNotice', () => {
  it('drops the design and offers rich text once the user agrees', async () => {
    renderWithProviders(<ArticleForm values={DESIGNED} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit as rich text' }));

    expect(await screen.findByText('Edit as rich text?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The live-editor design — columns, colours, spacing, callouts — will be removed. The text is kept.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove design' }));

    expect(await screen.findByRole('region', { name: 'Content' })).toBeInTheDocument();
    expect(screen.getByLabelText('form dirty')).toHaveTextContent('true');
  });

  it('keeps the design when the user cancels', async () => {
    renderWithProviders(<ArticleForm values={DESIGNED} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit as rich text' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(await screen.findByText('Designed in the live editor')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Content' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('form dirty')).toHaveTextContent('false');
  });

  it('reports a confirm dialog that fails with its own message', async () => {
    dialog.failure = new Error('Dialog unavailable');
    renderWithProviders(<ArticleForm values={DESIGNED} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit as rich text' }));

    expect(await screen.findByText('Dialog unavailable')).toBeInTheDocument();
    expect(screen.getByText('Designed in the live editor')).toBeInTheDocument();
  });

  it('falls back to a plain message when the failure carries none', async () => {
    dialog.failure = 'gone';
    renderWithProviders(<ArticleForm values={DESIGNED} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit as rich text' }));

    expect(await screen.findByText('Could not switch editors')).toBeInTheDocument();
  });
});
