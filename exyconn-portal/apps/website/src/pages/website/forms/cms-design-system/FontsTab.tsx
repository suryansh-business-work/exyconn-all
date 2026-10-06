import { useState } from 'react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useT } from '@exyconn/i18n';
import { Button, Divider, Flex, Text } from '@exyconn/shell/components/ui';
import { fontFaceCss, googleSourcesUrl } from '../../../cms/design-system/font-sources';
import { useDocumentFonts } from '../../../cms/design-system/useDocumentFonts';
import { GoogleFontForm } from '../cms-google-font';
import { CustomFontForm } from '../cms-custom-font';
import type { DesignSystemFormValues } from './cms-design-system.types';
import { FontSourcesList } from './FontSourcesList';
import { FontRolesFields } from './FontRolesFields';
import { FontPreview } from './FontPreview';

type Dialog = 'google' | 'custom' | null;

/**
 * The site's type: the families it loads (Google Fonts or uploads), which family each role
 * uses, and a preview — all loaded into this page so they are seen in their own faces.
 */
export function FontsTab({ siteId }: Readonly<{ siteId: string }>) {
  const t = useT();
  const { control } = useFormContext<DesignSystemFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'fontSources' });
  const sources = useWatch({ control, name: 'fontSources' });
  const roles = useWatch({ control, name: 'fonts' });
  const [dialog, setDialog] = useState<Dialog>(null);
  useDocumentFonts(googleSourcesUrl(sources), fontFaceCss(sources));
  const families = sources.map((source) => source.family);

  return (
    <Flex direction="column" gap={2}>
      <Text weight="semibold">{t('Loaded families')}</Text>
      <FontSourcesList sources={fields} onRemove={remove} />
      <Flex gap={1} sx={{ flexWrap: 'wrap' }}>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialog('google')}>
          {t('Add Google font')}
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadFileIcon />}
          onClick={() => setDialog('custom')}
        >
          {t('Upload custom font')}
        </Button>
      </Flex>
      <Divider />
      <Text weight="semibold">{t('Roles')}</Text>
      <Text size="sm" color="text.secondary">
        {t(
          'Each role becomes --font-family-<role> on the site (sans for body text, display for headings, mono for code).',
        )}
      </Text>
      <FontRolesFields families={families} />
      <FontPreview roles={roles} />
      <GoogleFontForm
        open={dialog === 'google'}
        loaded={families}
        onClose={() => setDialog(null)}
        onAdd={append}
      />
      <CustomFontForm
        open={dialog === 'custom'}
        siteId={siteId}
        onClose={() => setDialog(null)}
        onAdd={append}
      />
    </Flex>
  );
}
