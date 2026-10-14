import { useT } from '@exyconn/i18n';
import { Box, ButtonBase } from '@exyconn/shell/components/ui';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { RenderedOption } from '@exyconn/wa-flow';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_SPACE } from '../../../theme/wa.tokens';

interface ListSheetRowsProps {
  sections: { id: string; title: string; rows: RenderedOption[] }[];
  picked?: string;
  onPick: (row: RenderedOption) => void;
}

/** The sections and radio rows of a list message. */
export function ListSheetRows({ sections, picked, onPick }: Readonly<ListSheetRowsProps>) {
  const c = useWaPalette();
  const t = useT();
  return (
    <Box role="radiogroup" aria-label={t('Options')} sx={{ overflowY: 'auto', flex: 1 }}>
      {sections.map((section) => (
        <Box key={section.id} component="section" aria-label={section.title}>
          <Box
            sx={{
              px: WA_SPACE.xl,
              pt: WA_SPACE.lg,
              pb: WA_SPACE.xs,
              color: c.brand,
              fontSize: WA_FONT.small,
              fontWeight: 600,
            }}
          >
            {section.title}
          </Box>
          {section.rows.map((row) => {
            const checked = row.id === picked;
            const Mark = checked ? RadioButtonCheckedIcon : RadioButtonUncheckedIcon;
            return (
              <ButtonBase
                key={row.id}
                role="radio"
                aria-checked={checked}
                onClick={() => onPick(row)}
                sx={{
                  width: '100%',
                  justifyContent: 'space-between',
                  textAlign: 'left',
                  gap: WA_SPACE.md,
                  px: WA_SPACE.xl,
                  py: WA_SPACE.md,
                  fontFamily: 'inherit',
                  '&:hover, &:focus-visible': { bgcolor: c.rowHover },
                }}
              >
                <Box>
                  <Box sx={{ fontSize: WA_FONT.preview, color: c.text }}>{row.title}</Box>
                  {row.description ? (
                    <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted, mt: WA_SPACE.hair }}>
                      {row.description}
                    </Box>
                  ) : null}
                </Box>
                <Mark sx={{ color: checked ? c.brand : c.textMuted }} />
              </ButtonBase>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
