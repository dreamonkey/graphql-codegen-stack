export const toPascalCase = (str: string) =>
  str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Unindents a string by a given number of spaces (default 4)
 * and removes the first and last line (which are empty)
 */
export const unindent = (str: string, level = 4) =>
  str
    .split('\n')
    .slice(1, -1)
    .map((line) => line.slice(level))
    .join('\n');

export const uniqueArray = <T>(arr: T[]) => Array.from(new Set(arr));
