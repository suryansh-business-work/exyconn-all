import { screen, waitFor } from '@testing-library/react';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { StatTile } from '../../../../src/components/dashboard/StatTile';
import { TileDetailDialog } from '../../../../src/components/dashboard/TileDetailDialog';
import { totalTiles } from '../../../../src/lib/dashboard/total-tiles';
import { renderWithProviders } from '../../test-utils';
import { ANDROID_CAPABILITIES } from '../state';

type StyleFn = (state: { pressed: boolean }) => { opacity?: number };

/**
 * The react-native stub, with two things a real phone shows made visible: the press feedback a
 * Pressable's style function gives, and the animation a Modal opens with.
 */
vi.mock('react-native', async (load) => {
  const native = await load<Record<string, unknown>>();
  const Pressable = native.Pressable as ComponentType<Record<string, unknown>>;
  const Modal = native.Modal as ComponentType<Record<string, unknown>>;
  return {
    ...native,
    Pressable: (props: Readonly<Record<string, unknown> & { style?: unknown }>) => {
      const style = typeof props.style === 'function' ? (props.style as StyleFn) : undefined;
      return (
        <div
          data-testid="pressable"
          data-idle-opacity={style?.({ pressed: false }).opacity}
          data-pressed-opacity={style?.({ pressed: true }).opacity}
        >
          <Pressable {...props} />
        </div>
      );
    },
    Modal: (
      props: Readonly<Record<string, unknown> & { animationType?: string; children?: ReactNode }>,
    ) => (
      <div data-testid="modal-frame" data-animation={props.animationType}>
        <Modal {...props} />
      </div>
    ),
  };
});

const [TILE] = totalTiles(
  { activeMs: 3_600_000, idleMs: 0, screenshots: 0, sessions: 1 },
  ANDROID_CAPABILITIES,
);

type DialogProps = ComponentProps<typeof TileDetailDialog>;

function dialog(overrides: Partial<DialogProps> = {}) {
  return (
    <TileDetailDialog
      tile={TILE}
      open
      onClose={vi.fn()}
      returnFocusTo={{ current: null }}
      {...overrides}
    />
  );
}

describe('StatTile press feedback', () => {
  it('dims while pressed and is solid otherwise', () => {
    renderWithProviders(<StatTile tile={TILE} onOpen={vi.fn()} />);
    const pressable = screen.getByTestId('pressable');
    expect(pressable.dataset.idleOpacity).toBe('1');
    expect(pressable.dataset.pressedOpacity).toBe('0.8');
  });
});

describe('TileDetailDialog motion', () => {
  it('fades in when the phone allows animation', () => {
    renderWithProviders(dialog());
    expect(screen.getByTestId('modal-frame').dataset.animation).toBe('fade');
  });

  it('appears without animation when the phone asks for reduced motion', async () => {
    vi.mocked(AccessibilityInfo.isReduceMotionEnabled).mockResolvedValue(true);
    renderWithProviders(dialog());
    await waitFor(() => expect(screen.getByTestId('modal-frame').dataset.animation).toBe('none'));
  });
});
