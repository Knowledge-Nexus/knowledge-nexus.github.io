// D1 de teste: o mesmo SQL num SQLite em memória (node:sqlite), com a API do Cloudflare.

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const migrations = resolve(import.meta.dirname, "../migrations");

export function fakeD1() {
  const db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  for (const file of readdirSync(migrations).sort()) {
    db.exec(readFileSync(resolve(migrations, file), "utf-8"));
  }
  const statement = (sql, args = []) => {
    for (const arg of args) {
      if (arg === undefined) throw new Error(`D1_TYPE_ERROR: undefined em ${sql}`);
    }
    const plain = (row) => (row ? { ...row } : null);
    return {
      bind: (...values) => statement(sql, values),
      first: async () => plain(db.prepare(sql).get(...args)),
      all: async () => ({ results: db.prepare(sql).all(...args).map(plain) }),
      run: async () => ({ meta: { changes: Number(db.prepare(sql).run(...args).changes) } }),
      runNow: () => db.prepare(sql).run(...args),
    };
  };
  return {
    raw: db,
    prepare: (sql) => statement(sql),
    async batch(list) {
      db.exec("BEGIN");
      try {
        for (const item of list) item.runNow();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return list.map(() => ({ meta: {} }));
    },
  };
}
