/** Hands a website form to the server route that forwards it on; throws when it is refused. */
export async function postFormSubmission(
  formType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch("/api/form-submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ formType, ...payload }),
  });
  if (!res.ok) throw new Error(`Form submission failed with status ${res.status}`);
}
