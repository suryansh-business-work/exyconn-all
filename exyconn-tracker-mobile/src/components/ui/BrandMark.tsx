import { Image } from 'expo-image';
import { useBrand } from '../../theme/BrandProvider';
import { Title } from './Typography';

interface Props {
  height?: number;
}

/**
 * The workspace's logo from the portal branding — the dark-ground variant on the dark theme —
 * and its name in type when no logo has been uploaded (or branding failed to load).
 */
export function BrandMark({ height = 36 }: Readonly<Props>) {
  const { branding, scheme } = useBrand();
  const logo = scheme === 'dark' ? branding?.logoDarkUrl || branding?.logoUrl : branding?.logoUrl;
  const name = branding?.businessName || 'Exyconn';

  if (!logo) {
    return <Title>{name}</Title>;
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
