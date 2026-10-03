import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet } from 'react-native';
import { YStack } from 'tamagui';
import { useT } from '@exyconn/i18n';
import { TRACKER_RADIUS, borderWidth } from '../../theme/tokens';
import { useThemeColor } from '../../theme/useThemeColor';
import { SkeletonBlock } from '../report/SkeletonBlock';
import { Caption } from '../ui/Typography';

interface Props {
  uri: string;
  /** Keeps a recycled cell from flashing the shot it last showed. */
  recyclingKey: string;
  accessibilityLabel: string;
}

type Stage = 'loading' | 'loaded' | 'failed';

/**
 * A screenshot thumbnail, 16:10. The image comes from storage, not the app, so it holds a
 * skeleton until it has arrived and says so when it never does — never an empty frame.
 * Keyed on the shot by its parent, so a new shot starts loading afresh.
 */
export function ShotImage({ uri, recyclingKey, accessibilityLabel }: Readonly<Props>) {
  const t = useT();
  const hairline = useThemeColor('hairline');
  const [stage, setStage] = useState<Stage>('loading');

  return (
    <YStack
      width="100%"
      aspectRatio={16 / 10}
      overflow="hidden"
      borderRadius={TRACKER_RADIUS}
      borderWidth={borderWidth.hairline}
      borderColor={hairline}
    >
      <Image
        source={{ uri }}
        contentFit="cover"
        recyclingKey={recyclingKey}
        transition={150}
        accessibilityLabel={accessibilityLabel}
        onLoad={() => setStage('loaded')}
        onError={() => setStage('failed')}
        style={StyleSheet.absoluteFill}
      />
      {stage === 'loading' ? (
        <SkeletonBlock position="absolute" top={0} right={0} bottom={0} left={0} />
      ) : null}
      {stage === 'failed' ? (
        <YStack
          position="absolute"
          top={0}
          right={0}
          bottom={0}
          left={0}
          alignItems="center"
          justifyContent="center"
          padding="$2"
          backgroundColor="$paper"
        >
          <Caption textAlign="center">{t('This screenshot could not be loaded.')}</Caption>
        </YStack>
      ) : null}
    </YStack>
  );
}
