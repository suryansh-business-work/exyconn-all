import mongoose from 'mongoose';
import { GraphQLError } from 'graphql';
import { buildFormatError, INTERNAL_ERROR_MESSAGE } from '../../src/graphql/formatError';
import { ConfigurationError } from '../../src/utils/errors';
import { UnsafeUrlError } from '../../src/utils/safeFetch';
import { EmailRenderError } from '../../src/modules/email/email.render';

const formatError = buildFormatError(true);

/** What Apollo hands formatError: a GraphQLError wrapping whatever the resolver threw. */
function format(thrown: Error) {
  const wrapped = new GraphQLError(thrown.message, { originalError: thrown, path: ['field'] });
  return formatError(wrapped.toJSON(), wrapped);
}

describe('production error responses', () => {
  it('keeps a schema rule message, but not the value a cast could not read', () => {
    const validation = new mongoose.Error.ValidationError();
    validation.addError(
      'currency',
      new mongoose.Error.ValidatorError({ message: 'XYZ is not an ISO 4217 currency code' }),
    );
    expect(format(validation)).toMatchObject({
      message: 'XYZ is not an ISO 4217 currency code',
      extensions: { code: 'BAD_USER_INPUT' },
    });

    const cast = new mongoose.Error.CastError('ObjectId', 'secret-looking-value', '_id');
    const formatted = format(cast);
    expect(formatted).toMatchObject({ message: 'Invalid value for _id' });
    expect(JSON.stringify(formatted)).not.toContain('secret-looking-value');
  });

  it('shows messages written for a person: template, unsafe URL, missing integration', () => {
    expect(format(new EmailRenderError('No email template with the key "x".')).message).toBe(
      'No email template with the key "x".',
    );
    expect(format(new UnsafeUrlError('That address points inside our network')).extensions).toEqual(
      { code: 'BAD_USER_INPUT' },
    );
    expect(format(new ConfigurationError('No active email configuration.'))).toMatchObject({
      message: 'No active email configuration.',
      extensions: { code: 'FAILED_PRECONDITION' },
    });
  });

  it('still hides anything else behind a correlation id', () => {
    const formatted = format(new Error('connection to mongo-7:27017 refused'));
    expect(formatted.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(formatted.extensions?.correlationId).toEqual(expect.any(String));
  });
});
