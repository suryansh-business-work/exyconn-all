import type { RenderedOption, RenderedProduct } from '@exyconn/wa-flow';
import { useT } from '@exyconn/i18n';
import { Box, Button, Chip, Paper, Typography } from '@exyconn/shell/components/ui';
import { useWaFormat } from '../../runtime/useWaFormat';
import { useWidgetActions } from '../WidgetActions';
import { WidgetIllustration } from './WidgetIllustration';

interface ProductCardProps {
  product: RenderedProduct;
  option?: RenderedOption;
  /** Fixed width inside a carousel; full width on its own. */
  width?: number;
}

/** A product as a shop card: artwork, name, price with the struck MRP, and its button. */
export function ProductCard({ product, option, width }: Readonly<ProductCardProps>) {
  const t = useT();
  const format = useWaFormat();
  const { choose, look } = useWidgetActions();
  return (
    <Paper
      variant="outlined"
      sx={{ width, flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{ position: 'relative' }}>
        <WidgetIllustration image={product.image} height={88} />
        {product.badge && (
          <Chip
            size="small"
            label={product.badge}
            sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
          />
        )}
      </Box>
      <Box sx={{ p: 1.5, flexGrow: 1 }}>
        <Typography variant="subtitle2" component="p" sx={{ fontWeight: 700 }}>
          {product.title}
        </Typography>
        {product.subtitle && (
          <Typography variant="caption" component="p" sx={{ color: 'text.secondary' }}>
            {product.subtitle}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
          <Typography variant="subtitle1" component="p" sx={{ fontWeight: 700, color: look.text }}>
            {format.money(product.price)}
          </Typography>
          {product.mrp !== undefined && product.mrp > product.price && (
            <Typography
              variant="caption"
              component="p"
              sx={{ color: 'text.secondary', textDecoration: 'line-through' }}
              aria-label={t('Was {price}', { price: format.money(product.mrp) })}
            >
              {format.money(product.mrp)}
            </Typography>
          )}
        </Box>
      </Box>
      {option && (
        <Button
          fullWidth
          variant="contained"
          disableElevation
          onClick={() => choose(option, product.title)}
          sx={{ borderRadius: 0, bgcolor: look.fill, color: look.onFill, textTransform: 'none' }}
        >
          {option.title}
        </Button>
      )}
    </Paper>
  );
}

interface CarouselProps {
  text?: string;
  cards: readonly { product: RenderedProduct; option?: RenderedOption }[];
}

/** A row of product cards the visitor scrolls sideways, as a shop's chat would show them. */
export function ProductCarousel({ text, cards }: Readonly<CarouselProps>) {
  const t = useT();
  return (
    <Box sx={{ width: '100%' }}>
      {text && (
        <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
          {text}
        </Typography>
      )}
      <Box
        role="region"
        aria-label={t('Products')}
        tabIndex={0}
        sx={{ overflowX: 'auto', pb: 1, scrollSnapType: 'x mandatory' }}
      >
        <Box role="list" sx={{ display: 'flex', gap: 1, width: 'max-content' }}>
          {cards.map((card) => (
            <Box role="listitem" key={card.product.id} sx={{ scrollSnapAlign: 'start' }}>
              <ProductCard product={card.product} option={card.option} width={200} />
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
