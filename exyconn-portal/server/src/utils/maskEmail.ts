/** Shows enough of an address to recognise it without publishing it in full. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const head = local.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}
