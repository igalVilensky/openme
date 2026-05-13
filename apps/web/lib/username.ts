export function normalizeUsernameSlug(segment: string): string {
  return decodeURIComponent(segment).replace(/^@+/, "");
}

export function formatHandle(usernameSlug: string): string {
  return `@${usernameSlug}`;
}
