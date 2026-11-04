-- Contas do Knowledge Nexus (Cloudflare D1). Aplicar com:
--   npx wrangler d1 migrations apply nexus-contas --remote

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  -- pbkdf2$<iterações>$<sal>$<resumo>; NULL para quem só entra com o Google
  password TEXT,
  google_sub TEXT UNIQUE,
  -- none (à espera) | viewer | reader | contributor | organizer | editor (worker/src/ranks.js)
  role TEXT NOT NULL DEFAULT 'none',
  -- active | paused
  status TEXT NOT NULL DEFAULT 'active',
  -- fim do acesso (ISO 8601); NULL = sem prazo
  until TEXT,
  created_at TEXT NOT NULL,
  last_seen_at TEXT
);

-- Só o SHA-256 do token da sessão (o token fica no browser de quem entrou).
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT
);
CREATE INDEX sessions_user ON sessions(user_id);

-- Convites: dão um papel (e um prazo) a quem se regista ou entra com eles. Uso único.
CREATE TABLE invites (
  id TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  label TEXT,
  until TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_by TEXT,
  used_at TEXT
);

-- Códigos de uso único: repor a palavra-passe (dado pelo dono) e a volta do Google.
CREATE TABLE tickets (
  code_hash TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  user_id TEXT,
  data TEXT,
  expires_at TEXT NOT NULL
);

-- Tentativas recentes (entrar, registar), para travar abusos.
CREATE TABLE attempts (
  key TEXT NOT NULL,
  at INTEGER NOT NULL
);
CREATE INDEX attempts_key ON attempts(key, at);

-- Marcas de leitura de cada conta, por documento (o mesmo JSON que `anotacoes/`).
CREATE TABLE marks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, document)
);
