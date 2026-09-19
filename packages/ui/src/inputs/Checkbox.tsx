import { forwardRef, useEffect, useRef, type Ref } from 'react';
import MuiCheckbox, { type CheckboxProps } from '@mui/material/Checkbox';
import { useForkRef } from '@mui/material/utils';

type InputSlot = NonNullable<NonNullable<CheckboxProps['slotProps']>['input']>;
type InputProps = Exclude<InputSlot, (...args: never[]) => unknown> & {
  ref?: Ref<HTMLInputElement>;
};

/**
 * MUI marks a half-ticked box with `aria-checked="mixed"` on the native input, which ARIA does
 * not allow there (axe: aria-conditional-attr) and screen readers read inconsistently. The
 * native `indeterminate` property is the real "mixed" state, so that is set instead.
 */
function nativeMixed(props: InputProps, ref: Ref<HTMLInputElement>): InputProps {
  return { ...props, ref, 'aria-checked': undefined };
}

/** Brand checkbox — single wrapper around MUI Checkbox for app-wide defaults. */
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ indeterminate = false, slotProps, ...props }, ref) => {
    const input = useRef<HTMLInputElement>(null);
    const given = slotProps?.input;
    const givenRef =
      typeof given === 'function' ? undefined : (given as InputProps | undefined)?.ref;
    const handleRef = useForkRef(input, givenRef);
    useEffect(() => {
      if (input.current) input.current.indeterminate = indeterminate;
    }, [indeterminate]);
    const inputSlot: InputSlot =
      typeof given === 'function'
        ? (state) => nativeMixed(given(state) as InputProps, handleRef)
        : nativeMixed({ ...given }, handleRef);
    return (
      <MuiCheckbox
        ref={ref}
        {...props}
        indeterminate={indeterminate}
        slotProps={{ ...slotProps, input: inputSlot }}
      />
    );
  },
);
Checkbox.displayName = 'Checkbox';

export type { CheckboxProps };
