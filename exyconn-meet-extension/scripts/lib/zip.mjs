import { deflateRawSync } from 'node:zlib';
import { crc32 } from './crc32.mjs';

/** 1980-01-01 00:00:00 in MS-DOS format: every entry gets it, so builds are byte-identical. */
const DOS_TIME = 0;
const DOS_DATE = (0 << 9) | (1 << 5) | 1;

function localHeader(name, entry) {
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4); // version needed
  header.writeUInt16LE(0x0800, 6); // UTF-8 names
  header.writeUInt16LE(8, 8); // deflate
  header.writeUInt16LE(DOS_TIME, 10);
  header.writeUInt16LE(DOS_DATE, 12);
  header.writeUInt32LE(entry.crc, 14);
  header.writeUInt32LE(entry.compressed.length, 18);
  header.writeUInt32LE(entry.size, 22);
  header.writeUInt16LE(name.length, 26);
  header.writeUInt16LE(0, 28);
  return Buffer.concat([header, name]);
}

function centralHeader(name, entry) {
  const header = Buffer.alloc(46);
  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4); // version made by
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0x0800, 8);
  header.writeUInt16LE(8, 10);
  header.writeUInt16LE(DOS_TIME, 12);
  header.writeUInt16LE(DOS_DATE, 14);
  header.writeUInt32LE(entry.crc, 16);
  header.writeUInt32LE(entry.compressed.length, 20);
  header.writeUInt32LE(entry.size, 24);
  header.writeUInt16LE(name.length, 28);
  header.writeUInt32LE(entry.offset, 42);
  return Buffer.concat([header, name]);
}

/**
 * A deterministic ZIP: entries sorted by path, fixed timestamps, deflated, no extra fields —
 * the same input always produces the same bytes (and the same sha256).
 * `files` is a list of { path, data }, paths relative with forward slashes.
 */
export function createZip(files) {
  const sorted = [...files].sort((a, b) => (a.path < b.path ? -1 : 1));
  const parts = [];
  const central = [];
  let offset = 0;
  for (const file of sorted) {
    const name = Buffer.from(file.path, 'utf8');
    const data = Buffer.from(file.data);
    const entry = {
      crc: crc32(data),
      size: data.length,
      compressed: deflateRawSync(data, { level: 9 }),
      offset,
    };
    const local = localHeader(name, entry);
    parts.push(local, entry.compressed);
    central.push(centralHeader(name, entry));
    offset += local.length + entry.compressed.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(sorted.length, 8);
  end.writeUInt16LE(sorted.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}
