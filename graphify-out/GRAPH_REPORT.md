# Graph Report - knowledge-nexus.github.io  (2026-11-24)

## Corpus Check
- 244 files · ~182,738 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3335 nodes · 10229 edges · 130 communities (108 shown, 22 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 989 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a11527ec`
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
- types.ts
- useApp
- AccessManager.tsx
- DataRepo
- icons.tsx
- RemoveDocuments.tsx
- WelcomePage.tsx
- run.py
- test_questions.py
- import_bundle
- types.ts
- public.py
- Regras de classificação contra erros conhecidos
- source.ts
- Testes da classificação
- Reason
- MetaIndex
- Fontes de dados e cache
- unpack.py
- document_types
- ._expand_archive
- classifier.py
- Classifier
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- extract_file
- Workflow de CI
- Credencial GitHub do Worker
- read_yaml
- proxy.js
- Layout.tsx
- base.py
- config.py
- Projectos de código
- office.py
- sqlalchemy
- pdf.ts
- Configuração do Biome
- write_yaml_if_changed
- bundles.py
- pdf.py
- UploadPage.tsx
- test_serve.py
- Document
- Visibility.tsx
- GitRepoBlobStore
- Utilitários e cofre de códigos
- pytest
- Configuração TypeScript
- devDependencies
- Git
- extraction
- GitHubDataSource
- json
- Record
- ReaderPage
- Reader.tsx
- Privacidade e CSP
- annotations.ts
- Skill /rever-classificacoes
- filetypes.py
- FakeGitHub
- extract/__init__.py
- git.py
- scaffold/__init__.py
- index.js
- vigiar-deposito.sh
- app.spec.ts
- Workflow Pages
- servir
- ErrorBox
- lotes.py
- env
- SKILL.md
- Documento (cópia lógica por utilizador)
- nexus.yml
- Scripts da interface
- Fase 2: enriquecimento, transcrição e banco de perguntas
- Migração das contas (D1)
- screenshots.spec.ts
- nexus.yaml do template
- builder.py
- publish.py
- Regra 1: nunca pôr material real neste repositório
- accept_unit_proposal
- session.ts
- catalog_io.py
- raspberry-pi/instalar.sh
- _Corpus
- pt-PT com grafia pré-Acordo (nunca PT-BR)
- archives
- classification
- intake.py
- source_weights
- vite.config.ts
- useDragScroll
- Migração dos códigos (D1)
- _QuietGit
- Projecto Python
- app-ref
- predefinicoes.yaml
- code_projects
- migrations.py
- main

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
- `Blob` --references--> `BlobRef`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/documents.py
- `Extracção (texto/<sha>/meta.json)` --references--> `ExtractionMeta`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/extraction.py
- `Vocabulários` --references--> `Vocabularies`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/vocab.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (130 total, 22 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.09
Nodes (54): pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user(), test_archive_with_code_project_and_nested_zip() (+46 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.08
Nodes (39): Página da cadeira (UnitDetail), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconStack() (+31 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (44): Catalog, contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman(), sequel_after(), series_number() (+36 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (60): Biblioteca em estantes curso e ano, Sugestões ao registar (lista de referência pt.json), SuggestInput(), Badge(), Button(), unitColor(), CatalogBundle, CourseRow (+52 more)

### Community 4 - "_repo"
Cohesion: 0.10
Nodes (34): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+26 more)

### Community 5 - "Record"
Cohesion: 0.08
Nodes (27): Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet, _question_rows(), _blocks() (+19 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "r2.py"
Cohesion: 0.09
Nodes (15): migrate_originals(), MigrationReport, _originals(), _sha256(), QuotaExceeded, R2BlobStore, _s3_client(), unavailable_message() (+7 more)

### Community 8 - "types.ts"
Cohesion: 0.06
Nodes (41): Procedimento para mudar o esquema do índice, ACTIVE, AppContext, LAG_INTERVAL_MS, useSearchIndex(), dir, hasIndex, vectors (+33 more)

### Community 9 - "useApp"
Cohesion: 0.10
Nodes (32): IconBell(), useApp(), DepositState, ProposalRow, AcceptAll(), run(), catalogBundle(), CatalogTab() (+24 more)

### Community 10 - "AccessManager.tsx"
Cohesion: 0.10
Nodes (43): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), accessesKey(), AccessManager(), change(), AccessRow() (+35 more)

### Community 11 - "DataRepo"
Cohesion: 0.09
Nodes (20): now(), DataRepo, User, effective_visibility(), is_public(), type_key(), Visibility, export_tree() (+12 more)

### Community 12 - "icons.tsx"
Cohesion: 0.15
Nodes (31): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+23 more)

### Community 13 - "RemoveDocuments.tsx"
Cohesion: 0.12
Nodes (36): TextPane(), IconDownload(), IconTrash(), ClassificationFields(), DocumentPage(), downloadOriginal(), Reader(), labelOf() (+28 more)

### Community 14 - "WelcomePage.tsx"
Cohesion: 0.10
Nodes (41): Página de apresentação e popups de entrada, BrandBanner(), IconShield(), IconTicket(), IconUser(), IconUserPlus(), Modal(), AccountError (+33 more)

### Community 15 - "run.py"
Cohesion: 0.12
Nodes (6): _Dumper, _str_representer(), uuid7(), Evidence, ExportReport, test_uuid7_is_version_7_and_sortable()

### Community 16 - "test_questions.py"
Cohesion: 0.11
Nodes (26): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo(), blocks() (+18 more)

### Community 17 - "import_bundle"
Cohesion: 0.12
Nodes (18): CatalogError, _check_slug(), _given(), import_bundle(), ImportReport, load_catalog(), _merge(), remove_course() (+10 more)

### Community 18 - "types.ts"
Cohesion: 0.06
Nodes (59): Editar no sítio (lápis, method: user), Nome dado pelo dono (classification.title), Montagem da aplicação (#root e /src/main.tsx), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList() (+51 more)

### Community 19 - "public.py"
Cohesion: 0.16
Nodes (10): _auth_env(), _check_target(), _digest(), github_slug(), PublicResult, publish_public(), PublishError, _read_original() (+2 more)

### Community 20 - "Regras de classificação contra erros conhecidos"
Cohesion: 0.12
Nodes (12): _text_only(), CLASSIFIER_VERSION (reclassificação), Versão do extractor (provoca nova extracção), prior, type_prior, Classificação heurística e explicável, Etapa 3: reconciliação (classificar, arrumar ou rever), Confiança: melhor / (melhor + segundo + prior) (+4 more)

### Community 21 - "source.ts"
Cohesion: 0.10
Nodes (24): AccountSession, AppData, RepoInfo, RepoRef, GuestInfo, APP_REPOSITORY, buildLotes(), IndexLag (+16 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.12
Nodes (27): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+19 more)

### Community 23 - "Reason"
Cohesion: 0.15
Nodes (18): Reason, pick(), unit_features(), Candidate, rank(), _acronym_in(), compile_unit(), add() (+10 more)

### Community 24 - "MetaIndex"
Cohesion: 0.11
Nodes (11): MetaIndex, parse(), toDocument(), DocumentRow, QuestionRow, UserRow, Decision, ExamQuestions() (+3 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.06
Nodes (18): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun (+10 more)

### Community 26 - "unpack.py"
Cohesion: 0.16
Nodes (17): archive_format(), archive_names(), ArchiveToolMissing, _bad(), _Budget, _collect_staged(), _copy_limited(), Entry (+9 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (43): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, color (+35 more)

### Community 28 - "._expand_archive"
Cohesion: 0.11
Nodes (10): BlobRef, Review, Source, expected_extractor(), sha256_file(), DepositItem, ItemError, PartsIncomplete (+2 more)

### Community 29 - "classifier.py"
Cohesion: 0.10
Nodes (19): ClassificationSettings, Alternative, ExtractionMeta, contains_phrase(), Term, Vocabularies, material_folder(), check() (+11 more)

### Community 30 - "Classifier"
Cohesion: 0.12
Nodes (8): Classification, FieldValue, inherit(), Classifier, weak(), Outcome, Signal, score_dates()

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (36): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+28 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (33): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+25 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.10
Nodes (13): AccountsApi, submit(), submit(), remember(), codesKey(), storeCode(), storedCodes(), api (+5 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.08
Nodes (19): COMPARE_MAX_FILES, Comparison, encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, BranchBusyError (+11 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.07
Nodes (27): migrar(), scaffold(), vigiar(), Depósito (envio sem organizar), Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20), Repositório da aplicação (público, GitHub Pages) (+19 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.09
Nodes (10): Layout, current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+2 more)

### Community 38 - "extract_file"
Cohesion: 0.22
Nodes (12): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_pdf_ocr_parallel_keeps_page_order() (+4 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "read_yaml"
Cohesion: 0.21
Nodes (15): read_yaml(), search_doc_ids(), _configure(), _doc_of(), _prepare(), test_cli_type_visibility(), test_cli_visibility(), test_effective_visibility_follows_unit_then_document() (+7 more)

### Community 42 - "proxy.js"
Cohesion: 0.13
Nodes (30): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), canRead(), canWrite() (+22 more)

### Community 43 - "Layout.tsx"
Cohesion: 0.20
Nodes (20): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+12 more)

### Community 44 - "base.py"
Cohesion: 0.17
Nodes (10): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), MissingToolError, _has_osd(), ocr_image() (+2 more)

### Community 45 - "config.py"
Cohesion: 0.20
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 46 - "Projectos de código"
Cohesion: 0.19
Nodes (13): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+5 more)

### Community 47 - "office.py"
Cohesion: 0.27
Nodes (11): clean_text(), require(), which(), extract_docx(), extract_legacy(), extract_pptx(), libreoffice_convert(), _markdown_table() (+3 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.11
Nodes (8): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Fase 5: abertura a outros utilizadores, Esquema relacional de partida para a fase 5

### Community 49 - "pdf.ts"
Cohesion: 0.14
Nodes (28): DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), useBinary(), pageUnitsHeight(), closeOnRemoval(), openPdf() (+20 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "write_yaml_if_changed"
Cohesion: 0.33
Nodes (5): dump_yaml(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), test_yaml_is_deterministic_and_keeps_unknown_fields()

### Community 52 - "bundles.py"
Cohesion: 0.10
Nodes (18): BundleRef, DocumentKind, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup (+10 more)

### Community 53 - "pdf.py"
Cohesion: 0.19
Nodes (7): ExtractionSettings, looks_mathematical(), extract_pdf(), ocr_workers(), pdf_pages(), collect(), test_ocr_workers_respect_the_machine_limit()

### Community 54 - "UploadPage.tsx"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "test_serve.py"
Cohesion: 0.09
Nodes (19): app_checkout(), is_broken(), only_personal(), serve(), serve_once(), _git(), test_a_broken_disk_exits_for_the_bat_to_restart_wsl(), test_a_broken_disk_in_the_update_check_also_exits() (+11 more)

### Community 56 - "Document"
Cohesion: 0.06
Nodes (17): Document, HistoryEntry, Status, member_name(), filed_name(), original_stem(), unique_name(), Pipeline (+9 more)

### Community 57 - "Visibility.tsx"
Cohesion: 0.16
Nodes (22): IconArrowRight(), IconGlobe(), IconLock(), Notice(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility() (+14 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.23
Nodes (18): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+10 more)

### Community 60 - "pytest"
Cohesion: 0.17
Nodes (15): ArchiveSettings, BadArchiveError, UnsafeArchiveError, test_document_visibility_values(), test_field_value_rejects_unknown_method(), test_7z_is_supported(), test_code_bundle_is_deterministic(), test_format_comes_from_the_content_not_the_name() (+7 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "devDependencies"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 63 - "Git"
Cohesion: 0.14
Nodes (8): Git, app_has_update(), public_key(), PublicState, publish_public_if_due(), remote_has_news(), wait_until_quiet(), Processamento local (nexus servir)

### Community 64 - "extraction"
Cohesion: 0.22
Nodes (9): extraction, ai_transcription_confidence, max_xlsx_cols, max_xlsx_rows, min_native_chars_per_page, ocr_dpi, ocr_languages, ocr_timeout_seconds (+1 more)

### Community 65 - "GitHubDataSource"
Cohesion: 0.18
Nodes (5): guestName(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

### Community 66 - "json"
Cohesion: 0.10
Nodes (15): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+7 more)

### Community 67 - "Record"
Cohesion: 0.13
Nodes (9): Assessment, Record, Removal, Enrollments, Group, GroupMember, Preferences, Sharing (+1 more)

### Community 68 - "ReaderPage"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 69 - "Reader.tsx"
Cohesion: 0.11
Nodes (29): Modo de leitura (Reader), Marcas de leitura, Markdown(), OutlineEntry, ChromeButton(), OutlineList(), PageSource, ReaderText() (+21 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.15
Nodes (15): Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura) (+7 more)

### Community 71 - "annotations.ts"
Cohesion: 0.11
Nodes (32): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+24 more)

### Community 72 - "Skill /rever-classificacoes"
Cohesion: 0.06
Nodes (41): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /processar-deposito, nexus processar --json (+33 more)

### Community 73 - "filetypes.py"
Cohesion: 0.31
Nodes (3): detect_extension(), mime_of(), _sniff()

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.18
Nodes (13): PageMeta, ExtractionError, ExtractionResult, PageText, archive_listing(), code_project_text(), write_extraction(), extract_xlsx() (+5 more)

### Community 76 - "git.py"
Cohesion: 0.10
Nodes (4): BlobStore, StorageUnavailable, Originais no Cloudflare R2 (opcional), test_push_logs_rejection_reason()

### Community 77 - "scaffold/__init__.py"
Cohesion: 0.14
Nodes (6): fixed(), config_dir(), kept(), _render(), ScaffoldReport, Procedimento para mudar FORMAT_VERSION do repositório de dados

### Community 78 - "index.js"
Cohesion: 0.21
Nodes (17): handleAccounts(), SESSION_PREFIX, sessionUser(), withCors(), allowed(), authCache, handle(), handleBlob() (+9 more)

### Community 79 - "vigiar-deposito.sh"
Cohesion: 0.29
Nodes (7): Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script, UV_PROJECT_ENVIRONMENT

### Community 80 - "app.spec.ts"
Cohesion: 0.21
Nodes (10): CORS, decode(), routeGitHub(), routeWorker(), snapshot, withFakeGitHub(), workerEnv(), workerEnvs (+2 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "servir"
Cohesion: 0.22
Nodes (5): servir(), DataRepoError, EnvironmentBroken, missing_credentials(), Credenciais NEXUS_R2_* (R2 API token)

### Community 83 - "ErrorBox"
Cohesion: 0.12
Nodes (46): Home(), PublicShell(), queryClient, Shell(), buttonClass(), Card(), Empty(), ErrorBox() (+38 more)

### Community 84 - "lotes.py"
Cohesion: 0.27
Nodes (6): _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "Documento (cópia lógica por utilizador)"
Cohesion: 0.09
Nodes (19): _v2_duplicate_of(), Detecção de cópias ao depositar (ownedSha), CSP estrita e noindex, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Material público num repositório público à parte, Campos obrigatórios para arrumar, Pipeline nexus processar (+11 more)

### Community 88 - "nexus.yml"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, reclassificar, jobs, pipeline, name, on (+17 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "Fase 2: enriquecimento, transcrição e banco de perguntas"
Cohesion: 0.18
Nodes (11): Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Extracção (texto/<sha>/meta.json), Flashcard (estado FSRS), Pergunta (banco de perguntas), Simulado, Tentativa (o modo tutor conta as dicas) (+3 more)

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "builder.py"
Cohesion: 0.05
Nodes (36): Topic, BuildResult, _dump(), _file_info(), _flatten_topics(), _strip_reasons(), build_match(), _code_fingerprint() (+28 more)

### Community 95 - "publish.py"
Cohesion: 0.11
Nodes (15): GitError, RemoteBusy, default_cache_dir(), RunReport, commit_message(), indices_up_to_date(), process_and_publish(), ProcessResult (+7 more)

### Community 97 - "accept_unit_proposal"
Cohesion: 0.29
Nodes (7): CatalogProposal, slugify(), accept_unit_proposal(), Fluxo de revisão (patch method: user, depois reviewed), Proposta de catálogo, Estados do documento (received, extracted, classified, filed, enriched, reviewed), test_slugify()

### Community 98 - "session.ts"
Cohesion: 0.31
Nodes (9): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession(), read() (+1 more)

### Community 99 - "catalog_io.py"
Cohesion: 0.10
Nodes (19): export_bundle(), model_to_data(), CatalogBundle, Course, CourseUnitLink, CurricularUnit, Institution, InstitutionBundle (+11 more)

### Community 100 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 102 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 103 - "pt-PT com grafia pré-Acordo (nunca PT-BR)"
Cohesion: 0.25
Nodes (3): Opção file_uncertain_type (tipo por confirmar), file_uncertain_type, Pesquisa FTS5 (texto original e normalizado)

### Community 104 - "archives"
Cohesion: 0.25
Nodes (8): archives, keep_whole, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio

### Community 105 - "classification"
Cohesion: 0.25
Nodes (8): classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost, header_chars, required_fields, required_for_assessments

### Community 106 - "intake.py"
Cohesion: 0.19
Nodes (12): _catalog_failed(), deposit_status(), _failed(), _log_fields(), _short(), is_junk(), _batch_items(), _batch_options() (+4 more)

### Community 107 - "source_weights"
Cohesion: 0.25
Nodes (8): source_weights, archive, body, filename, header, layout, metadata, path

### Community 108 - "vite.config.ts"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 117 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 118 - "predefinicoes.yaml"
Cohesion: 0.33
Nodes (5): dedup, min_words, near_duplicate_max_hamming, limits, max_file_bytes

### Community 121 - "code_projects"
Cohesion: 0.33
Nodes (6): code_projects, code_extensions, code_ratio, ignored_dirs, markers, min_code_files

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 910 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `json`, `Estantes, cursos e configuração`, `pt-PT com grafia pré-Acordo (nunca PT-BR)`, `extract/__init__.py`, `run.py`, `import_bundle`, `Classifier`, `Testes da classificação`, `Reason`, `Document`, `classifier.py`, `builder.py`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `DataRepo` (e.g. with `Vocabularies` and `export_tree()`) actually correct?**
  _`DataRepo` has 61 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.09181784524250278 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `LibraryPage.tsx`, `Propostas de catálogo e texto`, `pt-PT com grafia pré-Acordo (nunca PT-BR)`, `types.ts`, `types.ts`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08470588235294117 - nodes in this community are weakly interconnected._