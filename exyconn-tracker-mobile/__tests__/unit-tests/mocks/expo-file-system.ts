/**
 * `expo-file-system`: an in-memory disk keyed by uri. `fileSystemTest.files` shows what was
 * written; `fileSystemTest.clear()` wipes it (the setup file does after each test).
 */
const files = new Map<string, string>();
const directories = new Set<string>();

type Parent = string | Directory;

function join(parent: Parent, name: string): string {
  const base = typeof parent === 'string' ? parent : parent.uri;
  return `${base.replace(/\/$/, '')}/${name}`;
}

export class Directory {
  readonly uri: string;

  constructor(parent: Parent, name: string) {
    this.uri = join(parent, name);
  }

  get exists(): boolean {
    return directories.has(this.uri);
  }

  create(options?: { intermediates?: boolean; idempotent?: boolean }): void {
    if (this.exists && options?.idempotent !== true) {
      throw new Error(`Directory ${this.uri} already exists.`);
    }
    directories.add(this.uri);
  }
}

export class File {
  readonly uri: string;

  constructor(parent: Parent, name: string) {
    this.uri = join(parent, name);
  }

  get exists(): boolean {
    return files.has(this.uri);
  }

  create(options?: { overwrite?: boolean }): void {
    if (this.exists && options?.overwrite !== true) {
      throw new Error(`File ${this.uri} already exists.`);
    }
    files.set(this.uri, '');
  }

  write(contents: string): void {
    files.set(this.uri, contents);
  }

  textSync(): string {
    const contents = files.get(this.uri);
    if (contents === undefined) {
      throw new Error(`File ${this.uri} does not exist.`);
    }
    return contents;
  }

  delete(): void {
    files.delete(this.uri);
  }
}

export const Paths = { document: 'file:///document', cache: 'file:///cache' };

export const fileSystemTest = {
  files,
  directories,
  clear() {
    files.clear();
    directories.clear();
  },
};
