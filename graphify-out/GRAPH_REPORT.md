# Graph Report - knowledge-nexus.github.io  (2026-11-21)

## Corpus Check
- 236 files · ~170,614 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3199 nodes · 9835 edges · 125 communities (103 shown, 22 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 968 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `89280037`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Testes do pipeline
- LibraryPage.tsx
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- _repo
- Record
- nexus vigiar e API GitHub
- r2.py
- read_yaml
- AccountsManager.tsx
- ocr.py
- raspberry-pi/instalar.sh
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- write_yaml_if_changed
- ui.tsx
- pathlib
- classification
- source.ts
- Testes da classificação
- Reason
- MetaIndex
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- Recepção do depósito
- react-i18next
- Visor de documentos e PDF
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- types.ts
- Workflow de CI
- Credencial GitHub do Worker
- json
- proxy.js
- extract_file
- User
- Layout e ajuda
- Projectos de código
- GitRepoBlobStore
- sqlalchemy
- test_public.py
- Configuração do Biome
- Material público num repositório público à parte
- bundles.py
- Gestão dos acessos
- Depositar ficheiros
- test_serve.py
- remove_course
- Dependências de desenvolvimento
- config.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- app-ref
- publish.py
- raspberry-pi/instalar.sh
- Documento (cópia lógica por utilizador)
- Cursos e ligações
- builder.py
- Skills de revisão e catálogo
- Modo de leitura
- Privacidade e CSP
- ReaderPage
- Skill processar depósito
- shutil
- FakeGitHub
- extract/__init__.py
- Vocabularies
- _Corpus
- index.js
- catalog_io.py
- test_r2.py
- Workflow Pages
- Estrutura do repositório de dados
- useApp
- Skills do Claude Code no repositório de dados
- env
- SKILL.md
- nexus.yml
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- search.py
- Configuração Vite
- github.js
- screenshots.spec.ts
- typer
- SqliteFtsSearch
- units.py
- visibilidade_tipo
- test_index_publish.py
- signals.py
- 0001_esquema_base_fase_1.py
- useDragScroll
- _QuietGit
- scaffold
- migrations.py
- Git
- Migração dos códigos (D1)
- Projecto Python
- .check_format
- build_match
- Record

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 128 edges
2. `useApp()` - 94 edges
3. `ErrorBox()` - 83 edges
4. `Button()` - 74 edges
5. `Document` - 73 edges
6. `Pipeline` - 71 edges
7. `Layout` - 53 edges
8. `Record` - 51 edges
9. `normalize()` - 51 edges
10. `deposit()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `Fase 1 (concluída)` --references--> `vigiar()`  [EXTRACTED]
  CLAUDE.md → backend/nexus/cli.py
- `build_match()` --semantically_similar_to--> `buildMatch()`  [INFERRED] [semantically similar]
  backend/nexus/index/search.py → frontend/src/data/sqlite/search.ts
- `Blob` --references--> `BlobRef`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/documents.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (125 total, 22 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.12
Nodes (52): DataRepo, pdf_nativo(), deposit(), test_cli_end_to_end(), test_process_and_publish_commits_and_indexes_each_batch(), docs(), _lote(), run() (+44 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.08
Nodes (42): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS (+34 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (44): config_dir(), Catalog, contains_phrase(), contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman() (+36 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.07
Nodes (66): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Button(), Notice(), unitColor(), CatalogBundle (+58 more)

### Community 4 - "_repo"
Cohesion: 0.11
Nodes (26): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore(), _fail() (+18 more)

### Community 5 - "Record"
Cohesion: 0.08
Nodes (27): fixed(), now(), Question, QuestionContext, QuestionReview, QuestionSet, kept(), _blocks() (+19 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "r2.py"
Cohesion: 0.12
Nodes (14): migrate_originals(), MigrationReport, _originals(), _sha256(), missing_credentials(), open_blob_store(), QuotaExceeded, R2BlobStore (+6 more)

### Community 8 - "read_yaml"
Cohesion: 0.09
Nodes (13): read_yaml(), CatalogProposal, public_documents(), accept_unit_proposal(), describe(), _get(), pending(), propose() (+5 more)

### Community 9 - "AccountsManager.tsx"
Cohesion: 0.15
Nodes (19): siteLink(), AppData, AccountsManager(), accountState(), CopyField(), dateOnly(), endOfDay(), InvitesCard() (+11 more)

### Community 10 - "ocr.py"
Cohesion: 0.18
Nodes (10): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), MissingToolError, _has_osd(), ocr_image() (+2 more)

### Community 11 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.16
Nodes (30): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+22 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.14
Nodes (30): IconTrash(), downloadOriginal(), labelOf(), RemoveButton(), remove(), RemoveDialog(), remove(), RemovedList() (+22 more)

### Community 14 - "Página de entrada"
Cohesion: 0.10
Nodes (45): Página de apresentação e popups de entrada, App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), BrandBanner(), IconGoogle(), IconShield() (+37 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.10
Nodes (36): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+28 more)

### Community 16 - "DataRepo"
Cohesion: 0.19
Nodes (19): blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused(), test_a_question_using_an_excluded_case_is_not_shown_either() (+11 more)

### Community 17 - "write_yaml_if_changed"
Cohesion: 0.13
Nodes (12): dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), _render() (+4 more)

### Community 18 - "ui.tsx"
Cohesion: 0.17
Nodes (24): ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList(), ReasonText(), SPINES, applies() (+16 more)

### Community 19 - "pathlib"
Cohesion: 0.10
Nodes (15): GitError, _auth_env(), build_public_site(), _check_target(), _digest(), github_slug(), PublicResult, publish_public() (+7 more)

### Community 20 - "classification"
Cohesion: 0.06
Nodes (31): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+23 more)

### Community 21 - "source.ts"
Cohesion: 0.10
Nodes (22): AccountSession, RepoInfo, Change, RepoRef, GuestInfo, guestName(), APP_REPOSITORY, buildLotes() (+14 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.12
Nodes (27): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+19 more)

### Community 23 - "Reason"
Cohesion: 0.08
Nodes (32): ClassificationSettings, Alternative, Classification, FieldValue, Reason, ExtractionMeta, inherit(), Classifier (+24 more)

### Community 24 - "MetaIndex"
Cohesion: 0.14
Nodes (5): MetaIndex, parse(), toDocument(), DocumentRow, UserRow

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (16): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun (+8 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.13
Nodes (26): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+18 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (42): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+34 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.08
Nodes (17): uuid7(), BlobRef, Document, DocumentKind, HistoryEntry, Review, Source, Status (+9 more)

### Community 29 - "react-i18next"
Cohesion: 0.13
Nodes (19): Montagem da aplicação (#root e /src/main.tsx), IconArrowRight(), IconGlobe(), IconLock(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility() (+11 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.13
Nodes (29): hasOriginalView(), IMAGE_EXTS, OriginalPane(), useBinary(), pageUnitsHeight(), closeOnRemoval(), openPdf(), pageSize() (+21 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.09
Nodes (8): AccountError, AccountInvite, ACCOUNTS_URL, AccountsApi, AccountsConfig, FetchLike, STORAGE_URL, AccountRole

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (10): encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), commitChanges(), encoder (+2 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.10
Nodes (20): vigiar(), Depósito (envio sem organizar), Fase 5: abertura a outros utilizadores, Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20), Repositório da aplicação (público, GitHub Pages), Fluxo de depósito (browser para deposito/<login>/<lote>) (+12 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 38 - "types.ts"
Cohesion: 0.04
Nodes (61): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts), ACTIVE, AppContext, dir (+53 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "json"
Cohesion: 0.12
Nodes (9): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo(), test_contract_index_builds() (+1 more)

### Community 42 - "proxy.js"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "extract_file"
Cohesion: 0.11
Nodes (24): extract_file(), docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado() (+16 more)

### Community 44 - "User"
Cohesion: 0.17
Nodes (11): User, effective_visibility(), is_public(), type_key(), Visibility, parse_visibility(), set_document_visibility(), set_type_visibility() (+3 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.19
Nodes (21): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+13 more)

### Community 46 - "Projectos de código"
Cohesion: 0.11
Nodes (20): CodeProjectSettings, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in(), find_projects() (+12 more)

### Community 47 - "GitRepoBlobStore"
Cohesion: 0.11
Nodes (3): BlobStore, GitRepoBlobStore, HybridBlobStore

### Community 48 - "sqlalchemy"
Cohesion: 0.15
Nodes (4): upgrade(), upgrade(), upgrade(), upgrade()

### Community 49 - "test_public.py"
Cohesion: 0.22
Nodes (15): set_unit_visibility(), search_doc_ids(), _configure(), _doc_of(), _prepare(), test_cli_type_visibility(), test_cli_visibility(), test_effective_visibility_follows_unit_then_document() (+7 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Material público num repositório público à parte"
Cohesion: 0.12
Nodes (8): CSP estrita e noindex, Material público num repositório público à parte, Segurança e privacidade, Token fine-grained guardado no browser, Criar o repositório de dados privado, Permissões do token fine-grained (Contents, Actions, Workflows, Metadata), Uso local para desenvolvimento (WSL2), guarda-binarios.sh script

### Community 52 - "bundles.py"
Cohesion: 0.10
Nodes (17): BundleRef, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup, project_folders() (+9 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.08
Nodes (57): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), FetchLike, submit(), submit(), accessesKey() (+49 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.15
Nodes (21): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+13 more)

### Community 55 - "test_serve.py"
Cohesion: 0.11
Nodes (18): app_checkout(), only_personal(), PublicState, publish_public_if_due(), serve(), serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe() (+10 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "config.py"
Cohesion: 0.20
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (9): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+1 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 63 - "publish.py"
Cohesion: 0.12
Nodes (10): RemoteBusy, RunReport, commit_message(), indices_up_to_date(), process_and_publish(), ProcessResult, publish_index_branch(), _remote_indices_source() (+2 more)

### Community 64 - "raspberry-pi/instalar.sh"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 65 - "Documento (cópia lógica por utilizador)"
Cohesion: 0.14
Nodes (13): Detecção de cópias ao depositar (ownedSha), Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez), Blob, Cópias e duplicados (duplicate_of, near_duplicates_dismissed), Documento (cópia lógica por utilizador) (+5 more)

### Community 66 - "Cursos e ligações"
Cohesion: 0.17
Nodes (7): Course, unit_key(), Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Unidade curricular (cadeira)

### Community 67 - "builder.py"
Cohesion: 0.10
Nodes (15): Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics(), near_duplicate_pairs(), _question_rows() (+7 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.12
Nodes (27): Modo de leitura (Reader), Markdown(), OutlineEntry, ChromeButton(), OutlineList(), PageSource, ReaderText(), saveLabel() (+19 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "ReaderPage"
Cohesion: 0.18
Nodes (16): Marcas de leitura, MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId() (+8 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "shutil"
Cohesion: 0.19
Nodes (8): hamming(), sha256_file(), _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.10
Nodes (31): ExtractionSettings, Manifest, PageMeta, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), PageText (+23 more)

### Community 76 - "Vocabularies"
Cohesion: 0.21
Nodes (7): slugify(), Term, Vocabularies, filed_name(), original_stem(), unique_name(), test_unique_name()

### Community 77 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 78 - "index.js"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 79 - "catalog_io.py"
Cohesion: 0.11
Nodes (25): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+17 more)

### Community 80 - "test_r2.py"
Cohesion: 0.21
Nodes (6): FakeS3, _file(), _NotFound, test_hard_cut_when_over_limit(), test_migrate_originals(), test_put_materialize_and_dedup()

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 83 - "useApp"
Cohesion: 0.11
Nodes (52): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), TextPane(), buttonClass(), Card() (+44 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 88 - "nexus.yml"
Cohesion: 0.06
Nodes (32): concurrency, cancel-in-progress, group, reclassificar, jobs, pipeline, name, on (+24 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "app.spec.ts"
Cohesion: 0.21
Nodes (10): CORS, decode(), routeGitHub(), routeWorker(), snapshot, withFakeGitHub(), workerEnv(), workerEnvs (+2 more)

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "Migração de formatos"
Cohesion: 0.14
Nodes (10): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+2 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.23
Nodes (6): create_search_db(), _gzip(), PageRow, shard_name(), shard_of(), write_search_shards()

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 96 - "github.js"
Cohesion: 0.23
Nodes (14): adminCache, adminLogin(), appJwt(), dataRepo(), der(), derLength(), HEADERS, importAppKey() (+6 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 98 - "typer"
Cohesion: 0.22
Nodes (6): catalogo_propostas(), perguntas_pendentes(), _print_json(), publicar(), revisao_listar(), versao()

### Community 99 - "SqliteFtsSearch"
Cohesion: 0.21
Nodes (7): merge_hits(), SearchHit, shard_files(), SqliteFtsSearch, _row(), test_search_accents_spelling_and_filters(), test_search_shards_are_stable_and_split_when_too_big()

### Community 100 - "units.py"
Cohesion: 0.30
Nodes (8): CurricularUnit, unit_features(), _acronym_in(), compile_unit(), add(), score_unit(), score_units(), UnitFeatures

### Community 101 - "visibilidade_tipo"
Cohesion: 0.22
Nodes (6): visibilidade_cadeira(), visibilidade_documento(), visibilidade_tipo(), Campos obrigatórios para arrumar, Configurar a página pública (estudo-publico), nexus.yaml (definições e format_version)

### Community 102 - "test_index_publish.py"
Cohesion: 0.44
Nodes (6): git(), _prepare(), test_alembic_baseline_matches_schema(), test_meta_db_contents(), test_process_and_publish_with_git(), test_push_rejected_is_retried_without_losing_files()

### Community 103 - "signals.py"
Cohesion: 0.32
Nodes (6): strip_accents(), _raw(), _signal(), _signal(), test_years(), best()

### Community 104 - "0001_esquema_base_fase_1.py"
Cohesion: 0.29
Nodes (3): upgrade(), SearchBackend, Esquema relacional de partida para a fase 5

### Community 107 - "scaffold"
Cohesion: 0.28
Nodes (8): Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Flashcard (estado FSRS), Pergunta (banco de perguntas), Simulado, Tentativa (o modo tutor conta as dicas), gerado/<sha256>/ (material gerado, fase 2)

### Community 109 - "Git"
Cohesion: 0.14
Nodes (6): Git, app_has_update(), remote_has_news(), wait_until_quiet(), Processamento local (nexus servir), test_push_logs_rejection_reason()

### Community 121 - "Record"
Cohesion: 0.07
Nodes (17): Assessment, CourseUnitLink, UnitEdition, Record, Removal, Evidence, Generated, SourceRef (+9 more)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 854 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `Estantes, cursos e configuração`, `units.py`, `signals.py`, `read_yaml`, `shutil`, `json`, `extract/__init__.py`, `catalog_io.py`, `bundles.py`, `classification`, `build_match`, `Reason`, `Testes da classificação`, `Recepção do depósito`, `search.py`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `DataRepo` (e.g. with `Settings` and `Layout`) actually correct?**
  _`DataRepo` has 61 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.11533242876526459 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `LibraryPage.tsx`, `Propostas de catálogo e texto`, `classification`, `types.ts`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Document` (e.g. with `DataRepo` and `effective_visibility()`) actually correct?**
  _`Document` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08376623376623377 - nodes in this community are weakly interconnected._