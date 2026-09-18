import { useT } from '@exyconn/i18n';
import {
  Flex,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Text,
} from '@exyconn/shell/components/ui';
import { RhfImageField } from '@exyconn/shell/components/form/rhf';
import type { BrandingFormValues } from './branding.types';

const UPLOAD_FOLDER = 'branding';

type ImageFieldName = keyof BrandingFormValues & `${string}Url`;

interface ImageRow {
  label: string;
  helperText: string;
  light: ImageFieldName;
  dark: ImageFieldName;
  /** `all` adds the Pexels video tab to the picker. */
  media: 'image' | 'all';
}

/**
 * Each branding image with its light- and dark-mode field. An empty dark variant falls
 * back to the light one. The hero pair are Pexels URLs rather than uploads — re-hosting
 * somebody else's stock footage would cost bandwidth to no end.
 */
const IMAGE_ROWS: ImageRow[] = [
  {
    label: 'Logo',
    helperText: 'Primary logo shown in the app chrome.',
    light: 'logoUrl',
    dark: 'logoDarkUrl',
    media: 'image',
  },
  {
    label: 'Favicon',
    helperText: 'Square, 32×32 or larger.',
    light: 'faviconUrl',
    dark: 'faviconDarkUrl',
    media: 'image',
  },
  {
    label: 'App icon',
    helperText: 'Square, 512×512 for stores.',
    light: 'appIconUrl',
    dark: 'appIconDarkUrl',
    media: 'image',
  },
  {
    label: 'Email logo',
    helperText: 'Shown at the top of emails.',
    light: 'emailLogoUrl',
    dark: 'emailLogoDarkUrl',
    media: 'image',
  },
  {
    label: 'Social share image',
    helperText: '1200×630 for link previews.',
    light: 'ogImageUrl',
    dark: 'ogImageDarkUrl',
    media: 'image',
  },
  {
    label: 'Home hero video',
    helperText: 'A short, quiet clip. Pexels videos are in the picker.',
    light: 'heroVideoUrl',
    dark: 'heroVideoDarkUrl',
    media: 'all',
  },
  {
    label: 'Home hero still',
    helperText: 'Shown until the clip plays, and to anyone who asked for less motion.',
    light: 'heroPosterUrl',
    dark: 'heroPosterDarkUrl',
    media: 'image',
  },
];

/** Keeps each image cell wide enough for its preview; the container scrolls on phones. */
const IMAGE_CELL_SX = { minWidth: 220, verticalAlign: 'top' } as const;

/** Images tab — one row per image, with its light- and dark-mode variant side by side. */
export function BrandingImagesFields() {
  const t = useT();
  return (
    <TableContainer>
      <Table aria-label={t('Branding images')}>
        <TableHead>
          <TableRow>
            <TableCell>{t('Image')}</TableCell>
            <TableCell>{t('Light mode')}</TableCell>
            <TableCell>{t('Dark mode')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {IMAGE_ROWS.map((row) => (
            <TableRow key={row.light}>
              <TableCell sx={{ minWidth: 180, verticalAlign: 'top' }}>
                <Flex direction="column" spacing={0.5}>
                  <Text size="sm" weight="medium">
                    {t(row.label)}
                  </Text>
                  <Text size="caption" color="text.secondary">
                    {t(row.helperText)}
                  </Text>
                </Flex>
              </TableCell>
              <TableCell sx={IMAGE_CELL_SX}>
                <RhfImageField
                  name={row.light}
                  label={t('{label} (light)', { label: row.label })}
                  folder={UPLOAD_FOLDER}
                  media={row.media}
                />
              </TableCell>
              <TableCell sx={IMAGE_CELL_SX}>
                <RhfImageField
                  name={row.dark}
                  label={t('{label} (dark)', { label: row.label })}
                  helperText={t('Empty uses the light image.')}
                  folder={UPLOAD_FOLDER}
                  media={row.media}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
