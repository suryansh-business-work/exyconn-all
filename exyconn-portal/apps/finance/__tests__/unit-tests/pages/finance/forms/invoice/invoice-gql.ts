import { vi } from 'vitest';

/** The client list the invoice form tests pick from. */
export const CLIENTS = [
  { id: 'client-1', name: 'Nimbus Ltd', company: 'Nimbus', currency: 'INR' },
  { id: 'client-2', name: 'Globex', company: 'Globex Corp', currency: 'USD' },
  { id: 'client-3', name: 'Initech', company: 'Initech LLC', currency: '' },
];

/**
 * The GraphQL hooks the invoice form calls, as mocks a test arranges. One instance per test
 * file: the `vi.mock` factory and the test import the same module.
 */
export const gql = {
  create: vi.fn(),
  update: vi.fn(),
  clients: vi.fn(() => ({ data: { listClients: CLIENTS } })),
};

/** Stand-ins for the generated hooks, spread over the real module in a `vi.mock` factory. */
export const invoiceHooks = {
  useCreateInvoiceMutation: () => [gql.create],
  useUpdateInvoiceMutation: () => [gql.update],
  useListClientsQuery: () => gql.clients(),
  useGstStatesQuery: () => ({ data: { gstStates: [{ code: '27', name: 'Maharashtra' }] } }),
};
