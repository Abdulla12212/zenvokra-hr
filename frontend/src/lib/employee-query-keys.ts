/**
 * Shared prefix so a punch or leave mutation can refresh Inbox without features
 * importing each other.
 */
export const employeeAppKeys = {
  all: ['employee-app'] as const,
};
