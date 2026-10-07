import {
  useEffect,
  useImperativeHandle,
  type ComponentType,
  type ReactNode,
  type Ref,
} from 'react';
import { vi } from 'vitest';
import { domA11yProps } from './host-props';
import type { HostProps } from './host';

interface ListHandle {
  scrollToEnd: (options?: unknown) => void;
  scrollToIndex: (options: unknown) => void;
  scrollToOffset: (options: unknown) => void;
}

type Slot = ComponentType | ReactNode;

interface FlatListProps<T> extends Omit<HostProps, 'ref'> {
  data: readonly T[] | null | undefined;
  renderItem: (info: { item: T; index: number }) => ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  ListEmptyComponent?: Slot;
  ListHeaderComponent?: Slot;
  ListFooterComponent?: Slot;
  onContentSizeChange?: (width: number, height: number) => void;
  ref?: Ref<ListHandle>;
  numColumns?: number;
  contentContainerStyle?: unknown;
  columnWrapperStyle?: unknown;
  keyboardShouldPersistTaps?: string;
}

function renderSlot(slot: Slot | undefined): ReactNode {
  if (typeof slot === 'function') {
    const Component = slot;
    return <Component />;
  }
  return slot ?? null;
}

function keyOf<T>(item: T, index: number, keyExtractor?: (item: T, index: number) => string) {
  if (keyExtractor) {
    return keyExtractor(item, index);
  }
  const id = (item as { key?: string; id?: string }).key ?? (item as { id?: string }).id;
  return id ?? String(index);
}

/** Renders every item (no virtualisation); `onContentSizeChange` fires after each render. */
export function FlatList<T>({
  data,
  renderItem,
  keyExtractor,
  ListEmptyComponent,
  ListHeaderComponent,
  ListFooterComponent,
  onContentSizeChange,
  ref,
  ...rest
}: Readonly<FlatListProps<T>>) {
  useImperativeHandle(
    ref,
    () => ({ scrollToEnd: vi.fn(), scrollToIndex: vi.fn(), scrollToOffset: vi.fn() }),
    [],
  );
  useEffect(() => {
    onContentSizeChange?.(0, 0);
  });
  const items = data ?? [];
  return (
    <div {...domA11yProps(rest)}>
      {renderSlot(ListHeaderComponent)}
      {items.length === 0 ? renderSlot(ListEmptyComponent) : null}
      {items.map((item, index) => (
        <div key={keyOf(item, index, keyExtractor)}>{renderItem({ item, index })}</div>
      ))}
      {renderSlot(ListFooterComponent)}
    </div>
  );
}
