import { useT } from '@exyconn/i18n';
import { Box } from '@exyconn/shell/components/ui';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useWaPalette } from '../../../theme/useWa';
import { WA_LINE, WA_RADIUS, WA_SHADOW, WA_SIZE, WA_SPACE } from '../../../theme/wa.tokens';
import { useChatActions } from '../ChatActions';
import { ActionRows } from './ActionRows';
import { Bubble } from './Bubble';
import { MessageText } from './MessageText';
import { ProductCard } from './ProductCard';
import type { ContentProps } from './types';

const CART_ICON = <ShoppingCartIcon fontSize="small" />;

export function ProductMessage({ content, frame }: ContentProps<'product'>) {
  const { choose } = useChatActions();
  const { option, product } = content;
  return (
    <Box sx={{ width: WA_SIZE.card, maxWidth: '100%' }}>
      <Bubble mine={false} tail={frame.tail} time={frame.time} flush>
        <ProductCard product={product} />
      </Bubble>
      {option ? (
        <ActionRows
          mine={false}
          items={[
            {
              id: option.id,
              label: option.title,
              icon: CART_ICON,
              onClick: () => choose(option, product.title),
            },
          ]}
        />
      ) : null}
    </Box>
  );
}

/** Cards side by side that scroll sideways, each with its own button. */
export function CarouselMessage({ content, frame }: ContentProps<'carousel'>) {
  const t = useT();
  const c = useWaPalette();
  const { choose } = useChatActions();
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      {content.text ? (
        <Box sx={{ display: 'inline-block', maxWidth: WA_SIZE.card }}>
          <Bubble mine={false} tail={frame.tail} time={frame.time}>
            <MessageText text={content.text} />
          </Bubble>
        </Box>
      ) : null}
      <Box
        role="region"
        aria-label={t('Product carousel')}
        tabIndex={0}
        sx={{
          display: 'flex',
          gap: WA_SPACE.sm,
          overflowX: 'auto',
          py: WA_SPACE.xs,
          scrollSnapType: 'x mandatory',
          '&:focus-visible': { outline: `${WA_LINE.focus} solid ${c.link}` },
        }}
      >
        {content.cards.map(({ product, option }) => (
          <Box
            key={product.id}
            sx={{ flex: `0 0 ${WA_SIZE.carouselCard}`, scrollSnapAlign: 'start' }}
          >
            <Box
              sx={{
                bgcolor: c.bubbleIn,
                borderRadius: WA_RADIUS.bubble,
                boxShadow: WA_SHADOW.bubble,
                p: WA_SPACE.hair,
                pb: WA_SPACE.sm,
              }}
            >
              <ProductCard product={product} />
            </Box>
            {option ? (
              <ActionRows
                mine={false}
                items={[
                  {
                    id: option.id,
                    label: option.title,
                    icon: CART_ICON,
                    onClick: () => choose(option, product.title),
                  },
                ]}
              />
            ) : null}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
