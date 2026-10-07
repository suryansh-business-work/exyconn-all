import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropStringField } from '../../../../../../src/pages/website/forms/cms-component-props/PropStringField';
import { renderWithProviders } from '../../../../test-utils';
import { press } from '../content-form-helpers';
import { mediaUpload } from './props-editor-stubs';

vi.mock('@exyconn/rich-text', async () => ({
  RichTextEditor: (await import('./props-editor-stubs')).RichTextEditorStub,
}));

vi.mock('../../../../../../src/pages/cms/media', async () => {
  const stubs = await import('./props-editor-stubs');
  return { MediaUrlInput: stubs.MediaUrlInputStub, useMediaUpload: stubs.useMediaUploadStub };
});

function renderField(name: string, value: string) {
  const onChange = vi.fn();
  renderWithProviders(
    <PropStringField name={name} label="Field" value={value} siteId="site-7" onChange={onChange} />,
  );
  return onChange;
}

describe('PropStringField', () => {
  beforeEach(() => {
    mediaUpload.siteIds.length = 0;
  });

  it('edits an html prop in the rich-text editor, uploading images to the site', async () => {
    const onChange = renderField('introHtml', '<p>Hi</p>');

    await press('Rich Field with uploads: <p>Hi</p>');

    expect(onChange).toHaveBeenCalledWith('<p>Rewritten</p>');
    expect(mediaUpload.siteIds).toContain('site-7');
  });

  it('edits an image prop with the site’s media picker', async () => {
    const onChange = renderField('heroImage', '/media/old.png');

    await press('Media Field on site-7: /media/old.png');

    expect(onChange).toHaveBeenCalledWith('/media/picked.png');
  });

  it('edits short text in a one-line field with an empty hint', async () => {
    const onChange = renderField('heading', '');
    const field = screen.getByLabelText('Field');

    expect(field.tagName).toBe('INPUT');
    expect(field).toHaveAttribute('placeholder', 'Empty');
    await userEvent.type(field, 'A');

    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('edits long or multi-line text in a text area', () => {
    renderField('body', 'First line\nSecond line');

    const field = screen.getByLabelText('Field');
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue('First line\nSecond line');
  });
});
