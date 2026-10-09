import { useRef } from 'react';

let nextKey = 0;

/**
 * Stable React keys for an editable list of plain values (no ids of their own).
 * Call `removeKey(index)` right before removing the item at that index.
 */
export const useStableKeys = (length: number) => {
  const keysRef = useRef<string[]>([]);
  while (keysRef.current.length < length) {
    keysRef.current.push(`item-${nextKey++}`);
  }
  const keys = keysRef.current;
  const removeKey = (index: number) => {
    keys.splice(index, 1);
  };
  return { keys, removeKey };
};
