import { act, fireEvent, screen } from '@testing-library/react';
import { BottomTabBarHeightCallbackContext, Tabs } from 'expo-router/tabs';
import { describe, expect, it, vi } from 'vitest';
import { TabBar } from '../../../../src/components/shell/TabBar';
import { tabsNavigation } from '../../mocks/expo-router-tabs';
import { rnTest } from '../../mocks/react-native/apis';
import { renderWithProviders } from '../../test-utils';

/** The floating bar the navigator draws, over three sections and one route it does not know. */
function renderBar(unreadMessages = 0) {
  const reportHeight = vi.fn();
  renderWithProviders(
    <BottomTabBarHeightCallbackContext.Provider value={reportHeight}>
      <Tabs tabBar={(props) => <TabBar {...props} unreadMessages={unreadMessages} />}>
        <Tabs.Screen name="dashboard" />
        <Tabs.Screen name="report" />
        <Tabs.Screen name="messages" />
        <Tabs.Screen name="not-a-section" />
      </Tabs>
    </BottomTabBarHeightCallbackContext.Provider>,
  );
  return reportHeight;
}

/** Lays out every element above `element`; only the bar's own view listens for it. */
function layOutAround(element: HTMLElement, height: number): void {
  for (let node = element.parentElement; node !== null; node = node.parentElement) {
    rnTest.layout(node, { width: 300, height });
  }
}

describe('TabBar', () => {
  it('shows one tab per known section, the current one as a named pill', () => {
    renderBar();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'My Report' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Report')).not.toBeInTheDocument();
  });

  it('counts unread messages on the Messages tab', () => {
    renderBar(2);
    expect(screen.getByRole('tab', { name: 'Messages, 2 unread' })).toBeInTheDocument();
  });

  it('moves to another section when its tab is pressed', () => {
    renderBar();
    fireEvent.click(screen.getByRole('tab', { name: 'My Report' }));
    expect(tabsNavigation.emit).toHaveBeenCalledWith({
      type: 'tabPress',
      target: 'report-key',
      canPreventDefault: true,
    });
    expect(tabsNavigation.navigate).toHaveBeenCalledWith('report', undefined);
  });

  it('stays put when the current tab is pressed again', () => {
    renderBar();
    fireEvent.click(screen.getByRole('tab', { name: 'Dashboard' }));
    expect(tabsNavigation.emit).toHaveBeenCalledTimes(1);
    expect(tabsNavigation.navigate).not.toHaveBeenCalled();
  });

  it('lets a screen veto the move', () => {
    vi.mocked(tabsNavigation.emit).mockReturnValueOnce({ defaultPrevented: true });
    renderBar();
    fireEvent.click(screen.getByRole('tab', { name: 'Messages' }));
    expect(tabsNavigation.navigate).not.toHaveBeenCalled();
  });

  it('reports its real height, above the safe area, so screens can pad their foot', () => {
    const reportHeight = renderBar();
    layOutAround(screen.getByRole('tab', { name: 'Dashboard' }), 60);
    expect(reportHeight).toHaveBeenCalledWith(72);
  });

  it('steps aside while the keyboard is up, and comes back after', () => {
    const reportHeight = renderBar();
    act(() => rnTest.keyboard('keyboardWillShow'));
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(reportHeight).toHaveBeenCalledWith(0);
    act(() => rnTest.keyboard('keyboardWillHide'));
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('works under a navigator that does not listen for its height', () => {
    renderWithProviders(
      <Tabs tabBar={(props) => <TabBar {...props} unreadMessages={0} />}>
        <Tabs.Screen name="dashboard" />
      </Tabs>,
    );
    layOutAround(screen.getByRole('tab', { name: 'Dashboard' }), 60);
    act(() => rnTest.keyboard('keyboardWillShow'));
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
