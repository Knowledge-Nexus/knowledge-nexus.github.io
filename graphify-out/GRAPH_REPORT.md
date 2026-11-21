# Graph Report - knowledge-nexus.github.io  (2026-11-21)

## Corpus Check
- 239 files · ~175,600 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3254 nodes · 9997 edges · 130 communities (109 shown, 21 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 972 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a4938722`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Testes do pipeline
- useApp
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- RepoOption
- Record
- nexus vigiar e API GitHub
- R2BlobStore
- review.py
- ErrorBox
- access.ts
- DataRepo
- icons.tsx
- Remover e «A rever»
- WelcomePage.tsx
- Gravar marcas de leitura
- test_questions.py
- .run
- types.ts
- pathlib
- Regras de classificação contra erros conhecidos
- source.ts
- Testes da classificação
- Reason
- MetaIndex
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- ._expand_archive
- index.ts
- pdf.ts
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- pipeline
- Workflow de CI
- Credencial GitHub do Worker
- test_public.py
- proxy.js
- base.py
- GitHubDataSource
- Layout e ajuda
- Projectos de código
- context.tsx
- sqlalchemy
- PdfViewer.tsx
- Configuração do Biome
- write_yaml_if_changed
- run.py
- Gestão dos acessos
- UploadPage.tsx
- test_serve.py
- Document
- Dependências de desenvolvimento
- r2.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- ProcessResult
- Git
- raspberry-pi/instalar.sh
- ._intake_file
- json
- import_bundle
- Skills de revisão e catálogo
- Reader.tsx
- Privacidade e CSP
- annotations.ts
- Skill processar depósito
- shutil
- FakeGitHub
- office.py
- dataclasses
- extract/__init__.py
- index.js
- catalog_io.py
- command
- Workflow Pages
- Estrutura do repositório de dados
- App.tsx
- Skills do Claude Code no repositório de dados
- env
- SKILL.md
- extract_file
- Processamento local (nexus servir)
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- search.py
- EntryDialogs.tsx
- Material público num repositório público à parte
- screenshots.spec.ts
- config.py
- ._close_known_proposals
- raspberry-pi/instalar.sh
- reclassificar
- github.js
- pathlib
- _repo
- Regra 1: nunca pôr material real neste repositório
- _QuietGit
- session.ts
- test_push_logs_rejection_reason
- serve
- Migração dos códigos (D1)
- BundleEditor.tsx
- Projecto Python
- app-ref
- filing.py
- Record
- Notifications.tsx
- _NotFound
- scaffold
- remove_course

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 125 edges
2. `useApp()` - 97 edges
3. `ErrorBox()` - 83 edges
4. `Button()` - 74 edges
5. `Document` - 70 edges
6. `Pipeline` - 65 edges
7. `Layout` - 52 edges
8. `Record` - 51 edges
9. `normalize()` - 51 edges
10. `deposit()` - 49 edges

## Surprising Connections (you probably didn't know these)
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
- `Cadeira só no texto fica abaixo do limiar (BODY_ONLY_MAX)` --references--> `_text_only()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/classify/classifier.py
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `build_match()` --semantically_similar_to--> `buildMatch()`  [INFERRED] [semantically similar]
  backend/nexus/index/search.py → frontend/src/data/sqlite/search.ts
- `Ramo indices (órfão, um só commit)` --references--> `publish_index_branch()`  [INFERRED]
  docs/arquitectura.md → backend/nexus/publish.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (130 total, 21 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.11
Nodes (49): pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user(), test_archive_with_code_project_and_nested_zip() (+41 more)

### Community 1 - "useApp"
Cohesion: 0.08
Nodes (42): Nome dado pelo dono (classification.title), IconDownload(), IconGlobe(), IconLock(), Badge(), Choice, ConfirmPublic(), DocChoice (+34 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (43): config_dir(), Catalog, contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman(), sequel_after() (+35 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (56): Biblioteca em estantes curso e ano, Página da cadeira (UnitDetail), Sugestões ao registar (lista de referência pt.json), EditButton(), Notice(), unitColor(), useApp(), CatalogBundle (+48 more)

### Community 4 - "RepoOption"
Cohesion: 0.12
Nodes (17): catalogo_importar(), catalogo_rejeitar(), documento_texto(), _fail(), _main(), migrar_blobs(), perguntas_mostrar(), perguntas_propor() (+9 more)

### Community 5 - "Record"
Cohesion: 0.06
Nodes (32): fixed(), now(), Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet (+24 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "R2BlobStore"
Cohesion: 0.13
Nodes (12): migrate_originals(), MigrationReport, _originals(), _sha256(), QuotaExceeded, R2BlobStore, FakeS3, _file() (+4 more)

### Community 8 - "review.py"
Cohesion: 0.17
Nodes (12): catalogo_aceitar(), documento_mostrar(), main(), accept_unit_proposal(), describe(), _get(), pending(), propose() (+4 more)

### Community 9 - "ErrorBox"
Cohesion: 0.12
Nodes (34): SuggestInput(), Button(), ErrorBox(), siteLink(), FieldForm(), TitleEditor(), useFieldSaver(), WaitingPanel() (+26 more)

### Community 10 - "access.ts"
Cohesion: 0.12
Nodes (32): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), submit(), submit(), accessesKey(), AccessManager() (+24 more)

### Community 11 - "DataRepo"
Cohesion: 0.07
Nodes (22): DataRepo, export_tree(), ExportReport, build_indices(), BuildResult, _dump(), _file_info(), near_duplicate_pairs() (+14 more)

### Community 12 - "icons.tsx"
Cohesion: 0.15
Nodes (24): IconArchive(), IconArrowRight(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClose(), IconCode(), IconEraser() (+16 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.13
Nodes (31): Remover documentos (caixote do lixo, removed: {at, by}), IconTrash(), downloadOriginal(), labelOf(), RemoveButton(), remove(), RemoveDialog(), remove() (+23 more)

### Community 14 - "WelcomePage.tsx"
Cohesion: 0.12
Nodes (20): Identidade visual (pergaminho, azul-marinho e dourado), Página de apresentação e popups de entrada, AccountError, AccountInvite, ACCOUNTS_URL, AccountsConfig, AccountUser, FetchLike (+12 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.20
Nodes (17): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+9 more)

### Community 16 - "test_questions.py"
Cohesion: 0.19
Nodes (19): blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused(), test_a_question_using_an_excluded_case_is_not_shown_either() (+11 more)

### Community 18 - "types.ts"
Cohesion: 0.10
Nodes (37): Editar no sítio (lápis, method: user), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList(), ReasonText(), SPINES (+29 more)

### Community 19 - "pathlib"
Cohesion: 0.16
Nodes (9): GitError, RemoteBusy, _check_target(), github_slug(), PublishError, _read_original(), commit_message(), is_offline() (+1 more)

### Community 20 - "Regras de classificação contra erros conhecidos"
Cohesion: 0.18
Nodes (9): CLASSIFIER_VERSION (reclassificação), prior, type_prior, Classificação heurística e explicável, Confiança: melhor / (melhor + segundo + prior), Campos obrigatórios para arrumar, Papel: enunciado ou resolução, Sinais de classificação com pesos configuráveis (+1 more)

### Community 21 - "source.ts"
Cohesion: 0.09
Nodes (27): fflate@^0.8.3, AccountSession, AppData, RepoInfo, RepoRef, GuestInfo, APP_REPOSITORY, buildLotes() (+19 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (30): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+22 more)

### Community 23 - "Reason"
Cohesion: 0.08
Nodes (30): Alternative, Classification, FieldValue, Reason, contains_phrase(), Classifier, pick(), weak() (+22 more)

### Community 24 - "MetaIndex"
Cohesion: 0.07
Nodes (34): Procedimento para mudar o esquema do índice, DocumentFilter, JSON_DOC_COLUMNS, MetaIndex, MIN_SCHEMA_VERSION, parse(), parsePages(), SUPPORTED_SCHEMA_VERSION (+26 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.12
Nodes (12): clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun, fetchPublicManifest(), get() (+4 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.14
Nodes (25): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+17 more)

### Community 27 - "document_types"
Cohesion: 0.05
Nodes (44): Editar ou remover uma cadeira (units_remove, merge_into), Nomes alternativos acumulam (_ADDITIVE), Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug (+36 more)

### Community 28 - "._expand_archive"
Cohesion: 0.19
Nodes (6): BlobRef, Review, expected_extractor(), sha256_file(), default_cache_dir(), _Staging

### Community 29 - "index.ts"
Cohesion: 0.20
Nodes (5): Montagem da aplicação (#root e /src/main.tsx), i18next@^26.4.2, react-dom@^19.3.0, i18next, react-dom

### Community 30 - "pdf.ts"
Cohesion: 0.07
Nodes (18): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), closeOnRemoval(), openPdf(), OutlineEntry, PdfDocument, pdfOutline(), PdfPage (+10 more)

### Community 31 - "package.json"
Cohesion: 0.08
Nodes (26): dependencies, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, katex@^0.18.9, pdfjs-dist@^6.3.289, react@^19.3.0, react-i18next@^17.0.15 (+18 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.08
Nodes (17): COMPARE_MAX_FILES, Comparison, encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, BranchBusyError (+9 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.10
Nodes (21): vigiar(), Depósito (envio sem organizar), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Knowledge Nexus (plataforma de estudo), Repositório da aplicação (público, GitHub Pages), Fluxo de depósito (browser para deposito/<login>/<lote>), Ramo indices (órfão, um só commit) (+13 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.13
Nodes (4): Layout, _render(), scaffold(), ScaffoldReport

### Community 38 - "pipeline"
Cohesion: 0.29
Nodes (7): pipeline, if, secrets, uses, with, app-ref, reclassify

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "test_public.py"
Cohesion: 0.11
Nodes (23): read_yaml(), publish_public(), catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache() (+15 more)

### Community 42 - "proxy.js"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "base.py"
Cohesion: 0.22
Nodes (7): MissingToolError, require(), which(), _has_osd(), ocr_image(), OcrResult, _parse_tsv()

### Community 44 - "GitHubDataSource"
Cohesion: 0.17
Nodes (6): readCurrent(), GitHubDataSource, nowIso(), pad(), yamlUpdate(), IndexManifest

### Community 45 - "Layout e ajuda"
Cohesion: 0.14
Nodes (26): BRAND, Brand(), BrandBanner(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconEye() (+18 more)

### Community 46 - "Projectos de código"
Cohesion: 0.14
Nodes (17): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+9 more)

### Community 47 - "context.tsx"
Cohesion: 0.07
Nodes (30): Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), pesquisa.db.gz (FTS5 pages_fts), ACTIVE, AppContext, LAG_INTERVAL_MS, useSearchIndex(), dir (+22 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.06
Nodes (21): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), SearchBackend, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Fase 5: abertura a outros utilizadores (+13 more)

### Community 49 - "PdfViewer.tsx"
Cohesion: 0.18
Nodes (12): Drag, useDragScroll(), pageUnitsHeight(), pageSize(), renderPage(), PdfViewer(), escapeXml(), pattern() (+4 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "write_yaml_if_changed"
Cohesion: 0.11
Nodes (15): dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), type_key() (+7 more)

### Community 52 - "run.py"
Cohesion: 0.10
Nodes (19): BundleRef, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup, member_name() (+11 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.17
Nodes (24): AccessRow(), addDays(), rename(), renew(), setUntil(), checkToken(), ImportCode(), submit() (+16 more)

### Community 54 - "UploadPage.tsx"
Cohesion: 0.16
Nodes (23): UploadEntry, Known, prepareUpload(), Row, State, UploadPage(), add(), onDrop() (+15 more)

### Community 55 - "test_serve.py"
Cohesion: 0.14
Nodes (15): remote_has_news(), serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_busy_remote_is_not_an_error(), busy(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed() (+7 more)

### Community 56 - "Document"
Cohesion: 0.14
Nodes (5): Document, HistoryEntry, Status, inherit(), Pipeline

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.08
Nodes (33): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @tailwindcss/vite@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7 (+25 more)

### Community 58 - "r2.py"
Cohesion: 0.10
Nodes (8): BlobStore, GitRepoBlobStore, HybridBlobStore, open_blob_store(), _s3_client(), StorageUnavailable, unavailable_message(), Originais no Cloudflare R2 (opcional)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (9): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+1 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 63 - "Git"
Cohesion: 0.13
Nodes (7): Git, indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source(), search_cache_dir(), public_key()

### Community 64 - "raspberry-pi/instalar.sh"
Cohesion: 0.04
Nodes (45): Opção file_uncertain_type (tipo por confirmar), archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio (+37 more)

### Community 65 - "._intake_file"
Cohesion: 0.22
Nodes (5): uuid7(), Source, DepositItem, ItemError, PartsIncomplete

### Community 66 - "json"
Cohesion: 0.09
Nodes (18): _auth_env(), docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado() (+10 more)

### Community 67 - "import_bundle"
Cohesion: 0.13
Nodes (17): CatalogError, _check_slug(), _given(), import_bundle(), ImportReport, load_catalog(), _merge(), remove_unit() (+9 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Reader.tsx"
Cohesion: 0.10
Nodes (37): Modo de leitura (Reader), Marcas de leitura, IconClearPage(), IconFitPage(), IconFitWidth(), IconList(), IconPage(), IconPen() (+29 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "annotations.ts"
Cohesion: 0.10
Nodes (31): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), BASE_WIDTH, COLORS (+23 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "shutil"
Cohesion: 0.26
Nodes (6): _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 74 - "FakeGitHub"
Cohesion: 0.19
Nodes (9): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup(), decode() (+1 more)

### Community 75 - "office.py"
Cohesion: 0.17
Nodes (17): ExtractionSettings, clean_text(), ExtractionError, looks_mathematical(), extract_docx(), extract_legacy(), extract_pptx(), extract_xlsx() (+9 more)

### Community 76 - "dataclasses"
Cohesion: 0.12
Nodes (13): ClassificationSettings, strip_accents(), Term, Vocabularies, material_folder(), check(), collect_signals(), _raw() (+5 more)

### Community 77 - "extract/__init__.py"
Cohesion: 0.15
Nodes (13): PageMeta, ExtractionResult, PageText, archive_listing(), code_project_text(), write_extraction(), decode_bytes(), extract_image() (+5 more)

### Community 78 - "index.js"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 79 - "catalog_io.py"
Cohesion: 0.10
Nodes (20): export_bundle(), Assessment, CatalogBundle, Course, CourseUnitLink, CurricularUnit, Institution, InstitutionBundle (+12 more)

### Community 80 - "command"
Cohesion: 0.16
Nodes (9): catalogo_propostas(), migrar(), perguntas_pendentes(), _print_json(), processar(), publicar(), revisao_listar(), servir() (+1 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 83 - "App.tsx"
Cohesion: 0.12
Nodes (43): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+35 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "extract_file"
Cohesion: 0.18
Nodes (13): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_ocr_workers_respect_the_machine_limit() (+5 more)

### Community 88 - "Processamento local (nexus servir)"
Cohesion: 0.12
Nodes (17): concurrency, cancel-in-progress, group, jobs, name, permissions, actions, contents (+9 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "app.spec.ts"
Cohesion: 0.23
Nodes (8): CORS, routeGitHub(), routeWorker(), snapshot, workerEnv(), workerEnvs, workerFile(), WorkerHandle

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "Migração de formatos"
Cohesion: 0.11
Nodes (11): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+3 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.08
Nodes (28): build_match(), _code_fingerprint(), create_search_db(), _gzip(), merge_hits(), PageRow, _prune_cache(), SearchFilters (+20 more)

### Community 95 - "EntryDialogs.tsx"
Cohesion: 0.28
Nodes (19): IconGoogle(), IconUser(), IconUserPlus(), Modal(), parseRepo(), connect(), AdminDialog(), submit() (+11 more)

### Community 96 - "Material público num repositório público à parte"
Cohesion: 0.12
Nodes (13): missing_credentials(), Detecção de cópias ao depositar (ownedSha), CSP estrita e noindex, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Material público num repositório público à parte, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez) (+5 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 98 - "config.py"
Cohesion: 0.18
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 99 - "._close_known_proposals"
Cohesion: 0.16
Nodes (9): CatalogProposal, Evidence, Versão do extractor (provoca nova extracção), Etapa 3: reconciliação (classificar, arrumar ou rever), Fluxo de revisão (patch method: user, depois reviewed), Blob, Documento (cópia lógica por utilizador), Proposta de catálogo (+1 more)

### Community 100 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 101 - "reclassificar"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 102 - "github.js"
Cohesion: 0.23
Nodes (14): adminCache, adminLogin(), appJwt(), dataRepo(), der(), derLength(), HEADERS, importAppKey() (+6 more)

### Community 103 - "pathlib"
Cohesion: 0.22
Nodes (6): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), alembic_config()

### Community 104 - "_repo"
Cohesion: 0.20
Nodes (5): catalogo_exportar(), exportar_arvore(), indexar(), _repo(), DataRepoError

### Community 106 - "_QuietGit"
Cohesion: 0.22
Nodes (3): wait_until_quiet(), _QuietGit, test_waits_until_the_interface_stops_writing()

### Community 107 - "session.ts"
Cohesion: 0.27
Nodes (10): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession(), read() (+2 more)

### Community 109 - "serve"
Cohesion: 0.17
Nodes (8): PublicResult, app_checkout(), app_has_update(), PublicState, publish_public_if_due(), serve(), test_public_material_is_published_when_it_may_have_changed(), fake_publish()

### Community 113 - "BundleEditor.tsx"
Cohesion: 0.33
Nodes (9): BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconStack(), BundleMembers() (+1 more)

### Community 117 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 118 - "filing.py"
Cohesion: 0.28
Nodes (6): slugify(), filed_name(), original_stem(), unique_name(), test_unique_name(), test_slugify()

### Community 121 - "Record"
Cohesion: 0.08
Nodes (16): Topic, Record, DocumentKind, Removal, ExtractionMeta, Enrollments, Group, GroupMember (+8 more)

### Community 125 - "Notifications.tsx"
Cohesion: 0.44
Nodes (8): IconBell(), More(), NotificationList(), Notifications(), requestDate(), Section(), validDate(), problemCount()

### Community 127 - "scaffold"
Cohesion: 0.40
Nodes (4): scaffold(), Token fine-grained guardado no browser, Criar o repositório de dados privado, Permissões do token fine-grained (Contents, Actions, Workflows, Metadata)

## Knowledge Gaps
- **12 isolated node(s):** `UV_PROJECT_ENVIRONMENT`, `nexus`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)`, `Tokens de cor da interface (paper, sheet, ink, pen, navy, gold, line)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 874 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `json`, `Estantes, cursos e configuração`, `._close_known_proposals`, `import_bundle`, `dataclasses`, `extract/__init__.py`, `catalog_io.py`, `context.tsx`, `run.py`, `Testes da classificação`, `Reason`, `Document`, `search.py`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 56 inferred relationships involving `DataRepo` (e.g. with `export_tree()` and `_catalog_failed()`) actually correct?**
  _`DataRepo` has 56 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UV_PROJECT_ENVIRONMENT`, `nexus`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.11061507936507936 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `BundleEditor.tsx`, `Propostas de catálogo e texto`, `ErrorBox`, `context.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.08116883116883117 - nodes in this community are weakly interconnected._