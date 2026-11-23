# Graph Report - knowledge-nexus.github.io  (2026-11-23)

## Corpus Check
- 244 files · ~182,301 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3331 nodes · 10219 edges · 124 communities (97 shown, 27 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 988 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8ec5cd97`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Testes do pipeline
- useApp
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- _repo
- Record
- nexus vigiar e API GitHub
- r2.py
- review.py
- AccountsManager.tsx
- AccessManager.tsx
- build_indices
- icons.tsx
- Button
- WelcomePage.tsx
- conftest.py
- test_questions.py
- .run
- types.ts
- pathlib
- classification
- source.ts
- Testes da classificação
- classifier.py
- MetaIndex
- Fontes de dados e cache
- unpack.py
- document_types
- ._expand_archive
- classifier.py
- ReaderPage
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- GitHubDataSource
- Workflow de CI
- Credencial GitHub do Worker
- read_yaml
- proxy.js
- test_index_publish.py
- Visibility.tsx
- json
- Projectos de código
- builder.py
- sqlalchemy
- DataSource
- Configuração do Biome
- write_yaml_if_changed
- bundles.py
- HttpError
- UploadPage.tsx
- test_serve.py
- Document
- Dependências de desenvolvimento
- GitRepoBlobStore
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- CatalogTab.tsx
- Git
- extraction
- ._intake_file
- gerar.py
- Vocabularies
- Skills de revisão e catálogo
- Reader.tsx
- Privacidade e CSP
- annotations.ts
- Skill processar depósito
- vite.config.ts
- FakeGitHub
- extract/__init__.py
- Contas no Worker do Cloudflare (D1)
- _QuietGit
- index.js
- Simulado
- useDragScroll
- Workflow Pages
- _Corpus
- App.tsx
- PublicResult
- env
- SKILL.md
- Documento (cópia lógica por utilizador)
- nexus.yml
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- formats/__init__.py
- nexus.yaml do template
- search.py
- ProcessResult
- Material público num repositório público à parte
- screenshots.spec.ts
- test_push_logs_rejection_reason
- catalog_io.py
- raspberry-pi/instalar.sh
- migrations.py
- cli.py
- iniciar
- intake.py
- Migração dos códigos (D1)
- scaffold
- Projecto Python
- app-ref
- Record

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 126 edges
2. `useApp()` - 101 edges
3. `ErrorBox()` - 86 edges
4. `Button()` - 76 edges
5. `Document` - 72 edges
6. `Pipeline` - 70 edges
7. `Layout` - 52 edges
8. `Record` - 51 edges
9. `deposit()` - 51 edges
10. `normalize()` - 51 edges

## Surprising Connections (you probably didn't know these)
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `Processamento do depósito: identificar, deduplicar, extrair (OCR pt), classificar, arrumar` --semantically_similar_to--> `Skill /processar-deposito`  [INFERRED] [semantically similar]
  README.md → backend/nexus/scaffold/template/.claude/skills/processar-deposito/SKILL.md
- `acessos.yaml (acessos temporários sem tokens)` --references--> `only_personal()`  [INFERRED]
  docs/repo-dados.md → backend/nexus/serve.py
- `Segredo NEXUS_PUBLICO_TOKEN` --references--> `publish_public_if_due()`  [INFERRED]
  docs/configuracao.md → backend/nexus/serve.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (124 total, 27 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.10
Nodes (53): resolve(), pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user() (+45 more)

### Community 1 - "useApp"
Cohesion: 0.06
Nodes (54): Nome dado pelo dono (classification.title), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconDownload() (+46 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (42): Catalog, contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman(), sequel_after(), series_number() (+34 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.07
Nodes (68): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Página da cadeira (UnitDetail), Sugestões ao registar (lista de referência pt.json), SuggestInput(), ErrorBox(), Notice(), unitColor() (+60 more)

### Community 4 - "_repo"
Cohesion: 0.13
Nodes (20): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_rejeitar(), documento_texto(), exportar_arvore(), _fail(), indexar() (+12 more)

### Community 5 - "Record"
Cohesion: 0.08
Nodes (29): Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet, _question_rows(), _blocks() (+21 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.05
Nodes (23): deep_merge(), _defaults(), load_settings(), GitHub, GitHubApiError, Repo, Api, batch_id() (+15 more)

### Community 7 - "r2.py"
Cohesion: 0.06
Nodes (20): BlobStore, migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, missing_credentials(), open_blob_store() (+12 more)

### Community 8 - "review.py"
Cohesion: 0.14
Nodes (13): write_unit(), CurricularUnit, UnitEdition, CatalogProposal, accept_unit_proposal(), describe(), propose(), ReviewError (+5 more)

### Community 9 - "AccountsManager.tsx"
Cohesion: 0.10
Nodes (27): AccountInvite, ACCOUNTS_URL, AccountsConfig, AccountSession, FetchLike, SignedIn, siteLink(), AppData (+19 more)

### Community 10 - "AccessManager.tsx"
Cohesion: 0.08
Nodes (52): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), GuestInfo, accessesKey(), AccessManager(), change() (+44 more)

### Community 11 - "build_indices"
Cohesion: 0.11
Nodes (13): export_tree(), ExportReport, build_indices(), near_duplicate_pairs(), _required_confidence(), _catalog_failed(), deposit_status(), _failed() (+5 more)

### Community 12 - "icons.tsx"
Cohesion: 0.12
Nodes (42): IconArchive(), IconBell(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode() (+34 more)

### Community 13 - "Button"
Cohesion: 0.08
Nodes (57): DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), TextPane(), useBinary(), Drag, IconTrash() (+49 more)

### Community 14 - "WelcomePage.tsx"
Cohesion: 0.10
Nodes (44): Identidade visual (pergaminho, azul-marinho e dourado), Página de apresentação e popups de entrada, BRAND, BrandBanner(), BrandIcon(), DefaultMark(), IconGoogle(), IconShield() (+36 more)

### Community 15 - "conftest.py"
Cohesion: 0.14
Nodes (12): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), catalog_root(), data_root(), fixed_clock() (+4 more)

### Community 16 - "test_questions.py"
Cohesion: 0.16
Nodes (20): DataRepo, blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused() (+12 more)

### Community 18 - "types.ts"
Cohesion: 0.07
Nodes (49): Montagem da aplicação (#root e /src/main.tsx), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList(), ReasonText(), SPINES (+41 more)

### Community 19 - "pathlib"
Cohesion: 0.11
Nodes (14): GitError, RemoteBusy, build_public_site(), _check_target(), _digest(), github_slug(), publish_public(), PublishError (+6 more)

### Community 20 - "classification"
Cohesion: 0.07
Nodes (27): _text_only(), Opção file_uncertain_type (tipo por confirmar), classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost, file_uncertain_type (+19 more)

### Community 21 - "source.ts"
Cohesion: 0.09
Nodes (27): fflate@^0.8.3, yaml@^2.9.1, COMPARE_MAX_FILES, Comparison, GitHubError, RepoInfo, TreeEntry, Change (+19 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (30): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+22 more)

### Community 23 - "classifier.py"
Cohesion: 0.08
Nodes (29): Alternative, Classification, FieldValue, Reason, contains_phrase(), Term, Classifier, pick() (+21 more)

### Community 24 - "MetaIndex"
Cohesion: 0.05
Nodes (39): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts), ACTIVE, AppContext, LAG_INTERVAL_MS (+31 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.10
Nodes (15): clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun, fetchPublicManifest(), get() (+7 more)

### Community 26 - "unpack.py"
Cohesion: 0.07
Nodes (39): ArchiveSettings, _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member(), archive_format() (+31 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (41): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, color (+33 more)

### Community 28 - "._expand_archive"
Cohesion: 0.21
Nodes (4): BlobRef, sha256_file(), default_cache_dir(), _Staging

### Community 29 - "classifier.py"
Cohesion: 0.13
Nodes (17): ClassificationSettings, ExtractionMeta, strip_accents(), material_folder(), check(), _producer(), unit_features(), compile_terms() (+9 more)

### Community 30 - "ReaderPage"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 31 - "package.json"
Cohesion: 0.08
Nodes (32): dependencies, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289, react@^19.3.0 (+24 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.23
Nodes (22): applyInvite(), cleanEmail(), cleanPassword(), clientIp(), createSession(), decodeIdToken(), findInvite(), googleReady() (+14 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (9): encodePath(), GitHubClient, toBase64(), BranchBusyError, buildTree(), commitChanges(), readCurrent(), wait() (+1 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.08
Nodes (25): vigiar(), Depósito (envio sem organizar), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20), Repositório da aplicação (público, GitHub Pages) (+17 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.12
Nodes (5): config_dir(), Layout, _render(), scaffold(), ScaffoldReport

### Community 38 - "GitHubDataSource"
Cohesion: 0.16
Nodes (5): guestName(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "read_yaml"
Cohesion: 0.11
Nodes (27): read_yaml(), User, effective_visibility(), is_public(), type_key(), Visibility, public_documents(), parse_visibility() (+19 more)

### Community 42 - "proxy.js"
Cohesion: 0.16
Nodes (26): canRead(), canWrite(), effectiveRole(), requireAdmin(), requireUser(), sessionUser(), adminLogin(), dataRepo() (+18 more)

### Community 43 - "test_index_publish.py"
Cohesion: 0.18
Nodes (14): shard_files(), git(), _prepare(), _row(), test_alembic_baseline_matches_schema(), test_cli_end_to_end(), test_meta_db_contents(), test_process_and_publish_commits_and_indexes_each_batch() (+6 more)

### Community 44 - "Visibility.tsx"
Cohesion: 0.21
Nodes (17): IconArrowRight(), IconGlobe(), IconLock(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility(), choose() (+9 more)

### Community 45 - "json"
Cohesion: 0.15
Nodes (5): _auth_env(), test_contract_index_builds(), test_normalization_vectors(), build(), _files()

### Community 46 - "Projectos de código"
Cohesion: 0.17
Nodes (14): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+6 more)

### Community 47 - "builder.py"
Cohesion: 0.13
Nodes (9): fixed(), now(), Topic, BuildResult, _dump(), _file_info(), _flatten_topics(), _strip_reasons() (+1 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.10
Nodes (10): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Fase 5: abertura a outros utilizadores, Esquema relacional de partida para a fase 5 (+2 more)

### Community 49 - "DataSource"
Cohesion: 0.07
Nodes (17): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), closeOnRemoval(), openPdf(), OutlineEntry, PdfDocument, pdfOutline(), PdfPage (+9 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "write_yaml_if_changed"
Cohesion: 0.14
Nodes (9): remove_course(), dump_yaml(), _Dumper, _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), Criar e remover cursos (courses_remove) (+1 more)

### Community 52 - "bundles.py"
Cohesion: 0.08
Nodes (22): BundleRef, DocumentKind, Status, bundle_id(), choose_lead(), key(), folder_name(), folder_of() (+14 more)

### Community 53 - "HttpError"
Cohesion: 0.23
Nodes (17): admin(), cleanName(), cleanRole(), cleanUntil(), createUser(), managerLimits(), newId(), encoder (+9 more)

### Community 54 - "UploadPage.tsx"
Cohesion: 0.10
Nodes (32): DepositState, More(), NotificationList(), Notifications(), requestDate(), Section(), validDate(), Known (+24 more)

### Community 55 - "test_serve.py"
Cohesion: 0.09
Nodes (20): app_checkout(), is_broken(), PublicState, publish_public_if_due(), serve(), _git(), test_a_broken_disk_exits_for_the_bat_to_restart_wsl(), test_app_update_is_seen_only_when_pull_is_safe() (+12 more)

### Community 56 - "Document"
Cohesion: 0.15
Nodes (5): Document, Review, Pipeline, pending(), Remover documentos (caixote do lixo, removed: {at, by})

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.30
Nodes (13): dummyHash(), base64url(), checkPassword(), encoder, fromBase64url(), hashPassword(), hex(), hmacKey() (+5 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.13
Nodes (10): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+2 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "CatalogTab.tsx"
Cohesion: 0.24
Nodes (16): useApp(), ProposalRow, AcceptAll(), run(), catalogBundle(), CatalogTab(), defaultSlug(), Evidence() (+8 more)

### Community 63 - "Git"
Cohesion: 0.11
Nodes (11): Git, indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source(), search_cache_dir(), app_has_update(), public_key() (+3 more)

### Community 64 - "extraction"
Cohesion: 0.07
Nodes (28): archives, keep_whole, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio (+20 more)

### Community 65 - "._intake_file"
Cohesion: 0.22
Nodes (5): uuid7(), Source, DepositItem, ItemError, PartsIncomplete

### Community 66 - "gerar.py"
Cohesion: 0.22
Nodes (11): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+3 more)

### Community 67 - "Vocabularies"
Cohesion: 0.24
Nodes (6): slugify(), Vocabularies, filed_name(), original_stem(), unique_name(), test_unique_name()

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Reader.tsx"
Cohesion: 0.15
Nodes (18): Modo de leitura (Reader), Marcas de leitura, MarkColor, PAGE_UNITS, StrokeSize, DEFAULT_PREFS, Fit, lastPage() (+10 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "annotations.ts"
Cohesion: 0.12
Nodes (31): draftKey(), dropDraft(), marksKey(), readDraft(), SAVE_DELAY_MS, scope(), useMarkEditor(), useSavedMarks() (+23 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (18): Skill /processar-deposito, nexus processar --json, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), Estrutura do repositório de dados, deposito/<login>/ (entrada) e _erros/ (falhas com .log) (+10 more)

### Community 73 - "vite.config.ts"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.05
Nodes (56): DedupSettings, ExtractionSettings, LimitSettings, PublishingSettings, _Section, Settings, SourceWeights, StorageSettings (+48 more)

### Community 76 - "Contas no Worker do Cloudflare (D1)"
Cohesion: 0.33
Nodes (7): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Originais no Cloudflare R2 (opcional), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite)

### Community 78 - "index.js"
Cohesion: 0.25
Nodes (14): handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle(), handleBlob(), keyFor() (+6 more)

### Community 79 - "Simulado"
Cohesion: 0.40
Nodes (5): Fase 3: pesquisa semântica, flashcards FSRS e simulados, Flashcard (estado FSRS), Simulado, Tentativa (o modo tutor conta as dicas), Utilizador

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 83 - "App.tsx"
Cohesion: 0.08
Nodes (67): App(), Home(), PublicShell(), queryClient, Shell(), signOutAccount(), WelcomeOrHome(), WelcomeRoute() (+59 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "Documento (cópia lógica por utilizador)"
Cohesion: 0.16
Nodes (6): HistoryEntry, Fluxo de revisão (patch method: user, depois reviewed), Blob, Documento (cópia lógica por utilizador), Proposta de catálogo, Estados do documento (received, extracted, classified, filed, enriched, reviewed)

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

### Community 92 - "formats/__init__.py"
Cohesion: 0.11
Nodes (11): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+3 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.10
Nodes (15): build_match(), _code_fingerprint(), create_search_db(), _gzip(), merge_hits(), PageRow, _prune_cache(), SearchBackend (+7 more)

### Community 96 - "Material público num repositório público à parte"
Cohesion: 0.12
Nodes (13): Detecção de cópias ao depositar (ownedSha), CSP estrita e noindex, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Material público num repositório público à parte, Campos obrigatórios para arrumar, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez) (+5 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 99 - "catalog_io.py"
Cohesion: 0.08
Nodes (28): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+20 more)

### Community 100 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 104 - "cli.py"
Cohesion: 0.10
Nodes (17): catalogo_propostas(), documento_mostrar(), main(), _main(), migrar(), perguntas_pendentes(), _print_json(), processar() (+9 more)

### Community 106 - "intake.py"
Cohesion: 0.17
Nodes (10): detect_extension(), is_junk(), mime_of(), _sniff(), _batch_items(), _batch_options(), _files_under(), _items_of() (+2 more)

### Community 113 - "scaffold"
Cohesion: 0.22
Nodes (6): scaffold(), instalar.sh script, Skills do Claude Code no repositório de dados, Token fine-grained guardado no browser, Criar o repositório de dados privado, Permissões do token fine-grained (Contents, Actions, Workflows, Metadata)

### Community 117 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 121 - "Record"
Cohesion: 0.08
Nodes (13): Assessment, Record, Removal, Evidence, Enrollments, Group, GroupMember, Preferences (+5 more)

## Knowledge Gaps
- **12 isolated node(s):** `UV_PROJECT_ENVIRONMENT`, `nexus`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 908 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **27 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `Estantes, cursos e configuração`, `extract/__init__.py`, `json`, `bundles.py`, `classification`, `Testes da classificação`, `classifier.py`, `Document`, `Record`, `classifier.py`, `search.py`?**
  _High betweenness centrality (0.098) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `DataRepo` (e.g. with `Vocabularies` and `export_tree()`) actually correct?**
  _`DataRepo` has 61 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UV_PROJECT_ENVIRONMENT`, `nexus`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.09585289514866979 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `useApp`, `Propostas de catálogo e texto`, `types.ts`, `classification`, `MetaIndex`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.06376811594202898 - nodes in this community are weakly interconnected._