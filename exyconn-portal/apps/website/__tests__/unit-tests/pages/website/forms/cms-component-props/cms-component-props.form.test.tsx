import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentPropsForm } from '../../../../../../src/pages/website/forms/cms-component-props';
import { renderWithProviders } from '../../../../test-utils';
import { fillField, press } from '../content-form-helpers';

vi.mock('@exyconn/rich-text', async () => ({
  RichTextEditor: (await import('./props-editor-stubs')).RichTextEditorStub,
}));

vi.mock('../../../../../../src/pages/cms/media', async () => {
  const stubs = await import('./props-editor-stubs');
  return { MediaUrlInput: stubs.MediaUrlInputStub, useMediaUpload: stubs.useMediaUploadStub };
});

const PROPS = {
  title: 'Hello',
  count: 3,
  visible: true,
  missing: null,
  items: ['a', 'b'],
  cta: { label: 'Go' },
};

function renderForm(props: Record<string, unknown> = PROPS) {
  const onApply = vi.fn();
  const onCancel = vi.fn();
  renderWithProviders(
    <ComponentPropsForm props={props} siteId="site-1" onApply={onApply} onCancel={onCancel} />,
  );
  return { onApply, onCancel };
}

const jsonBox = () => screen.getByLabelText('Settings (JSON)');

/** Applies and returns the props handed back. */
async function apply(onApply: ReturnType<typeof vi.fn>): Promise<unknown> {
  await press('Apply');
  await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
  return onApply.mock.calls[0][0];
}

describe('ComponentPropsForm — fields view', () => {
  it('builds one field per prop from the value itself', () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'Fields' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('Title')).toHaveValue('Hello');
    expect(screen.getByLabelText('Count')).toHaveValue(3);
    expect(screen.getByLabelText('Visible')).toBeChecked();
    expect(screen.getByText('Missing: empty (edit it in the JSON view)')).toBeInTheDocument();
    expect(screen.getByText('Items (2)')).toBeInTheDocument();
    expect(screen.getByLabelText('Item 2')).toHaveValue('b');
    expect(screen.getByText('Cta')).toBeInTheDocument();
    expect(screen.getByLabelText('Label')).toHaveValue('Go');
  });

  it('applies the edited text, number, switch and nested values', async () => {
    const { onApply } = renderForm();

    await fillField('Title', 'Welcome');
    fireEvent.change(screen.getByLabelText('Count'), { target: { value: '5' } });
    await userEvent.click(screen.getByLabelText('Visible'));
    await fillField('Label', 'Start now');
    await fillField('Item 1', 'first');

    expect(await apply(onApply)).toEqual({
      ...PROPS,
      title: 'Welcome',
      count: 5,
      visible: false,
      items: ['first', 'b'],
      cta: { label: 'Start now' },
    });
  });

  it('ignores text in a number field that is not a number', async () => {
    const { onApply } = renderForm();
    const count = screen.getByLabelText('Count');
    // Browsers that let a stray letter through report it as the field's text.
    count.setAttribute('type', 'text');
    fireEvent.change(count, { target: { value: 'abc' } });

    expect(await apply(onApply)).toMatchObject({ count: 3 });
  });

  it('stays in the fields view when its own button is pressed again', async () => {
    renderForm();

    await press('Fields');

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.queryByLabelText('Settings (JSON)')).not.toBeInTheDocument();
  });

  it('cancels without applying', async () => {
    const { onApply, onCancel } = renderForm();

    await press('Cancel');

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });
});

describe('ComponentPropsForm — JSON view', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carries the field edits into the JSON', async () => {
    renderForm();
    await fillField('Title', 'Welcome');

    await press('JSON');

    expect(JSON.parse((jsonBox() as HTMLTextAreaElement).value)).toEqual({
      ...PROPS,
      title: 'Welcome',
    });
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('applies the JSON as written', async () => {
    const { onApply } = renderForm();
    await press('JSON');

    fireEvent.change(jsonBox(), { target: { value: '{ "title": "From JSON", "extra": [1] }' } });

    expect(await apply(onApply)).toEqual({ title: 'From JSON', extra: [1] });
  });

  it('refuses to apply JSON that is not an object', async () => {
    const { onApply } = renderForm();
    await press('JSON');

    fireEvent.change(jsonBox(), { target: { value: '[1, 2]' } });
    await press('Apply');

    expect(
      await screen.findByText('Enter a JSON object, like { "title": "Hello" }'),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
  });

  it('keeps the JSON view until the JSON parses', async () => {
    renderForm();
    await press('JSON');

    fireEvent.change(jsonBox(), { target: { value: '{ "title": ' } });
    await press('Fields');

    expect(
      await screen.findByText('Fix the JSON before switching to the fields view'),
    ).toBeInTheDocument();
    expect(jsonBox()).toBeInTheDocument();
  });

  it('rebuilds the fields from valid JSON', async () => {
    const { onApply } = renderForm();
    await press('JSON');

    fireEvent.change(jsonBox(), { target: { value: '{ "heading": "New", "show": false }' } });
    await press('Fields');

    expect(screen.getByLabelText('Heading')).toHaveValue('New');
    expect(screen.getByLabelText('Show')).not.toBeChecked();
    expect(await apply(onApply)).toEqual({ heading: 'New', show: false });
  });
});
