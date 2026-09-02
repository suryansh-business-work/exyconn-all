import { Box } from '@exyconn/shell/components/ui';

const SCENE_SRC = 'https://ik.imagekit.io/esdata1/exyconn/login/login-3d.mp4';

/** Ambient looping 3D hero clip. Purely decorative — never gates the form. */
export function LoginScene() {
  return (
    <Box
      component="video"
      src={SCENE_SRC}
      autoPlay
      muted
      loop
      playsInline
      sx={{ width: '100%', maxWidth: 360, borderRadius: 2, mb: 3 }}
    />
  );
}
