const tasks = new Set<() => void>();

// Callbacks rather than a counter in a store: a counter is state, and bumping it re-renders
// every subscriber, including the screens that have nothing to refetch. Freshness stays where
// it already lives - each store compares its own timestamp and skips the request.
export function onRevalidate(task: () => void): () => void {
  tasks.add(task);
  return () => tasks.delete(task);
}

export function revalidate(): void {
  for (const task of tasks) task();
}
