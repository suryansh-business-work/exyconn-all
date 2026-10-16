import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import type { UseFormReturn } from 'react-hook-form';
import { act } from 'react';
import { RhfCodeEditor } from '@/components/form/rhf';
import { renderWithProviders } from '../../../test-utils';
import { FormHarness, formValues } from '../formHarness';

/** What the editor was last rendered with. */
const editor = vi.hoisted(() => ({ props: {} as Record<string, unknown> }));

/** Monaco needs a real browser; a textarea stands in with the same value/label/hint contract. */
vi.mock('@exyconn/code-editor', () => ({
  CodeEditor: (
    props: Readonly<{
      value: string;
      onChange: (value: string) => void;
      onBlur: () => void;
      label: string;
      helperText?: string;
      error?: string;
    }>,
  ) => {
    editor.props = props;
    return (
      <>
        <label>
          {props.label}
          <textarea
            value={props.value}
            onChange={(event) => props.onChange(event.target.value)}
            onBlur={props.onBlur}
          />
        </label>
        <span>{props.error ?? props.helperText}</span>
      </>
    );
  },
}));

const messages = {
  Template: 'Plantilla',
  'Runs on every send': 'Se ejecuta en cada envío',
  'The template is broken': 'La plantilla está rota',
};

describe('RhfCodeEditor', () => {
  it('edits the form value as code, with a translated label and hint', () => {
    renderWithProviders(
      <FormHarness defaultValues={{ body: '<p>Hi</p>' }}>
        <RhfCodeEditor
          name="body"
          label="Template"
          language="html"
          helperText="Runs on every send"
          height={300}
        />
      </FormHarness>,
      { messages },
    );
    const box = screen.getByLabelText('Plantilla');

    expect(box).toHaveValue('<p>Hi</p>');
    expect(screen.getByText('Se ejecuta en cada envío')).toBeInTheDocument();
    expect(editor.props).toMatchObject({ language: 'html', height: 300 });

    fireEvent.change(box, { target: { value: '<p>Bye</p>' } });
    expect(formValues().body).toBe('<p>Bye</p>');
  });

  it('starts empty without a value and without a hint', () => {
    renderWithProviders(
      <FormHarness defaultValues={{}}>
        <RhfCodeEditor name="body" label="Template" language="html" />
      </FormHarness>,
    );

    expect(screen.getByLabelText('Template')).toHaveValue('');
    expect(editor.props.helperText).toBeUndefined();
    expect(editor.props.error).toBeUndefined();
  });

  it('shows a field error, translated', () => {
    let form: UseFormReturn<{ body: string }> | undefined;
    renderWithProviders(
      <FormHarness<{ body: string }>
        defaultValues={{ body: '' }}
        onMethods={(methods) => {
          form = methods;
        }}
      >
        <RhfCodeEditor
          name="body"
          label="Template"
          language="html"
          helperText="Runs on every send"
        />
      </FormHarness>,
      { messages },
    );

    act(() => form?.setError('body', { message: 'The template is broken' }));

    expect(screen.getByText('La plantilla está rota')).toBeInTheDocument();
    expect(screen.queryByText('Se ejecuta en cada envío')).not.toBeInTheDocument();
  });
});
