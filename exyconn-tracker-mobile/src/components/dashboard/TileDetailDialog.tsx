import { Modal } from 'react-native';
import { Separator, XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import type { Tile, TileFact } from '../../lib/dashboard/tile.types';
import { useBrand } from '../../theme/BrandProvider';
import { SCRIM } from '../../theme/palette';
import { AppButton } from '../ui/AppButton';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Body, Heading, Title } from '../ui/Typography';

interface Props {
  tile: Tile | null;
  onClose: () => void;
}

/** One "label … value" line of the detail. */
function FactRow({ fact }: Readonly<{ fact: TileFact }>) {
  const t = useT();
  return (
    <XStack justifyContent="space-between" gap="$3">
      <Body color="$muted" flexShrink={1}>
        {t(fact.label)}
      </Body>
      <Body fontWeight="600" textAlign="right" flexShrink={1}>
        {fact.value}
      </Body>
    </XStack>
  );
}

/**
 * What one dashboard number actually means.
 *
 * A figure on a monitoring dashboard is half a fact on its own: the other half is the rule
 * that produced it. Every tile here says both — the unabbreviated number, the figures around
 * it, and the rule or the privacy promise behind it — so nothing on this screen has to be
 * taken on trust.
 */
export function TileDetailDialog({ tile, onClose }: Readonly<Props>) {
  const t = useT();
  const brand = useBrand();
  if (tile === null) {
    return null;
  }
  const label = t(tile.label);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <YStack flex={1} justifyContent="center" padding="$5" backgroundColor={SCRIM}>
        <Surface
          padding="$5"
          gap="$3"
          accessibilityViewIsModal
          accessibilityLabel={t('{label} detail', { label })}
        >
          <XStack gap="$2" alignItems="center">
            <Icon name={tile.icon} size={20} color={brand.primary} />
            <Heading flex={1}>{label}</Heading>
            <AppButton label={t('Close')} tone="text" onPress={onClose} />
          </XStack>
          <Title>{tile.detail.headline}</Title>
          <Separator borderColor="$hairline" />
          <YStack gap="$2">
            {tile.detail.facts.map((fact) => (
              <FactRow key={fact.id} fact={fact} />
            ))}
          </YStack>
          <Notice severity="info">{tile.detail.note}</Notice>
        </Surface>
      </YStack>
    </Modal>
  );
}
