import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { McpToolKind } from '@exyconn/shell/graphql/generated';
import { renderWithProviders } from '../../test-utils';
import { ApiOperationCard } from '../../../../src/pages/reference/ApiOperationCard';
import { operation } from './reference.fixtures';

describe('ApiOperationCard', () => {
  it('names a query and, opened, shows what it does, takes, answers and an example', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ApiOperationCard operation={operation()} />);
    expect(screen.getByText('Query')).toBeInTheDocument();
    const summary = screen.getByRole('button', { name: /listLeads/ });
    expect(summary).toHaveAttribute('aria-expanded', 'false');

    await user.click(summary);
    expect(summary).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Lists the leads.')).toBeVisible();
    expect(screen.getByText('input: TableQueryInput!')).toBeVisible();
    expect(screen.getByRole('listitem')).toHaveTextContent(
      'input: TableQueryInput! — Which page to read.',
    );
    expect(screen.getByText('[Lead!]!')).toBeVisible();
    expect(screen.getByRole('region', { name: 'Example' })).toHaveTextContent(
      'query { listLeads { id } }',
    );
  });

  it('names a mutation, and lists an argument without a description bare', () => {
    renderWithProviders(
      <ApiOperationCard
        operation={operation({
          name: 'deleteLead',
          kind: McpToolKind.Mutation,
          arguments: [
            {
              __typename: 'McpToolArgument',
              name: 'id',
              type: 'ID!',
              required: true,
              description: '',
            },
          ],
        })}
      />,
    );
    expect(screen.getByText('Mutation')).toBeInTheDocument();
    expect(screen.getByRole('listitem', { hidden: true }).textContent).toBe('id: ID!');
  });

  it('says so when the operation takes no arguments', () => {
    renderWithProviders(<ApiOperationCard operation={operation({ arguments: [] })} />);
    expect(screen.getByText('No arguments.', { selector: '*' })).toBeInTheDocument();
    expect(screen.queryByRole('listitem', { hidden: true })).toBeNull();
  });
});
