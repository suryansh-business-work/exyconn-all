import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import WorkOutlineIcon from '@mui/icons-material/WorkOutlined';
import { ThemeProvider } from '@exyconn/ui/styles';
import { color, contrastRatio, createAppTheme, pastelTone } from '@exyconn/ui';
import { IconBubble, BUBBLE_SIZE } from '@/components/dashboard/IconBubble';

describe.each(['light', 'dark'] as const)('IconBubble in %s mode', (mode) => {
  const theme = createAppTheme(mode);

  it('tints a round bubble from the accent and draws its icon at 3:1 on the tint', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <IconBubble icon={WorkOutlineIcon} accent={color.amber[500]} />
      </ThemeProvider>,
    );
    const bubble = container.firstElementChild as HTMLElement;
    const tone = pastelTone(color.amber[500], theme.palette.background.paper, mode);
    expect(bubble).toHaveAttribute('aria-hidden', 'true');
    expect(bubble).toHaveStyle({ width: `${BUBBLE_SIZE}px`, borderRadius: '50%' });
    expect(contrastRatio(tone.ink, tone.fill)).toBeGreaterThanOrEqual(3);
    expect(container.querySelector('[data-testid="WorkOutlinedIcon"]')).toBeInTheDocument();
  });

  it('takes a smaller size', () => {
    const { container } = render(
      <ThemeProvider theme={theme}>
        <IconBubble icon={WorkOutlineIcon} accent={color.blue[400]} size={36} />
      </ThemeProvider>,
    );
    expect(container.firstElementChild).toHaveStyle({ width: '36px', height: '36px' });
  });
});
