/**
 * Email verification (CRM > Tools > Email verifier): one address at a time, or a CSV in the
 * background, through the Reacher backend (github.com/reacherhq/check-if-email-exists). Every
 * email in the CRM shows its latest result.
 */
export { emailVerificationTypeDefs } from './email-verification.typeDefs';
export { emailVerificationResolvers } from './email-verification.resolvers';
export { startEmailVerification } from './email-verification.worker';
