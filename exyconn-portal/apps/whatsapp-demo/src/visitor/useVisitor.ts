import { useWhatsappDemoVisitorMeQuery } from '@exyconn/shell/graphql/generated';
import { hasVisitorPass } from './visitorPass';

/**
 * The signed-in demo visitor, or null. Asks only when a pass is held; a pass the server no
 * longer honours (blocked, deleted) answers null, which sends the visitor back to sign-in.
 */
export function useVisitor() {
  const skip = !hasVisitorPass();
  const { data, loading } = useWhatsappDemoVisitorMeQuery({ skip, fetchPolicy: 'cache-first' });
  return { visitor: data?.whatsappDemoVisitorMe ?? null, loading: !skip && loading };
}
