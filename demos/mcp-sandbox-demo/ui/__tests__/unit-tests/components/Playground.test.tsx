import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Playground } from '../../../src/components/Playground';
import { ENDPOINT, renderWithProviders, reply } from '../test-utils';

const fetchMock = vi.fn();
const TOOLS = [
  {
    name: 'getLead',
    description: 'One lead by id.',
    inputSchema: { properties: { id: { type: 'string' } }, required: ['id'] },
  },
  { name: 'crmDashboard' },
];

beforeEach(() => vi.stubGlobal('fetch', fetchMock));
afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

describe('the playground', () => {
  it('asks for a token first', () => {
    renderWithProviders(<Playground endpointUrl={ENDPOINT} token={null} />);
    expect(screen.getByText('Take a token above to try the tools here.')).toBeInTheDocument();
  });

  it('shows why the tools could not be listed', async () => {
    fetchMock.mockResolvedValueOnce(reply(401, {}));
    renderWithProviders(<Playground endpointUrl={ENDPOINT} token="old" />);
    await userEvent.click(screen.getByRole('button', { name: 'List the tools' }));
    expect(await screen.findByText(/expired or was revoked/)).toBeInTheDocument();
  });

  it('lists the tools, runs the picked one with its arguments and shows the answer', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { result: { tools: TOOLS } }));
    renderWithProviders(<Playground endpointUrl={ENDPOINT} token="secret" />);
    await userEvent.click(screen.getByRole('button', { name: 'List the tools' }));
    expect(await screen.findByText('2 of 2 read-only tools')).toBeInTheDocument();
    expect(screen.getByText('Pick a tool to see what it does and run it.')).toBeInTheDocument();
    await userEvent.type(screen.getByRole('textbox', { name: 'Filter tools' }), 'lead');
    expect(screen.getByText('1 of 2 read-only tools')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'getLead' }));
    expect(screen.getByText('One lead by id.')).toBeInTheDocument();
    const args = screen.getByRole('textbox', { name: /Arguments/ });
    expect(JSON.parse((args as HTMLTextAreaElement).value)).toEqual({ id: '' });
    await userEvent.clear(args);
    await userEvent.type(args, '{{"id": "L-1"}');
    fetchMock.mockResolvedValueOnce(
      reply(200, { result: { content: [{ type: 'text', text: '{"name":"Rachel"}' }] } }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Run tool' }));
    expect(await screen.findByRole('region', { name: 'Answer' })).toHaveTextContent('Rachel');
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).params).toEqual({
      name: 'getLead',
      arguments: { id: 'L-1' },
    });
  });

  it('shows a refused call as an error answer, and a tool with no description', async () => {
    fetchMock.mockResolvedValueOnce(reply(200, { result: { tools: TOOLS } }));
    renderWithProviders(<Playground endpointUrl={ENDPOINT} token="secret" />);
    await userEvent.click(screen.getByRole('button', { name: 'List the tools' }));
    await userEvent.click(await screen.findByRole('button', { name: 'crmDashboard' }));
    fetchMock.mockResolvedValueOnce(
      reply(200, {
        result: { content: [{ type: 'text', text: 'Rate limit reached' }], isError: true },
      }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Run tool' }));
    expect(await screen.findByRole('region', { name: 'Answer' })).toHaveTextContent(
      'Rate limit reached',
    );
  });
});
