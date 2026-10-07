import { MyApprovalDelegationsDocument } from '@/graphql/generated';
import { answer } from '../../mockResult';

/** Cover the signed-in person has handed to somebody else. */
export function given(id: string, toName: string, active: boolean, note = '') {
  return {
    __typename: 'ApprovalDelegationGiven',
    id,
    toEmployeeId: `emp-${id}`,
    toName,
    fromDate: '2026-10-01T00:00:00.000Z',
    toDate: '2026-10-10T00:00:00.000Z',
    note,
    active,
  };
}

/** Cover the signed-in person is holding for somebody else. */
export function held(id: string, fromName: string, active: boolean, note = '') {
  return {
    __typename: 'ApprovalDelegationHeld',
    id,
    fromEmployeeId: `emp-${id}`,
    fromName,
    fromDate: '2026-10-01T00:00:00.000Z',
    toDate: '2026-10-10T00:00:00.000Z',
    note,
    active,
  };
}

/** One answer to the delegations query. */
export function delegations(
  givenRows: ReturnType<typeof given>[] = [],
  heldRows: ReturnType<typeof held>[] = [],
) {
  return answer(MyApprovalDelegationsDocument, {
    myApprovalDelegations: {
      __typename: 'ApprovalDelegations',
      given: givenRows,
      held: heldRows,
    },
  });
}
