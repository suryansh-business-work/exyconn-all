import { GraphQLError } from 'graphql';
import {
  ConfigurationError,
  badRequest,
  forbidden,
  notFound,
  unauthenticated,
} from '../../../src/utils/errors';

function caught(run: () => unknown): GraphQLError {
  try {
    run();
  } catch (error) {
    if (error instanceof GraphQLError) {
      return error;
    }
    throw error;
  }
  throw new Error('expected a GraphQLError');
}

describe('typed GraphQL errors', () => {
  it('unauthenticated carries UNAUTHENTICATED and a default message', () => {
    const error = caught(() => unauthenticated());
    expect(error.message).toBe('Authentication required');
    expect(error.extensions.code).toBe('UNAUTHENTICATED');
    expect(caught(() => unauthenticated('Session expired')).message).toBe('Session expired');
  });

  it('forbidden carries FORBIDDEN and a default message', () => {
    const error = caught(() => forbidden());
    expect(error.message).toBe('You do not have access to this resource');
    expect(error.extensions.code).toBe('FORBIDDEN');
    expect(caught(() => forbidden('Admins only')).message).toBe('Admins only');
  });

  it('notFound names the missing resource', () => {
    const error = caught(() => notFound('Invoice'));
    expect(error.message).toBe('Invoice not found');
    expect(error.extensions.code).toBe('NOT_FOUND');
  });

  it('badRequest carries BAD_USER_INPUT and the given message', () => {
    const error = caught(() => badRequest('Name is required'));
    expect(error.message).toBe('Name is required');
    expect(error.extensions.code).toBe('BAD_USER_INPUT');
  });
});

describe('ConfigurationError', () => {
  it('is an Error with the FAILED_PRECONDITION code and the message as given', () => {
    const error = new ConfigurationError('Add an email configuration');
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe('FAILED_PRECONDITION');
    expect(error.message).toBe('Add an email configuration');
  });
});
