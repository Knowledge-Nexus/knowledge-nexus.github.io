// Cache dos ficheiros de índice no IndexedDB, por SHA-256 (conteúdo imutável).
// É uma optimização: qualquer falha (modo privado, quota) degrada para sem cache.

const DB_NAME = "nexus-cache";
const STORE = "indices";
const MAX_ENTRIES = 6;

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined") return resolve(null);
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

interface Entry {
  bytes: Uint8Array;
  at: number;
}

export async function getCached(sha256: string): Promise<Uint8Array | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const request = db.transaction(STORE).objectStore(STORE).get(sha256);
      request.onsuccess = () => resolve((request.result as Entry | undefined)?.bytes ?? null);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function putCached(sha256: string, bytes: Uint8Array): Promise<void> {
  const db = await openDb();
  if (!db) return;
  try {
    const store = db.transaction(STORE, "readwrite").objectStore(STORE);
    store.put({ bytes, at: Date.now() } satisfies Entry, sha256);
    const keys = store.getAllKeys();
    keys.onsuccess = () => {
      const all = keys.result as string[];
      if (all.length > MAX_ENTRIES) {
        for (const key of all.slice(0, all.length - MAX_ENTRIES)) {
          if (key !== sha256) store.delete(key);
        }
      }
    };
  } catch {
    // sem cache
  }
}

export async function clearCache(): Promise<void> {
  const db = await openDb();
  try {
    db?.transaction(STORE, "readwrite").objectStore(STORE).clear();
  } catch {
    // nada a fazer
  }
}
