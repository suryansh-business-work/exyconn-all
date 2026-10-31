import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  MAX_ARGUMENTS_LENGTH,
  ToolCallForm,
  isJsonObject,
  toolCallSchema,
} from '../../../src/forms/tool-call';
import { renderWithProviders } from '../test-utils';

const show = (onRun = vi.fn(), initialArgs = '{}', busy = false) =>
  renderWithProviders(<ToolCallForm initialArgs={initialArgs} busy={busy} onRun={onRun} />);

describe('the tool call form', () => {
  it('runs the tool with the parsed arguments', async () => {
    const onRun = vi.fn();
    show(onRun, '{\n  "page": 1\n}');
    await userEvent.click(screen.getByRole('button', { name: 'Run tool' }));
    await vi.waitFor(() => expect(onRun).toHaveBeenCalledWith({ page: 1 }));
  });

  it('refuses arguments that are not one JSON object', async () => {
    const onRun = vi.fn();
    show(onRun, '[1, 2]');
    await userEvent.click(screen.getByRole('button', { name: 'Run tool' }));
    expect(await screen.findByText(/as one JSON object/)).toBeInTheDocument();
    expect(onRun).not.toHaveBeenCalled();
  });

  it('asks for {} rather than nothing', async () => {
    show(vi.fn(), '');
    await userEvent.click(screen.getByRole('button', { name: 'Run tool' }));
    expect(await screen.findByText(/or \{\} when the tool takes none/)).toBeInTheDocument();
  });

  it('cannot run while a run is under way', () => {
    show(vi.fn(), '{}', true);
    expect(screen.getByRole('button', { name: 'Run tool' })).toBeDisabled();
  });

  it('reads only JSON objects, and caps their length', () => {
    expect(isJsonObject('{"a":1}')).toBe(true);
    expect(isJsonObject('null')).toBe(false);
    expect(isJsonObject('"text"')).toBe(false);
    expect(isJsonObject('{oops')).toBe(false);
    const long = `{"a":"${'x'.repeat(MAX_ARGUMENTS_LENGTH)}"}`;
    expect(toolCallSchema.safeParse({ args: long }).success).toBe(false);
  });
});
