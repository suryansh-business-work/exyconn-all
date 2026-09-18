import { AccessPage } from './AccessPage';

/** IT › Access Management: application access requests, role changes and revocations. */
export function AccessManagementPage() {
  return (
    <AccessPage
      title="Access Management"
      subtitle="Application access, role changes and revocations — approved, then carried out"
      entityLabel="access request"
    />
  );
}
