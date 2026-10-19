import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useWidgetActions, WidgetActionsProvider } from '../../../src/widget/WidgetActions';
import { widgetActions } from './widget.fixtures';

describe('useWidgetActions', () => {
  it('refuses to run outside a ChatWidget', () => {
    expect(() => renderHook(() => useWidgetActions())).toThrow(
      'Widget messages must sit inside a ChatWidget.',
    );
  });

  it("returns the enclosing widget's actions", () => {
    const actions = widgetActions();
    const { result } = renderHook(() => useWidgetActions(), {
      wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
        <WidgetActionsProvider value={actions}>{children}</WidgetActionsProvider>
      ),
    });
    expect(result.current).toBe(actions);
  });
});
