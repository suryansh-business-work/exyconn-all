/**
 * Shared steps for tool-page tests: the page layout is replaced by a bare heading, the
 * network is a stub the test scripts, and a tool is mounted by its registry id.
 */
import React from 'react';
import { vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OpenAIProvider } from '../../shared/context/OpenAIContext';
import { SecretsProvider } from '../../shared/context/SecretsContext';
import { ThemeProvider } from '../../shared/context/ThemeContext';

/** The `vi.mock` factory for ToolLayout: the tool's own content under its name. */
export const toolLayoutStub = () => ({
  default: ({ children, toolName }: { children?: React.ReactNode; toolName?: string }) => (
    <div>
      <h1>{toolName}</h1>
      {children}
    </div>
  ),
});

/** A `Response`-like value for the stubbed fetch. */
export const jsonReply = (body: unknown, init: { ok?: boolean; status?: number } = {}) => ({
  ok: init.ok ?? true,
  status: init.status ?? 200,
  statusText: 'OK',
  headers: new Headers(),
  json: async () => body,
  text: async () => JSON.stringify(body),
  blob: async () => new Blob([JSON.stringify(body)]),
  arrayBuffer: async () => new ArrayBuffer(0),
});

/** A successful `{ success: true, data }` envelope, as the tools API answers. */
export const apiOk = (data: unknown) => jsonReply({ success: true, data });

/** Replaces the global fetch with a stub and returns it. */
export function stubFetch(...replies: unknown[]) {
  const fetchMock = vi.fn();
  replies.forEach((reply) => fetchMock.mockResolvedValueOnce(reply));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Mounts a tool in the provider stack the real app wraps it in. */
export function renderTool(Tool: React.ComponentType) {
  return render(
    <ThemeProvider>
      <OpenAIProvider>
        <MemoryRouter>
          <SecretsProvider>
            <Tool />
          </SecretsProvider>
        </MemoryRouter>
      </OpenAIProvider>
    </ThemeProvider>
  );
}

/** Types into the only text box of a tool and submits its form. */
export function submitSingleField(container: HTMLElement, value: string) {
  fireEvent.change(screen.getByRole('textbox'), { target: { value } });
  fireEvent.submit(container.querySelector('form') as HTMLFormElement);
}

/** Waits for the error alert a tool raises for a failed request. */
export const findAlert = (text: string | RegExp) => screen.findByText(text, undefined, { timeout: 3000 });

/** A click outside everything, which is how a Snackbar's clickaway close is triggered. */
export async function clickAway() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.click(document.body);
  });
}

export { waitFor };
