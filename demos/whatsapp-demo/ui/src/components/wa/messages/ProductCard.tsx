import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import type { RenderedProduct } from '@exyconn/wa-flow';
import { useWaFormat } from '../../../hooks/useWaFormat';
import { useWaPalette } from '../../../theme/useWa';
import { WA_FONT, WA_RADIUS, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { Illustration } from './Illustration';

/** A catalogue item: picture, name, price (with the struck list price) and a badge. */
export function ProductCard({
  product,
  height,
}: Readonly<{ product: RenderedProduct; height?: string }>) {
  const t = useT();
  const c = useWaPalette();
  const { money } = useWaFormat();
  const off =
    product.mrp && product.mrp > product.price
      ? Math.round((1 - product.price / product.mrp) * 100)
      : 0;
  return (
    <Box>
      <Box sx={{ position: 'relative' }}>
        <Illustration image={product.image} height={height ?? WA_SIZE.map} />
        {product.badge ? (
          <Box
            sx={{
              position: 'absolute',
              top: WA_SPACE.sm,
              left: WA_SPACE.sm,
              px: WA_SPACE.xs,
              borderRadius: WA_RADIUS.chip,
              bgcolor: c.panel,
              color: c.text,
              fontSize: WA_FONT.meta,
              fontWeight: 600,
            }}
          >
            {product.badge}
          </Box>
        ) : null}
      </Box>
      <Box sx={{ p: `${WA_SPACE.xs} ${WA_SPACE.sm} 0` }}>
        <Box sx={{ fontWeight: 600, fontSize: WA_FONT.preview }}>{product.title}</Box>
        {product.subtitle ? (
          <Box sx={{ fontSize: WA_FONT.small, color: c.textMuted }}>{product.subtitle}</Box>
        ) : null}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'baseline',
            gap: WA_SPACE.xs,
            flexWrap: 'wrap',
            mt: WA_SPACE.hair,
          }}
        >
          <Box component="span" sx={{ fontWeight: 700 }}>
            {money(product.price)}
          </Box>
          {off > 0 && product.mrp ? (
            <>
              <Box
                component="span"
                sx={{ textDecoration: 'line-through', color: c.textMuted, fontSize: WA_FONT.small }}
              >
                {money(product.mrp)}
              </Box>
              <Box
                component="span"
                sx={{ color: c.brand, fontSize: WA_FONT.small, fontWeight: 600 }}
              >
                {t('{percent}% off', { percent: off })}
              </Box>
            </>
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}
