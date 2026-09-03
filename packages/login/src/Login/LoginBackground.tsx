import { Box, alpha } from '@exyconn/shell/components/ui';

interface LoginBackgroundProps {
  imageUrl: string;
  accentColor: string;
  isDark: boolean;
}

/**
 * Full-bleed artwork for one portal's login screen, under an accent-tinted scrim that
 * keeps the card readable whatever the photo is. Purely decorative — it never gates the
 * form, so a missing or slow image just leaves the flat brand surface behind it.
 */
export function LoginBackground({ imageUrl, accentColor, isDark }: Readonly<LoginBackgroundProps>) {
  const base = isDark ? '#0b0e17' : '#f6f8fb';

  return (
    <Box aria-hidden sx={{ position: 'absolute', inset: 0, bgcolor: base }}>
      {imageUrl && (
        <Box
          component="img"
          src={imageUrl}
          alt=""
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(135deg, ${alpha(accentColor, isDark ? 0.55 : 0.35)}, ${alpha(
            base,
            isDark ? 0.9 : 0.82,
          )} 65%)`,
        }}
      />
    </Box>
  );
}
