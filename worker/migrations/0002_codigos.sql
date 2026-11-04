-- Códigos de acesso KN1-… do dono, cifrados (worker/src/codes.js). O Worker também cria a
-- tabela sozinho, por isso esta migração só serve para repositórios novos.
CREATE TABLE IF NOT EXISTS access_codes (
  repo TEXT NOT NULL,
  id TEXT NOT NULL,
  code TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (repo, id)
);
