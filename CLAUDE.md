# Knowledge Nexus: plataforma de estudo (repositório da aplicação)

Plataforma web que reúne o material de estudo de cursos do ensino superior. A peça
central é o **depósito**: o utilizador envia tudo sem organizar, e o sistema identifica,
deduplica, extrai, classifica e arruma cada ficheiro. As fases seguintes geram material
de estudo a partir daí. Mantém este ficheiro actualizado sempre que mudares arquitectura,
convenções ou comandos.

## Arquitectura ("só GitHub", decisão da fase 1)

- **Este repositório é PÚBLICO** e só tem código e exemplos fictícios. O GitHub Pages
  publica `frontend/` em https://knowledge-nexus.github.io.
- **Os dados vivem num repositório PRIVADO do utilizador** (ex.: `Knowledge-Nexus/estudo-dados`),
  criado com `nexus scaffold` ou pelo assistente da interface.
- **O pipeline corre no GitHub Actions do repositório de dados.** O workflow
  `.github/workflows/nexus.yml` dele chama o reutilizável `.github/workflows/pipeline.yml`
  daqui. Também pode correr localmente ou numa sessão do Claude Code.
- **Material público (opcional):** o que o dono marca como público (por cadeira ou por
  documento) é publicado por `nexus publicar` num repositório PÚBLICO à parte
  (`publishing.public_repo`, ex.: `estudo-publico`), servido pelo Pages em `/<nome>/` e
  lido pela interface em `#/publico` sem token (`data/public.ts`). Um só commit,
  reescrito a cada vez; sem nada pessoal. Código: `nexus/public.py`, `domain/visibility.py`.
- **A interface fala directamente com a API do GitHub**, com um token fine-grained que fica
  só no browser.
  - **Leitura:** índices SQLite do ramo `indices`, lidos com SQLite em WebAssembly.
  - **Escrita:** commits (depósito, correcções e pedidos de catálogo).
  - **Ficheiros grandes (> 10 MB):** a API recusa blobs grandes, por isso a interface e o
    `nexus vigiar` enviam-nos em partes (`*.nexus-part-NNNN` + `*.nexus-parts.yaml`) e o
    motor junta-as e confirma o SHA-256 (`Pipeline._intake_parts`). Limite final: 95 MB.
- **Fonte de verdade: ficheiros YAML/Markdown no repositório de dados.** As bases SQLite
  são derivadas e reconstruídas a cada execução.
- **Fase 5 (outros utilizadores):** backend próprio. Pontos de troca preparados:
  - `DataSource` no frontend;
  - `BlobStore` e `SearchBackend` no Python;
  - esquema SQLAlchemy com baseline Alembic.

Detalhes: `docs/arquitectura.md`, `docs/repo-dados.md`, `docs/modelo-dados.md`,
`docs/decisoes.md`, `docs/configuracao.md`.

## Regras que nunca se quebram

1. **Nunca pôr material real neste repositório.** As amostras de teste são fictícias e
   geradas em tempo de execução (`tests/amostras/gerar.py`). Há uma guarda para isso:
   `scripts/guarda-binarios.sh`.
2. **O repositório de dados tem de ser privado.** A interface, o `nexus vigiar` e o
   workflow recusam repositórios públicos. A fronteira de segurança é o repositório.
   **Só sai dele o que o dono marcou como público** (nunca por defeito, nunca pelo
   pipeline ou pela IA), e só para o repositório público configurado.
3. **Os originais (`originais/`) nunca são alterados nem apagados.** O que é derivado
   (`texto/`, índices, versões PDF) pode ser regenerado.
4. **O pipeline é idempotente.** Correr duas vezes sobre o mesmo estado não produz
   diferenças: a escrita é determinística e só acontece se o conteúdo mudar, e as datas
   só mudam nas transições de estado.
5. **Deduplicação por SHA-256.** O mesmo conteúdo é guardado uma vez, mas cada
   utilizador tem a sua cópia lógica (`documentos/<id>.yaml`). Os quase-duplicados são
   marcados, nunca descartados.
6. **Nunca arrumar à sorte.** Com confiança abaixo do limiar, o documento vai para
   "A rever", com justificação (códigos i18n) e alternativas.
7. **O pipeline nunca sobrepõe campos definidos pelo utilizador** (`method: user`) nem
   pela IA (`ai:*`).
8. **Tudo o que a IA gera fica marcado** (`ai:<agente>`) e liga à fonte (sha256 + página).
9. **Nada sobre cursos fica fixo no código.** Instituições, cursos, cadeiras, tipos de
   documento, avaliações e épocas são dados (`config/vocabularios.yaml` e `catalogo/`).
   O código só usa atributos dos termos (`is_assessment`, `role`, `extensions`…), nunca slugs.
10. **O modo tutor é o comportamento por defeito** nas ferramentas de estudo.

## Estrutura

```
backend/nexus/     motor Python (pacote `nexus`, CLI `nexus`)
  domain/          registos Pydantic (extra="allow"), normalização de texto
  datarepo/        layout do repo de dados, YAML determinístico, catálogo, git
  pipeline/        intake → unpack → extract/ → classify/ → filing → run.py (reconciliação)
  index/           schema.py (SQLAlchemy), builder, search.py (FTS5), alembic/
  scaffold/        template do repositório de dados (workflow, skills, hook, CLAUDE.md)
  github/          cliente da API + `nexus vigiar`
  publish.py       processar + commit + push seguro + ramo indices
config/            predefinicoes.yaml, vocabularios.yaml, catalogo/exemplo.yaml, i18n/
frontend/src/      data/ (DataSource, github/, sqlite/), features/, components/, i18n/
tests/             backend/, contrato/ (Python↔TS), e2e/ (gerador), amostras/
docs/              arquitectura, modelo de dados, repositório de dados, decisões, configuração
```

## Comandos

| Objectivo | Comando |
|---|---|
| Instalar | `uv sync --python 3.12` e `pnpm -C frontend install` |
| Interface local (+ watcher opcional) | `./iniciar` |
| Tudo (lint, tipos, testes) | `./iniciar verificar` |
| Backend | `uv run ruff check . && uv run mypy && uv run pytest -q` |
| Frontend | `pnpm -C frontend lint && pnpm -C frontend typecheck && pnpm -C frontend test` |
| Índice de contrato | `uv run python tests/contrato/gerar_indice.py frontend/test-fixtures/contrato` |
| E2E | `uv run python tests/e2e/gerar_repo.py frontend/test-fixtures/e2e/repo.json && pnpm -C frontend e2e` |
| E2E neste contentor | prefixar com `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium` |
| Ferramentas de sistema | `uv run nexus verificar` |
| Repositório de dados novo | `uv run nexus scaffold <pasta> --dono <login>` |
| Pipeline local | `uv run nexus processar --repo <pasta> [--sem-push]` |
| Pesquisa local | `uv run nexus pesquisar "consulta" --repo <pasta>` |
| Exportar árvore | `uv run nexus exportar-arvore <destino> --repo <pasta>` |
| Visibilidade | `uv run nexus visibilidade cadeira <inst>/<cadeira> publico\|privado --repo <pasta>` |
| Publicar o material público | `NEXUS_PUBLICO_TOKEN=… uv run nexus publicar --repo <pasta>` |

Dependências de sistema (Ubuntu/WSL2):
- `tesseract-ocr tesseract-ocr-por tesseract-ocr-eng`
- `pandoc`
- `libreoffice-writer-nogui libreoffice-impress-nogui libreoffice-calc-nogui`
- `libarchive-tools` ou `p7zip-full` (para .rar)

## Convenções

- **Línguas:**
  - Código, identificadores e chaves YAML em inglês.
  - Interface, CLI, commits do motor e documentação em **pt-PT com a grafia pré-Acordo**:
    projecto, lectivo, actual, correcção, direcção, óptimo, recepção.
  - **Nunca PT-BR:** ficheiro (não arquivo), ecrã (não tela), utilizador (não usuário),
    carregar/enviar (não fazer upload), definições (não configurações), equipa (não time),
    telemóvel (não celular).
  - A classificação aceita sempre as duas grafias, porque `normalize()` as unifica.
  - **Nunca usar o travessão "—"** em textos (interface, documentação, commits, respostas):
    usar vírgula, dois pontos, parênteses ou ponto. O motor continua a reconhecê-lo no
    texto dos documentos.
  - Na interface e na documentação diz-se **"cadeira"**, nunca "UC" (confunde-se com
    Universidade de Coimbra). No código e nas chaves continua `unit`.
- **Identidade visual (a do banner: pergaminho, azul-marinho e dourado):**
  - Tokens de cor e tipografia em `frontend/src/styles.css` (`@theme`): paper, sheet, line, ink,
    pen (azul-marinho), navy (barra lateral e entrada), gold/marker (dourado), sage, clay.
    Classes `.leather` (superfície azul com textura) e `.gilt-frame` (filete dourado).
    Usar sempre os tokens, nunca cores soltas.
  - Marca e títulos curtos em Cinzel (`font-display`, letras romanas como no banner);
    títulos e texto dos documentos em serifa (Source Serif 4); a interface em Inter. As
    fontes são servidas pelo próprio site (`@fontsource`), por causa da CSP.
  - Para quem chega pela primeira vez: "Primeiros passos" no Início e a página
    "Como funciona" (`/ajuda`, textos em `guide.*`).
  - Componentes base em `components/ui.tsx` (`Button`/`buttonClass`, `Card`, `PageHeader`,
    `Badge`, `ConfidenceBadge`…) e ícones de traço em `components/icons.tsx`.
  - Marca: ficheiros em `frontend/public/brand/`, configurados em `BRAND` (`components/Brand.tsx`).
  - **A IA é discreta:** nada de "IA" em destaque. A certeza aparece em pontos e palavras
    (certeza alta/média/baixa), nunca em percentagens, e o que é gerado mostra "sugestão
    automática" com explicação no tooltip. Continua sempre marcado e ligado à fonte (regra 8).
- **Textos da interface:** `frontend/src/i18n/pt-PT.json`. As justificações da
  classificação estão em `config/i18n/pt-PT/reasons.json` (código → texto). Nunca
  escrever texto visível directamente num componente.
- **Python:** 3.12, uv, ruff (linhas até 100), mypy.
  - Os registos persistidos derivam de `nexus.domain.common.Record`.
  - Escrever sempre com `write_*_if_changed` e ler o relógio com `nexus.clock.now()`.
- **TypeScript:**
  - React 19, TanStack Query, react-router (HashRouter) e Biome.
  - Nenhum HTML cru: Markdown sem HTML e excertos da pesquisa em pedaços.
  - A CSP em `index.html` só permite `connect-src` para `api.github.com`.
- **Mudar o esquema do índice:**
  - subir `SCHEMA_VERSION` (`index/schema.py`);
  - actualizar `frontend/src/data/sqlite/queries.ts` e `SUPPORTED_SCHEMA_VERSION`;
  - regenerar o contrato;
  - criar uma revisão Alembic em `backend/nexus/index/alembic/versions/`.
- **Mudar o formato dos ficheiros do repositório de dados:** subir `FORMAT_VERSION`
  (`nexus/__init__.py`) e registar a migração em `nexus/formats`.
- **Novo tipo de documento, avaliação ou época:** só dados (`config/vocabularios.yaml`),
  sem código.
- **Novo extractor ou alteração de um:** subir a versão desse extractor (provoca nova
  extracção) e acrescentar um teste com uma amostra gerada.
- **Mudança relevante na lógica de classificação:** subir `CLASSIFIER_VERSION`. Isso
  reclassifica o que não foi revisto pelo utilizador.
- **Testes:**
  - Os que precisam de ferramentas usam `requires_ocr`, `requires_soffice` e
    `requires_pandoc` (`tests/backend/conftest.py`).
  - O GitHub simulado para testes é `frontend/src/data/github/fake.ts`.

## Claude Code

- **Aqui:** `.claude/settings.json` com permissões para os comandos do projecto.
- **No repositório de dados** (template em `backend/nexus/scaffold/template/.claude/`):
  - skills `/processar-deposito`, `/rever-classificacoes` e `/inferir-catalogo`;
  - hook SessionStart que instala o `nexus` e as ferramentas;
  - para as actualizar: `nexus scaffold <repo> --dono <login> --actualizar`.
- **Fase 2:** `/enriquecer`, `/extrair-perguntas` e `/transcrever`.

## Estado das fases

- **Fase 1 (concluída):** motor (etapas 1 a 5), índices, CLI, workflows, interface
  (ligação, configuração, início, depósito, biblioteca, documento, A rever, pesquisa),
  `nexus vigiar`, testes (backend, contrato, E2E).
- **Fase 2:** enriquecimento por skills, transcrição de manuscritos e matemática
  (páginas `needs_ai_transcription`), banco de perguntas.
- **Fase 3:** páginas das cadeiras, pesquisa semântica (sqlite-vec / transformers.js),
  flashcards FSRS, simulados.
- **Fase 4:** restantes ferramentas.
- **Fase 5:** abertura a outros utilizadores (backend, autenticação, grupos, limites de IA),
  partilha por utilizador ou por ligação (valores `user:<login>` e `link` já reservados).
