import { Box } from '@/components/ui';

/**
 * The red star after a label that is not an input's own (an image picker, a set of chips),
 * matching the one MUI draws for `required`. Hidden from screen readers: the field says it
 * is required in words where it can, and the star is only its visual shorthand.
 */
export function RequiredStar({ show }: Readonly<{ show: boolean }>) {
  if (!show) {
    return null;
  }
  return (
    <Box component="span" aria-hidden sx={{ color: 'error.main' }}>
      {' *'}
    </Box>
  );
}
