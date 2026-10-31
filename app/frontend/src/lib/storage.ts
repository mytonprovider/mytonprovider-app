// Storage can be off limits: with site data blocked, touching localStorage throws instead of
// returning nothing, and the throw takes the whole app down through the error boundary.
export function readLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    return;
  }
}
