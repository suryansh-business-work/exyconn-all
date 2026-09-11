import { useFormContext, useWatch } from 'react-hook-form';
import { RhfRichText } from '@exyconn/shell/components/form/rhf';
import { LiveDesignNotice } from './LiveDesignNotice';

interface ArticleBodyFieldProps {
  /** ImageKit folder for images added in the rich-text editor. */
  folder: string;
}

/**
 * The `content` field of an article form. A body written as rich text is edited here;
 * a body designed in the live editor (it has `contentCss`) is not — the rich-text
 * schema cannot hold its layout and would silently drop it — so the form offers the
 * choice instead.
 */
export function ArticleBodyField({ folder }: Readonly<ArticleBodyFieldProps>) {
  const { control } = useFormContext();
  const contentCss: string = useWatch({ control, name: 'contentCss' }) ?? '';

  if (contentCss) {
    return <LiveDesignNotice />;
  }
  return (
    <RhfRichText
      name="content"
      label="Content"
      folder={folder}
      placeholder="Write the article…"
      minHeight={320}
      helperText="Shown on the public page. For layouts and styling, use Live edit from the list."
    />
  );
}
