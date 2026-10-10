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
  lido pela interface em `#/publico` sem token (`data/public.ts`). Ordem da visibilidade:
  documento → tipo na cadeira (`sharing.types["<cadeira>::<tipo>"]`) → cadeira → privado. Um só commit,
  reescrito a cada vez; sem nada pessoal. Código: `nexus/public.py`, `domain/visibility.py`.
- **A interface fala directamente com a API do GitHub**, com um token fine-grained que fica
  só no browser.
  - **Leitura:** índices SQLite do ramo `indices`, lidos com SQLite em WebAssembly.
  - **Escrita:** commits (depósito, correcções e pedidos de catálogo).
  - **Ficheiros grandes (> 10 MB):** a API recusa blobs grandes, por isso a interface e o
    `nexus vigiar` enviam-nos em partes (`*.nexus-part-NNNN` + `*.nexus-parts.yaml`) e o
    motor junta-as e confirma o SHA-256 (`Pipeline._intake_parts`). Limite final: 95 MB.
  - **Muitos ficheiros (≥ 20):** a API limita os pedidos que criam conteúdo (~80/min,
    500/hora), por isso a interface envia-os em lotes zip (`_lote-NNN.nexus-lote.zip`,
    em partes se preciso; `buildLotes` em `data/source.ts`) e o motor abre-os antes de
    tudo, como se tivessem vindo um a um (`pipeline/lotes.py`). O cliente da API volta a
    tentar em falhas de rede, limites de ritmo e erros 5xx.
- **Originais no Cloudflare R2 (opcional):** com `storage.backend: r2`, os originais novos vão
  para o R2 (`storage/r2.py`, `HybridBlobStore`: lê do git ou do R2, grava no R2); a interface
  descarrega-os pelo Worker (`worker/`), que valida o token do GitHub no repositório privado.
  Credenciais `NEXUS_R2_*` só no ambiente (segredos no Actions); o cliente só é criado quando
  é preciso. Migração: `nexus migrar-blobs`.
- **Processamento: Actions ou local.** A quota de minutos do Actions num repositório privado
  esgota-se com OCR de depósitos grandes. `nexus servir` processa no computador do dono e
  marca os seus commits com `[skip ci]`; a variável `NEXUS_PROCESSAMENTO=local` no repositório
  de dados desliga o job (`if:` no `nexus.yml`). Sem nada no depósito, o workflow não instala
  o OCR e só publica os índices se estiverem desactualizados. Quando a aplicação tem commits
  novos, o `nexus servir` sai com o código 75 (`UPDATE_EXIT`) e o `vigiar-deposito.bat` faz
  `git pull` e volta a arrancá-lo.
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
   Nada pode depender da ordem de um `set`/`frozenset` (muda com a semente de hash de cada
   processo: os empates desempatam por slug) nem de escolhas que mudam a meio da execução
   (o principal de um conjunto mantém-se enquanto estiver arrumado).
5. **Deduplicação por SHA-256.** O mesmo conteúdo é guardado uma vez, mas cada
   utilizador tem a sua cópia lógica (`documentos/<id>.yaml`). Os quase-duplicados são
   marcados, nunca descartados.
6. **Nunca arrumar à sorte.** Com confiança abaixo do limiar, o documento vai para
   "A rever", com justificação (códigos i18n) e alternativas.
   Única excepção, se o dono a escolher (`file_uncertain_type`): com a cadeira certa, o tipo
   em dúvida não prende o documento, que fica marcado «tipo por confirmar».
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
| Processar sozinho (sem Actions) | `uv run nexus servir --repo <pasta> [--intervalo 60]` |
| Publicar índices (só se desactualizados) | `uv run nexus publicar-indices --repo <pasta> [--forcar]` |
| Pesquisa local | `uv run nexus pesquisar "consulta" --repo <pasta>` |
| Exportar árvore | `uv run nexus exportar-arvore <destino> --repo <pasta>` |
| Visibilidade | `uv run nexus visibilidade cadeira <inst>/<cadeira> publico\|privado --repo <pasta>` |
| Visibilidade de um tipo | `uv run nexus visibilidade tipo <inst>/<cadeira> <tipo> publico\|privado\|cadeira --repo <pasta>` |
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
  - Sem sessão, a entrada do site é a biblioteca pública (`#/publico`); o ecrã de
    ligação está em `#/entrar` (botão "Entrar" no menu).
  - Nas listas, o título vem da classificação (`lib/titles.ts`: "Exame · Época de recurso")
    e a data e o nome original ficam na linha secundária; o formato aparece em
    `FileBadge` (cores `--color-file-*`). O original (PDF, versão PDF ou imagem) e o texto
    vêem-se com `components/DocumentViewer.tsx` (documento e «A rever»). Descarga em zip no
    browser: `lib/download.ts`
    (fflate, sem compressão).
  - Biblioteca em estantes curso → ano (`features/library/Shelves.tsx`): as cadeiras
    arrastam-se para os cursos e anos (ficam também onde estavam); arrastar para fora de
    um curso tira-as dele. Os cursos propostos pelo material aparecem como estantes e
    criam-se ao largar uma cadeira. As cadeiras sem curso ficam numa lista à direita (fixa
    ao deslocar), para se arrastarem. Os cursos mostram-se sem o grau ("Engenharia
    Informática"; `courseTitle`/`degreeOf` em `lib/reference.ts`), e um curso novo é gravado
    assim, com o grau em `degree`. Cor de cada curso (só no nome): a cor tradicional da área (fitas de
    Coimbra, `course_colors` em `data/reference/pt.json`, `lib/courseColors.ts`), com tons
    diferentes para cursos da mesma cor; as cadeiras mantêm a cor estável pelo nome. A
    biblioteca (e a pública) usa a largura toda do ecrã (`Main` em `components/Layout.tsx`).
  - Depositar (`features/upload/UploadPage.tsx`): as cópias (mesmo SHA-256, qualquer nome)
    são detectadas logo ao escolher os ficheiros, repetidas na selecção ou já na biblioteca
    do utilizador (`ownedSha`), e não são enviadas (opção "Enviar também as cópias" envia só
    a referência).
  - Cursos de cada cadeira: "Editar cursos" na cadeira ou "Organizar por curso" na
    Biblioteca (`features/library/UnitCourses.tsx`); grava um pedido de catálogo com a
    lista completa das cadeiras de cada curso alterado (o motor só escreve os campos que
    o pedido traz).
  - Ao registar instituição, curso ou cadeira há sugestões (`components/SuggestInput.tsx`,
    `lib/reference.ts`): o catálogo, as propostas e a lista de referência
    `frontend/src/data/reference/pt.json` (instituições portuguesas, graus, cursos comuns).
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
  - criar uma revisão Alembic em `backend/nexus/index/alembic/versions/`;
  - manter `MIN_SCHEMA_VERSION` a ler o esquema anterior (índices ainda por reconstruir),
    com a cópia `meta-v3.db` do contrato.
- **Mudar o formato dos ficheiros do repositório de dados:** subir `FORMAT_VERSION`
  (`nexus/__init__.py`) e registar a migração em `nexus/formats`.
- **Novo tipo de documento, avaliação ou época:** só dados (`config/vocabularios.yaml`),
  sem código.
- **Novo extractor ou alteração de um:** subir a versão desse extractor (provoca nova
  extracção) e acrescentar um teste com uma amostra gerada.
- **Cadeiras numeradas são cadeiras diferentes:** "Análise Matemática" não corresponde a
  "Análise Matemática II" (nem "AM" a "AM_II"/"AM2"); os nomes das cadeiras comparam-se com
  `contains_unit_phrase` (`domain/text.py`), e uma continuação que ainda não existe gera
  uma proposta ("Análise Matemática II", sigla "AM II").
- **Conjuntos** (`pipeline/bundles.py`, campo `bundle` dos documentos): ficheiros que só
  fazem sentido juntos. O motor reconhece pastas de projecto (código + enunciado ou
  imagens) e o utilizador junta, separa, acrescenta ou retira ficheiros na interface
  (`lib/bundles.ts`, `components/BundleEditor.tsx`; editar torna o conjunto `method: user`). O principal é
  o que escolheste (`bundle.lead_choice`, "Tornar principal") ou, sem escolha, o do pipeline; os outros herdam dele a classificação (só campos heurísticos,
  razão `bundle.inherited`) e ficam arrumados como `<principal sem extensão>/<nome original>`.
  "Separar" grava `bundle_dismissed: true`.
- **Organização da origem** (`pipeline/layout.py`): em `<inst>/<AAAA_AAAA>/<Nº Semestre>/<cadeira>/…`
  a pasta do ano dá o ano lectivo e a seguinte ao semestre a cadeira (sinal `layout`, forte;
  se a cadeira não existir, proposta). O que está numa subpasta ou arquivo dentro da cadeira
  fica num conjunto; as pastas de tipo de material (nome que corresponde a um tipo de
  documento do vocabulário, ex.: "Material Prático") não agrupam, só ajudam no tipo.
- **Editar ou remover uma cadeira** (`features/library/UnitEditor.tsx`): pedido de catálogo
  com `units_remove: [{unit, merge_into?}]` (`remove_unit` em `datarepo/catalog_io.py`,
  `Pipeline._remove_unit`). Juntar passa os documentos, os cursos e os nomes (como nomes
  alternativos) para a outra; sem destino, os documentos voltam a ser classificados. Mudar o
  slug é criar a nova e remover a antiga com `merge_into`.
- **Acesso temporário** (`lib/invite.ts`, `features/setup/InviteCard.tsx`): nas Definições, o
  dono abre a página do GitHub já preenchida (`tokenPageUrl`: prazo, `contents=write`,
  `actions=read`; o repositório escolhe-se à mão) e cola o token; a interface gera um código
  `KN1-…` (base64url de repo + token + nome + prazo, NÃO cifrado: é tão secreto como o token).
  Quem o recebe entra em «Recebeste um código de acesso?»; a sessão fica com `guest`, aparece
  uma faixa com o nome e o prazo, e cada commit leva `Feito por: <nome> (acesso temporário)`.
  Acaba quando o token expira ou o dono o apaga no GitHub.
- **Mudar o tipo na biblioteca:** arrastar um documento (ou a selecção) para outro cartão de
  tipo na cadeira grava `document_type` com `method: user`.
- **Classificação (regras que evitam erros conhecidos):**
  - Siglas só como siglas: em maiúsculas e palavra inteira no texto original (`Signal.text`;
    "SO" ≠ "só"); as de 2 letras não contam no corpo do texto.
  - Todas as cadeiras competem; a inscrição só dá bónus (antes uma inscrita com um sinal
    fraco ganhava à pasta da cadeira). Uma cadeira que só aparece no texto (corpo ou
    cabeçalho, sem apoio no nome do ficheiro, nas pastas nem nos metadados) fica abaixo do
    limiar (`BODY_ONLY_MAX`, razões `unit.body_only` e `unit.text_only`): os livros falam de
    outras cadeiras logo na 1.ª página. Excepção: um cabeçalho que diz "Unidade Curricular:
    X" (`UNIT_LABEL_RE`). Pela mesma razão, uma cadeira rival que só aparece no texto pesa
    metade (`TEXT_RIVAL_WEIGHT`) contra a que o nome do ficheiro, as pastas ou os metadados
    confirmam.
  - Tipo: `producers` nos termos (programa que criou o PDF: PowerPoint → slides), sem sinal
    de enunciado/resolução o tipo não é penalizado, e `type_prior` (0.4) só para o tipo; a
    cadeira continua com `prior` (0.6).
  - A pasta da cadeira (organização da origem) que nomeia outra cadeira impede arrumar
    sozinho (razão `unit.other_folder`). A pasta tem de conter o nome, a sigla ou um nome
    alternativo da cadeira ("Programação" não é "Programação Orientada a Objectos"). Essa
    pasta pesa `source_weights.layout` (3.0): "AP1" no nome não lhe tira a certeza.
  - Um documento arrumado que volta a ficar em dúvida (regras novas, opção desligada) sai da
    cadeira: volta a `classified`, sem `filed_name`, até ser revisto.
  - Opção do dono `classification.file_uncertain_type` (no `nexus.yaml`): com a cadeira certa,
    arruma com o tipo em dúvida (no mais provável, ou "Outros") e marca `type.to_confirm`;
    na biblioteca aparece «tipo por confirmar», com filtro e «Confirmar o tipo» (grava o tipo
    actual como `user`). Por defeito, desligada (regra 6).
  - Pastas de arrumação sem significado (`neutral_folders` no vocabulário: "Geral",
    "Materiais diversos"…) contam como pastas de material: não juntam ficheiros num conjunto.
  - Medir antes de mudar: avaliar contra os campos `method: user` e contra as pastas da
    origem (cadeira) num repositório real; zero erros com certeza alta.
- **Propostas de catálogo** (`classify/proposals.py`): `acceptable()` recusa termos genéricos
  (`generic_terms` + palavras-chave do vocabulário), nomes de pessoas
  (`config/nomes-proprios.txt`), editoras e ruído de OCR; `_kind_of` reclassifica pela 1.ª
  palavra ("Licenciatura em …" → curso, "Centro de Estudos …" → instituição); títulos de
  provas ("Prova escrita de …") e "Curso de Formação …"; siglas só das pastas e que não sejam
  de nada do catálogo; continuações ("X II") só das pastas ou com numeração romana no nome do
  ficheiro. Cursos e instituições desconhecidos são propostos mesmo com outros no catálogo.
  Fora da organização da origem, a pasta onde está o ficheiro é proposta como cadeira quando
  o nome do ficheiro ou o início do texto a repete e tem duas palavras com significado
  (`folder_subjects`: "Direito Administrativo/manual direito administrativo.pdf").
  A cada execução, as propostas abertas que as regras já não criariam ficam rejeitadas e as
  de cadeiras que já existem ficam aceites (`Pipeline._close_known_proposals`).
- **Nomes alternativos acumulam:** nos pedidos de catálogo, `aliases` e `keywords` juntam-se
  aos existentes (`_ADDITIVE` em `catalog_io.py`); "Editar cadeira" acrescenta nomes
  alternativos (ex.: "Civil" para que a pasta «Civil» conte para "Direito Civil").
- **Vocabulário do repositório de dados:** `catalogo/vocabularios.yaml` substitui o da
  aplicação; ao mudar `config/vocabularios.yaml` (suba `version`), copiá-lo também para lá.
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
