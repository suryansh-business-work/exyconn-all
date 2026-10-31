import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { McpSandboxPage } from '../../../src/pages/mcp-sandbox';
import type { McpSandbox } from '../../../src/pages/mcp-sandbox/useMcpSandbox';
import { renderWithProviders, sandboxOf } from '../test-utils';

const state = vi.hoisted(() => ({ sandbox: null as McpSandbox | null }));

vi.mock('../../../src/pages/mcp-sandbox/useMcpSandbox', () => ({
  useMcpSandbox: () => state.sandbox,
}));
vi.mock('@exyconn/demo-visitor/page', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@exyconn/demo-visitor/page')>()),
  DemoHeader: ({ current }: Readonly<{ current: string }>) => <header>{current}</header>,
  DemoFooter: () => <footer>Footer</footer>,
  DemoCtaBand: ({ title }: Readonly<{ title: string }>) => <aside>{title}</aside>,
}));

beforeEach(() => {
  state.sandbox = sandboxOf();
});

describe('the MCP sandbox page', () => {
  it('lays out the token, the sample data, connecting Claude and the playground', () => {
    state.sandbox = sandboxOf({
      issued: { token: 'secret-1', id: 'tok-1', expiresAt: '2026-10-31T11:00:00.000Z' },
    });
    renderWithProviders(<McpSandboxPage />);
    expect(screen.getByRole('banner')).toHaveTextContent('mcp-sandbox-demo');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Connect Claude to/);
    expect(screen.getByRole('heading', { name: 'What is in the sandbox' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Claude Code command' })).toHaveTextContent(
      'Bearer secret-1',
    );
    expect(screen.getByRole('button', { name: 'List the tools' })).toBeInTheDocument();
    expect(screen.getByText('Can Claude change anything?')).toBeInTheDocument();
  });

  it('leaves out the sandbox sections until the sandbox is known', () => {
    state.sandbox = sandboxOf({ info: null });
    renderWithProviders(<McpSandboxPage />);
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Connect Claude' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How to try it' })).toBeInTheDocument();
  });
});
