/** `275400` -> `3d 4h 30m`. Used for host, process and database uptimes alike. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) {
    return '—';
  }
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

/** A published port as `127.0.0.1:4004 → 4004/tcp`; unpublished ports show the inside only. */
export function formatPort(port: {
  ip: string;
  publicPort: number;
  privatePort: number;
  protocol: string;
}): string {
  const inside = `${port.privatePort}/${port.protocol}`;
  if (port.publicPort === 0) {
    return inside;
  }
  const host = port.ip ? `${port.ip}:${port.publicPort}` : String(port.publicPort);
  return `${host} → ${inside}`;
}
