import type { ReactNode } from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, type FieldValues, type Resolver } from 'react-hook-form';
import type { NodeOf, NodeType, WaNode } from '@exyconn/wa-flow';
import { Button } from '@exyconn/shell/components/ui';
import { defaultNodeData } from '../../../../../../src/admin/workflows/model/node-defaults';
import { NodeForm } from '../../../../../../src/admin/workflows/editor/inspector/NodeForm';
import type { NodeFormEnv } from '../../../../../../src/admin/workflows/editor/inspector/fields/form-types';
import { renderWithProviders } from '../../../../test-utils';

/** A node of `type` with the palette's default data, overridden where a test needs it. */
export function makeNode<T extends NodeType>(
  type: T,
  data: Partial<NodeOf<T>['data']> = {},
  id = `${type}-1`,
): NodeOf<T> {
  const node = {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { ...defaultNodeData(type, ['main']), ...data },
  };
  return node as unknown as NodeOf<T>;
}

export const ENV: NodeFormEnv = { workflowKeys: ['main', 'faq'], aiConfigured: true };

/** Mounts the inspector form of a node the way the editor does, through `NodeForm`. */
export function renderNodeForm(node: WaNode, env: Partial<NodeFormEnv> = {}) {
  const onApply = vi.fn<(data: WaNode['data']) => void>();
  const user = userEvent.setup();
  renderWithProviders(<NodeForm node={node} env={{ ...ENV, ...env }} onApply={onApply} />);
  return { user, onApply };
}

/** Presses Apply and resolves with the data handed to the canvas. */
export async function applyForm(
  user: ReturnType<typeof userEvent.setup>,
  onApply: ReturnType<typeof vi.fn>,
): Promise<unknown> {
  await user.click(screen.getByRole('button', { name: 'Apply' }));
  await waitFor(() => expect(onApply).toHaveBeenCalledTimes(1));
  return onApply.mock.calls[0][0];
}

/** Replaces a text field's value (paste keeps `{{…}}` literal, unlike typing). */
export async function replaceText(
  user: ReturnType<typeof userEvent.setup>,
  field: HTMLElement,
  value: string,
): Promise<void> {
  await user.clear(field);
  if (value !== '') {
    await user.click(field);
    await user.paste(value);
  }
}

/** Opens a MUI select by its label and picks an option. */
export async function pickOption(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string,
): Promise<void> {
  await user.click(screen.getByRole('combobox', { name: label }));
  await user.click(await screen.findByRole('option', { name: option }));
}

interface FormHarnessProps {
  defaultValues: FieldValues;
  onSubmit?: (values: FieldValues) => void;
  resolver?: Resolver<FieldValues>;
  children: ReactNode;
}

/** A bare RHF form around a field component, with a Submit button. */
export function FormHarness({
  defaultValues,
  onSubmit = () => undefined,
  resolver,
  children,
}: Readonly<FormHarnessProps>) {
  const methods = useForm({ defaultValues, resolver, mode: 'onTouched' });
  return (
    <FormProvider {...methods}>
      <form noValidate onSubmit={methods.handleSubmit(onSubmit)}>
        {children}
        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  );
}

interface FieldOptions {
  resolver?: Resolver<FieldValues>;
  messages?: Record<string, string>;
}

/** Mounts a field inside {@link FormHarness} and returns the submit spy. */
export function renderField(
  ui: ReactNode,
  defaultValues: FieldValues,
  { resolver, messages }: Readonly<FieldOptions> = {},
) {
  const onSubmit = vi.fn<(values: FieldValues) => void>();
  const user = userEvent.setup();
  renderWithProviders(
    <FormHarness defaultValues={defaultValues} onSubmit={onSubmit} resolver={resolver}>
      {ui}
    </FormHarness>,
    { messages },
  );
  const submit = async () => {
    await user.click(screen.getByRole('button', { name: 'Submit' }));
  };
  return { user, onSubmit, submit };
}

/** The values of the `times`-th submit, once it has happened. */
export async function submitted(
  onSubmit: ReturnType<typeof vi.fn>,
  times = 1,
): Promise<FieldValues> {
  await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(times));
  return onSubmit.mock.calls[times - 1][0] as FieldValues;
}
