import type { RefObject } from 'react';
import { Modal, type HostInstance } from 'react-native';
import { Separator, XStack, YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { useReturnFocus } from '../../hooks/useReturnFocus';
import type { Tile, TileFact } from '../../lib/dashboard/tile.types';
import { useBrand } from '../../theme/BrandProvider';
import { SCRIM } from '../../theme/palette';
import { AppButton } from '../ui/AppButton';
import { Icon } from '../ui/Icon';
import { Notice } from '../ui/Notice';
import { Surface } from '../ui/Surface';
import { Body, Heading, Title } from '../ui/Typography';

interface Props {
  /** The tile to explain; null until one has been opened. */
  tile: Tile | null;
  open: boolean;
  onClose: () => void;
  /** The tile that was tapped; the screen reader goes back to it on close. */
  returnFocusTo: RefObject<HostInstance | null>;
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
export function TileDetailDialog({ tile, open, onClose, returnFocusTo }: Readonly<Props>) {
  const t = useT();
  const brand = useBrand();
  const reduceMotion = useReduceMotion();
  const { titleRef, modalProps } = useReturnFocus(open, returnFocusTo);
  if (tile === null) {
    return null;
  }
  const label = t(tile.label);

  return (
    <Modal
      visible={open}
      transparent
      animationType={reduceMotion ? 'none' : 'fade'}
      onRequestClose={onClose}
      {...modalProps}
    >
      <YStack flex={1} justifyContent="center" padding="$5" backgroundColor={SCRIM}>
        <Surface
          padding="$5"
          gap="$3"
          accessibilityViewIsModal
          accessibilityLabel={t('{label} detail', { label })}
        >
          <XStack gap="$2" alignItems="center">
            <Icon name={tile.icon} size={20} color={brand.primary} />
            <Heading ref={titleRef} flex={1}>
              {label}
            </Heading>
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
