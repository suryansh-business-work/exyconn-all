import { useSearchParams } from 'react-router-dom';
import { connectedOnly, selectedAccountIds, withAccountIds } from './calendar.selection';

/**
 * The accounts the calendar shows, kept in the address (`?accounts=a,b`) so the choice
 * survives a reload and the back button. None chosen means every account; an account in
 * the address that is no longer connected is ignored.
 */
export function useCalendarAccounts(accounts: readonly { id: string }[]) {
  const [params, setParams] = useSearchParams();
  return {
    selected: connectedOnly(selectedAccountIds(params), accounts),
    choose: (ids: readonly string[]) => setParams(withAccountIds(params, ids)),
  };
}
