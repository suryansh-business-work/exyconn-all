import { useT } from '@exyconn/i18n';
import { Box, Link, Text, radius } from '@exyconn/shell/components/ui';
import type { DemoPhoto } from './demoPhotos';

interface DemoPhotoFrameProps {
  photo: DemoPhoto;
  /** Width over height, e.g. 4 / 3. */
  ratio?: number;
  /** The first photo on the page loads at once; the rest wait until they are near. */
  eager?: boolean;
}

/** A demo page photo: rounded, cropped to a ratio, with its Pexels credit underneath. */
export function DemoPhotoFrame({
  photo,
  ratio = 4 / 3,
  eager = false,
}: Readonly<DemoPhotoFrameProps>) {
  const t = useT();
  return (
    <Box component="figure" sx={{ m: 0 }}>
      <Box
        component="img"
        src={photo.src}
        alt={t(photo.alt)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        sx={{
          display: 'block',
          width: '100%',
          aspectRatio: String(ratio),
          objectFit: 'cover',
          borderRadius: `${radius.lg}px`,
          bgcolor: 'action.hover',
        }}
      />
      <Text component="figcaption" size="caption" color="text.secondary" sx={{ mt: 1 }}>
        {t('Photo:')}{' '}
        <Link href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" color="inherit">
          Pexels
        </Link>
      </Text>
    </Box>
  );
}
