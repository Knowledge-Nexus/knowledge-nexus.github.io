// SQLite em WebAssembly, só de leitura, em memória. O GitHub Pages não permite os
// cabeçalhos COOP/COEP (necessários ao OPFS do SQLite), por isso a base é aberta a partir
// dos bytes descarregados; a cache dos bytes fica no IndexedDB (ver ../cache.ts).

import sqlite3InitModule from "@sqlite.org/sqlite-wasm";

type Sqlite3 = Awaited<ReturnType<typeof sqlite3InitModule>>;
type Bind = Record<string, unknown> | unknown[];

let modulePromise: Promise<Sqlite3> | null = null;
let counter = 0;

export function sqlite(): Promise<Sqlite3> {
  modulePromise ??= sqlite3InitModule();
  return modulePromise;
}

interface OoDb {
  selectObjects(sql: string, bind?: unknown): Record<string, unknown>[];
  close(): void;
}

export class ReadonlyDb {
  private constructor(private readonly db: OoDb) {}

  static async open(bytes: Uint8Array): Promise<ReadonlyDb> {
    const sqlite3 = await sqlite();
    const path = `/nexus-${Date.now()}-${counter++}.db`;
    // Cópia para um Uint8Array "puro" (um Buffer do Node ou de outro realm é recusado).
    const data = new Uint8Array(bytes.byteLength);
    data.set(bytes);
    sqlite3.capi.sqlite3_js_posix_create_file(path, data);
    const db = new sqlite3.oo1.DB(path, "r") as unknown as OoDb;
    return new ReadonlyDb(db);
  }

  all<T>(sql: string, bind?: Bind): T[] {
    return this.db.selectObjects(sql, bind) as T[];
  }

  get<T>(sql: string, bind?: Bind): T | undefined {
    return this.all<T>(sql, bind)[0];
  }

  close() {
    this.db.close();
  }
}
