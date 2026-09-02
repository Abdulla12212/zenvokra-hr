export function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter((part) => part.length > 0);
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : undefined;

  if (!first) {
    return '?';
  }

  const firstLetter = first[0];
  const lastLetter = last?.[0];

  if (!firstLetter) {
    return '?';
  }

  return `${firstLetter}${lastLetter ?? ''}`.toUpperCase();
}
