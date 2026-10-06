import { useT } from '@exyconn/i18n';
import { RichTextEditor } from '@exyconn/rich-text';
import { TextField } from '@exyconn/shell/components/ui';
import { MediaUrlInput, useMediaUpload } from '../../../cms/media';
import { stringEditor } from './props-tree';

interface PropStringFieldProps {
  name: string;
  label: string;
  value: string;
  siteId: string;
  onChange: (value: string) => void;
}

/** A string prop: rich text for `*Html`, the media picker for images, else a text field. */
export function PropStringField({
  name,
  label,
  value,
  siteId,
  onChange,
}: Readonly<PropStringFieldProps>) {
  const t = useT();
  const uploadImage = useMediaUpload(siteId);
  const editor = stringEditor(name, value);

  if (editor === 'rich') {
    return (
      <RichTextEditor
        label={label}
        value={value}
        onChange={onChange}
        uploadImage={uploadImage}
        minHeight={140}
      />
    );
  }
  if (editor === 'media') {
    return <MediaUrlInput label={label} value={value} onChange={onChange} siteId={siteId} />;
  }
  return (
    <TextField
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      multiline={editor === 'multiline'}
      minRows={editor === 'multiline' ? 3 : undefined}
      fullWidth
      placeholder={t('Empty')}
    />
  );
}
