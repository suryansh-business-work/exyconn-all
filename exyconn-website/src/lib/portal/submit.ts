import { portalRequest } from './client';

const CREATE_SUBMISSION = `
  mutation CreateWebsiteSubmission($input: WebsiteSubmissionInput!) {
    createWebsiteSubmission(input: $input) {
      id
    }
  }
`;

/**
 * Persists a website form submission to the portal, where it lands in the
 * Website > Form Submissions inbox. Returns the new submission id.
 */
export async function submitForm(
  formType: string,
  data: Record<string, string>,
): Promise<string | undefined> {
  const result = await portalRequest<{ createWebsiteSubmission: { id: string } }>(
    CREATE_SUBMISSION,
    { input: { formType, source: 'website', submissionData: data } },
  );

  return result.createWebsiteSubmission?.id;
}
