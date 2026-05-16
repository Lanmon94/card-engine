let counter = 0;

export function generateId(): string {
  return `card-${Date.now()}-${counter++}-${Math.random().toString(36).slice(2, 8)}`;
}
