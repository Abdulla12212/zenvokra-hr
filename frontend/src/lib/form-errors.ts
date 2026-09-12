import { ApiError } from '@/lib/api-client';

/**
 * Finds the message to show on one field: either a server validation error for it, or
 * a conflict, which is always about the value the user just typed.
 *
 * Field names are compared case-insensitively because the server reports them in
 * PascalCase ("Name") while the form uses camelCase.
 */
export function firstFieldMessage(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) {
    return undefined;
  }

  const match = Object.entries(error.fieldErrors).find(
    ([key]) => key.toLowerCase() === field.toLowerCase(),
  );

  const serverMessage = match?.[1][0];

  if (serverMessage) {
    return serverMessage;
  }

  return error.status === 409 ? error.message : undefined;
}
