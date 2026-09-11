import { Image } from 'expo-image';
import { XStack } from 'tamagui';
import { useBrand } from '../../theme/BrandProvider';
import { Title } from './Typography';
// The tracker's own icon (transparent): the portal's "app icon" is often its wide logo again.
import appIcon from '../../../assets/splash-icon.png';

/** The splash art sits in the middle ~60% of its canvas, so it is drawn larger to match. */
const ICON_SCALE = 1.5;

interface Props {
  height?: number;
}

/**
 * The workspace's brand, as the desktop draws it: its logo on the light palette, and its name
 * in the theme's own ink beside the tracker's icon on the dark one (or with no logo) — a
 * dark-ground logo is often the light one uploaded again (the Exyconn workspace's logo, dark
 * logo and app icon are one dark-ink image), and a logo that vanishes on its ground is worse
 * than plain type.
 */
export function BrandMark({ height = 36 }: Readonly<Props>) {
  const { branding, scheme } = useBrand();
  const logo = branding?.logoUrl ?? '';
  const name = branding?.businessName || 'Exyconn';

  if (scheme === 'dark' || logo === '') {
    return (
      <XStack alignItems="center" gap="$2">
        <Image
          source={appIcon}
          style={{ height: height * ICON_SCALE, width: height * ICON_SCALE, margin: -height / 4 }}
          contentFit="contain"
          accessibilityElementsHidden
        />
        <Title color="$ink" fontSize={Math.max(15, Math.round(height * 0.75))}>
          {name}
        </Title>
      </XStack>
    );
  }
  return (
    <Image
      source={{ uri: logo }}
      style={{ height, width: height * 4 }}
      contentFit="contain"
      accessibilityLabel={name}
    />
  );
}
