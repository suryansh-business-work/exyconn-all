import { renderHook } from '@testing-library/react';
import type { RuntimeOptions } from '../../../src/runtime/types';
import { useChatRuntime } from '../../../src/runtime/useChatRuntime';
import { runtimeOptions } from './runtime.fixtures';

/** Mounts the runtime with test options; `rt()` reads its latest value. */
export function mountRuntime(overrides: Partial<RuntimeOptions> = {}) {
  const options = runtimeOptions(overrides);
  const hook = renderHook((props: RuntimeOptions) => useChatRuntime(props), {
    initialProps: options,
  });
  return { hook, options, rt: () => hook.result.current };
}

/** Ids of the clinic chat's messages, in order. */
export function clinicIds(rt: () => ReturnType<typeof useChatRuntime>): string[] {
  return rt().store.chats.clinic.messages.map((m) => m.id);
}
