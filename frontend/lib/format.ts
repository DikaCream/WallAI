export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

/** "@handle" when the wallet claimed one, otherwise a short address. */
export function displayName(handle: string | undefined | null, address: string): string {
  return handle ? `@${handle}` : shortAddress(address);
}

export function timeAgo(unixSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

// Deterministic pastel color per address for avatars.
export function addressHue(address: string): number {
  let hash = 0;
  for (let i = 2; i < address.length; i++) hash = (hash * 31 + address.toLowerCase().charCodeAt(i)) % 360;
  return hash;
}

export const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();
