import { afterEach, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { closeComms, readMemory } from '../../../../src/records/comms/commsStore';
import { useFormMemory } from '../../../../src/records/comms/useFormMemory';
import { resetDock } from './comms-fixtures';

interface Draft {
  body: string;
}

function renderMemory(panelKey: string | undefined) {
  return renderHook(() => {
    const methods = useForm<Draft>({ defaultValues: { body: '' } });
    useFormMemory(methods, panelKey, 'draft');
    return methods;
  });
}

describe('useFormMemory', () => {
  afterEach(() => {
    closeComms('SMS:CONTACT:c-9');
    resetDock();
  });

  it('keeps what is typed under the panel key, until unmounted', () => {
    const { result, unmount } = renderMemory('SMS:CONTACT:c-9');

    act(() => result.current.setValue('body', 'Hello'));
    expect(readMemory('SMS:CONTACT:c-9', 'draft')).toEqual({ body: 'Hello' });

    unmount();
    act(() => result.current.setValue('body', 'Changed after unmount'));
    expect(readMemory('SMS:CONTACT:c-9', 'draft')).toEqual({ body: 'Hello' });
  });

  it('remembers nothing for a form outside the dock', () => {
    const { result } = renderMemory(undefined);

    act(() => result.current.setValue('body', 'Hello'));

    expect(readMemory('undefined', 'draft')).toBeUndefined();
  });
});
