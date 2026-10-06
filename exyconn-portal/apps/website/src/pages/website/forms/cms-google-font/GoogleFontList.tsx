import { useMemo } from 'react';
import { useT } from '@exyconn/i18n';
import {
  Alert,
  Box,
  Button,
  LinearProgress,
  List,
  ListItemButton,
  ListItemText,
} from '@exyconn/shell/components/ui';
import { googleFontsUrl } from '../../../cms/design-system/font-sources';
import { useDocumentFonts } from '../../../cms/design-system/useDocumentFonts';
import { listVariant, type GoogleFontRow } from './cms-google-font.types';
import type { useGoogleFontCatalogue } from './useGoogleFontCatalogue';

interface GoogleFontListProps {
  catalogue: ReturnType<typeof useGoogleFontCatalogue>;
  selected: string;
  onSelect: (row: GoogleFontRow) => void;
}

/**
 * The families found, each name drawn in its own face. Only the listed rows are loaded, and
 * only the letters of their names (css2 `text=`), so scrolling the catalogue stays light.
 */
export function GoogleFontList({ catalogue, selected, onSelect }: Readonly<GoogleFontListProps>) {
  const t = useT();
  const { rows } = catalogue;
  const url = useMemo(() => {
    const letters = [...new Set(rows.map((row) => row.family).join(''))].join('');
    return googleFontsUrl(
      rows.map((row) => ({ family: row.family, variants: [listVariant(row)] })),
      letters,
    );
  }, [rows]);
  useDocumentFonts(url);

  return (
    <Box
      sx={{ height: 420, overflowY: 'auto', border: 1, borderColor: 'divider', borderRadius: 1 }}
      tabIndex={0}
      role="region"
      aria-label={t('Google Fonts families')}
    >
      {catalogue.loading && <LinearProgress aria-label={t('Loading fonts')} />}
      {catalogue.error && <Alert severity="error">{catalogue.error.message}</Alert>}
      <List dense disablePadding>
        {rows.map((row) => (
          <ListItemButton
            key={row.family}
            selected={row.family === selected}
            onClick={() => onSelect(row)}
          >
            <ListItemText
              primary={row.family}
              secondary={t('{category} · {count} styles', {
                category: row.category,
                count: row.variants.length,
              })}
              slotProps={{
                primary: { sx: { fontFamily: `"${row.family}", sans-serif`, fontSize: 20 } },
              }}
            />
          </ListItemButton>
        ))}
      </List>
      {catalogue.hasMore && (
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button size="small" onClick={catalogue.showMore} disabled={catalogue.loading}>
            {t('Show more ({shown} of {total})', {
              shown: rows.length,
              total: catalogue.totalCount,
            })}
          </Button>
        </Box>
      )}
    </Box>
  );
}
