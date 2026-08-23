import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, letting later classes win over earlier ones.
 *
 * Plain string concatenation cannot do this: `"p-2 p-4"` leaves both classes in the
 * markup and the winner depends on stylesheet order. Always use this when a component
 * accepts a `className` prop.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
