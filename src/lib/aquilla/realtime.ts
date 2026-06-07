// Pure helpers for the realtime chat/status hooks — kept separate from React so
// the merge logic is unit-testable. Realtime can deliver an INSERT we already
// have (optimistic echo, reconnect replay), so appends must dedupe by id.

export function appendUniqueById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.some((x) => x.id === item.id) ? list : [...list, item];
}

export function sortByCreatedAt<T extends { created_at: string }>(list: T[]): T[] {
  return [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
}
