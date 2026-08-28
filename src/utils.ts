export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/** Fisher-Yates shuffle — returns a new array, never mutates the input. */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = result[i];
    result[i] = result[j];
    result[j] = tmp;
  }
  return result;
}
