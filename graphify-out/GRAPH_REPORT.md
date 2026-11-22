# Graph Report - knowledge-nexus.github.io  (2026-11-22)

## Corpus Check
- 244 files · ~181,649 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3323 nodes · 10202 edges · 131 communities (105 shown, 26 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 987 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a706a6c`
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
- AccountsManager.tsx
- AccessManager.tsx
- builder.py
- icons.tsx
- Remover e «A rever»
- WelcomePage.tsx
- conftest.py
- test_questions.py
- .run
- types.ts
- build_indices
- Regras de classificação contra erros conhecidos
- source.ts
- Testes da classificação
- classifier.py
- MetaIndex
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- ._expand_archive
- session.ts
- ReaderPage
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- pytest
- Workflow de CI
- Credencial GitHub do Worker
- read_yaml
- proxy.js
- index.html (entrada da interface)
- Visibility.tsx
- Layout e ajuda
- Projectos de código
- context.tsx
- sqlalchemy
- PdfViewer.tsx
- Configuração do Biome
- write_yaml_if_changed
- bundles.py
- test_r2.py
- UploadPage.tsx
- test_serve.py
- Document
- Dependências de desenvolvimento
- r2.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- CatalogTab.tsx
- Git
- extraction
- ._intake_file
- json
- import_bundle
- Skills de revisão e catálogo
- Reader.tsx
- Privacidade e CSP
- annotations.ts
- Skill processar depósito
- lotes.py
- FakeGitHub
- extract/__init__.py
- .extraction_meta
- Notifications.tsx
- index.js
- Course
- Estrutura do repositório de dados
- Workflow Pages
- _Corpus
- App.tsx
- archives
- env
- SKILL.md
- catalogo/_importar (pedidos de catálogo)
- nexus.yml
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Path
- nexus.yaml do template
- search.py
- classification
- .vocabularies
- screenshots.spec.ts
- config.py
- catalog_io.py
- raspberry-pi/instalar.sh
- source_weights
- github.js
- migrations.py
- nexus.yaml (definições e format_version)
- iniciar
- detect_extension
- pt-PT com grafia pré-Acordo (nunca PT-BR)
- predefinicoes.yaml
- code_projects
- Migração dos códigos (D1)
- Skills do Claude Code no repositório de dados
- Projecto Python
- app-ref
- main
- run.py
- ._catalog_requests

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
- `Vocabulários` --references--> `Vocabularies`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/vocab.py
- `Regras das propostas de catálogo (acceptable, _kind_of, folder_subjects)` --references--> `generic_terms`  [EXTRACTED]
  CLAUDE.md → config/vocabularios.yaml
- `Conjuntos (bundles)` --references--> `BundleRef`  [INFERRED]
  CLAUDE.md → backend/nexus/domain/documents.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (131 total, 26 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.10
Nodes (55): DataRepo, near_duplicate_pairs(), resolve(), pdf_nativo(), deposit(), docs(), _lote(), run() (+47 more)

### Community 1 - "useApp"
Cohesion: 0.08
Nodes (46): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS (+38 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.06
Nodes (38): config_dir(), Catalog, fix_spacing_accents(), roman(), sequel_after(), series_number(), acceptable(), _clean() (+30 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (67): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Button(), ErrorBox(), Notice(), unitColor() (+59 more)

### Community 4 - "RepoOption"
Cohesion: 0.09
Nodes (36): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+28 more)

### Community 5 - "Record"
Cohesion: 0.11
Nodes (20): Generated, SourceRef, Question, QuestionContext, QuestionSet, _blocks(), build(), _check_numbering() (+12 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "R2BlobStore"
Cohesion: 0.12
Nodes (11): migrate_originals(), MigrationReport, _originals(), _sha256(), open_blob_store(), QuotaExceeded, R2BlobStore, _s3_client() (+3 more)

### Community 8 - "review.py"
Cohesion: 0.21
Nodes (6): CatalogProposal, accept_unit_proposal(), propose(), ReviewError, set_proposal_status(), _validate()

### Community 9 - "AccountsManager.tsx"
Cohesion: 0.12
Nodes (23): AccountError, AccountInvite, ACCOUNTS_URL, AccountsConfig, FetchLike, siteLink(), STORAGE_URL, AccountsManager() (+15 more)

### Community 10 - "AccessManager.tsx"
Cohesion: 0.08
Nodes (56): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), submit(), submit(), accessesKey(), AccessManager() (+48 more)

### Community 11 - "builder.py"
Cohesion: 0.11
Nodes (12): Topic, User, effective_visibility(), is_public(), Visibility, _flatten_topics(), _catalog_failed(), deposit_status() (+4 more)

### Community 12 - "icons.tsx"
Cohesion: 0.12
Nodes (41): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+33 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.13
Nodes (29): IconTrash(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove(), RemovedNotice() (+21 more)

### Community 14 - "WelcomePage.tsx"
Cohesion: 0.12
Nodes (38): Página de apresentação e popups de entrada, BrandBanner(), IconGoogle(), IconShield(), IconTicket(), IconUser(), IconUserPlus(), Modal() (+30 more)

### Community 15 - "conftest.py"
Cohesion: 0.22
Nodes (7): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo()

### Community 16 - "test_questions.py"
Cohesion: 0.18
Nodes (19): review(), blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused() (+11 more)

### Community 18 - "types.ts"
Cohesion: 0.06
Nodes (64): ButtonVariant, certaintyLevel(), ConfidenceBadge(), EditButton(), methodKind(), ReasonList(), ReasonText(), SPINES (+56 more)

### Community 19 - "build_indices"
Cohesion: 0.09
Nodes (18): export_tree(), ExportReport, build_indices(), BuildResult, _dump(), _file_info(), _strip_reasons(), _auth_env() (+10 more)

### Community 20 - "Regras de classificação contra erros conhecidos"
Cohesion: 0.11
Nodes (14): _text_only(), CLASSIFIER_VERSION (reclassificação), Versão do extractor (provoca nova extracção), prior, type_prior, neutral_folders, Classificação heurística e explicável, Etapa 3: reconciliação (classificar, arrumar ou rever) (+6 more)

### Community 21 - "source.ts"
Cohesion: 0.08
Nodes (26): AccountSession, RepoInfo, readCurrent(), RepoRef, GuestInfo, guestName(), APP_REPOSITORY, buildLotes() (+18 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.12
Nodes (28): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+20 more)

### Community 23 - "classifier.py"
Cohesion: 0.06
Nodes (51): ClassificationSettings, Alternative, Classification, FieldValue, Reason, ExtractionMeta, contains_phrase(), contains_unit_phrase() (+43 more)

### Community 24 - "MetaIndex"
Cohesion: 0.11
Nodes (13): DocumentFilter, JSON_DOC_COLUMNS, MetaIndex, parse(), parsePages(), toDocument(), CourseUnitRow, DocumentRow (+5 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (17): manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), AppData, WorkflowRun (+9 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.15
Nodes (18): archive_format(), archive_names(), ArchiveToolMissing, _bad(), _Budget, _collect_staged(), _copy_limited(), Entry (+10 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (41): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, color (+33 more)

### Community 28 - "._expand_archive"
Cohesion: 0.17
Nodes (7): BlobRef, expected_extractor(), mime_of(), default_cache_dir(), Pipeline, _Staging, is_archive_name()

### Community 29 - "session.ts"
Cohesion: 0.20
Nodes (11): react-dom@^19.3.0, App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession() (+3 more)

### Community 30 - "ReaderPage"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (28): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+20 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.09
Nodes (14): COMPARE_MAX_FILES, Comparison, encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, BranchBusyError (+6 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.07
Nodes (27): Depósito (envio sem organizar), Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20), Repositório da aplicação (público, GitHub Pages), GitHub Actions como worker (concurrency), CSP estrita e noindex, Fluxo de depósito (browser para deposito/<login>/<lote>) (+19 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.13
Nodes (6): Layout, current_version(), _render(), scaffold(), ScaffoldReport, test_migrations_apply_in_order()

### Community 38 - "pytest"
Cohesion: 0.19
Nodes (13): ArchiveSettings, BadArchiveError, UnsafeArchiveError, test_7z_is_supported(), test_code_bundle_is_deterministic(), test_format_comes_from_the_content_not_the_name(), test_junk_is_dropped_and_order_is_stable(), test_rejects_unsafe_paths() (+5 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "read_yaml"
Cohesion: 0.14
Nodes (21): read_yaml(), type_key(), parse_visibility(), set_document_visibility(), set_type_visibility(), set_unit_visibility(), SharingError, search_doc_ids() (+13 more)

### Community 42 - "proxy.js"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "index.html (entrada da interface)"
Cohesion: 0.25
Nodes (6): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none)

### Community 44 - "Visibility.tsx"
Cohesion: 0.21
Nodes (17): IconArrowRight(), IconGlobe(), IconLock(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility(), choose() (+9 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.15
Nodes (25): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+17 more)

### Community 46 - "Projectos de código"
Cohesion: 0.14
Nodes (19): CodeProjectSettings, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in(), find_projects() (+11 more)

### Community 47 - "context.tsx"
Cohesion: 0.07
Nodes (35): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts), ACTIVE, AppContext, LAG_INTERVAL_MS (+27 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.06
Nodes (22): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas (+14 more)

### Community 49 - "PdfViewer.tsx"
Cohesion: 0.09
Nodes (25): Abertura de PDFs por partes (PDFDataRangeTransport), Drag, useDragScroll(), pageUnitsHeight(), closeOnRemoval(), openPdf(), OutlineEntry, pageSize() (+17 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "write_yaml_if_changed"
Cohesion: 0.13
Nodes (10): fixed(), now(), dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed() (+2 more)

### Community 52 - "bundles.py"
Cohesion: 0.10
Nodes (17): DocumentKind, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup, project_folders() (+9 more)

### Community 53 - "test_r2.py"
Cohesion: 0.21
Nodes (6): FakeS3, _file(), _NotFound, test_hard_cut_when_over_limit(), test_migrate_originals(), test_put_materialize_and_dedup()

### Community 54 - "UploadPage.tsx"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "test_serve.py"
Cohesion: 0.06
Nodes (32): migrate(), app_checkout(), app_has_update(), is_offline(), only_personal(), public_key(), PublicState, publish_public_if_due() (+24 more)

### Community 56 - "Document"
Cohesion: 0.11
Nodes (7): Document, _question_rows(), member_name(), public_documents(), eligibility(), pending(), pending()

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.08
Nodes (33): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @tailwindcss/vite@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7 (+25 more)

### Community 58 - "r2.py"
Cohesion: 0.11
Nodes (4): BlobStore, GitRepoBlobStore, HybridBlobStore, Originais no Cloudflare R2 (opcional)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (9): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+1 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "CatalogTab.tsx"
Cohesion: 0.23
Nodes (15): ProposalRow, AcceptAll(), run(), catalogBundle(), CatalogTab(), defaultSlug(), Evidence(), InstitutionChoice (+7 more)

### Community 63 - "Git"
Cohesion: 0.09
Nodes (12): _main(), Git, GitError, RemoteBusy, commit_message(), indices_up_to_date(), process_and_publish(), ProcessResult (+4 more)

### Community 64 - "extraction"
Cohesion: 0.22
Nodes (9): extraction, ai_transcription_confidence, max_xlsx_cols, max_xlsx_rows, min_native_chars_per_page, ocr_dpi, ocr_languages, ocr_timeout_seconds (+1 more)

### Community 65 - "._intake_file"
Cohesion: 0.19
Nodes (6): uuid7(), Source, sha256_file(), DepositItem, ItemError, PartsIncomplete

### Community 66 - "json"
Cohesion: 0.10
Nodes (16): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+8 more)

### Community 67 - "import_bundle"
Cohesion: 0.18
Nodes (10): test_catalog_import_is_idempotent(), test_catalog_import_rejects_bad_slug(), test_catalog_import_rejects_unknown_unit_reference(), test_catalog_request_adds_aliases_without_losing_existing(), test_catalog_request_keeps_fields_it_does_not_mention(), test_document_visibility_values(), test_field_value_rejects_unknown_method(), test_normalize_unifies_spellings() (+2 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Reader.tsx"
Cohesion: 0.15
Nodes (18): Modo de leitura (Reader), Marcas de leitura, MarkColor, PAGE_UNITS, StrokeSize, DEFAULT_PREFS, Fit, lastPage() (+10 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.36
Nodes (8): Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta), Marcas de leitura (marcador, sublinhado, caneta), Sessão (identificador aleatório no browser; servidor guarda só um resumo), Tokens de cor da interface (paper, sheet, ink, pen, navy, gold, line), Pedidos do utilizador (mudar nome e palavra-passe; apagar a conta pelo dono)

### Community 71 - "annotations.ts"
Cohesion: 0.10
Nodes (33): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, scope(), useMarkEditor() (+25 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "lotes.py"
Cohesion: 0.27
Nodes (6): _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.06
Nodes (53): ExtractionSettings, Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), PageMeta, clean_text() (+45 more)

### Community 76 - ".extraction_meta"
Cohesion: 0.20
Nodes (5): describe(), native_pages(), still_in_file(), describe(), test_pending_and_still_in_file()

### Community 77 - "Notifications.tsx"
Cohesion: 0.38
Nodes (8): IconBell(), More(), NotificationList(), Notifications(), requestDate(), Section(), validDate(), problemCount()

### Community 78 - "index.js"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 79 - "Course"
Cohesion: 0.15
Nodes (8): Course, unit_key(), UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Unidade curricular (cadeira)

### Community 80 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (33): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+25 more)

### Community 82 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 83 - "App.tsx"
Cohesion: 0.14
Nodes (43): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+35 more)

### Community 84 - "archives"
Cohesion: 0.25
Nodes (8): archives, keep_whole, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "catalogo/_importar (pedidos de catálogo)"
Cohesion: 0.29
Nodes (6): Editar ou remover uma cadeira (units_remove, merge_into), Nomes alternativos acumulam (_ADDITIVE), Etapa 1: pedidos de catálogo, Fluxo de revisão (patch method: user, depois reviewed), Proposta de catálogo, catalogo/_importar (pedidos de catálogo)

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

### Community 92 - "Path"
Cohesion: 0.22
Nodes (4): _v1_visibility_inherits(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed()

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.07
Nodes (29): build_match(), _code_fingerprint(), create_search_db(), _gzip(), merge_hits(), PageRow, _prune_cache(), SearchBackend (+21 more)

### Community 95 - "classification"
Cohesion: 0.25
Nodes (8): classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost, header_chars, required_fields, required_for_assessments

### Community 96 - ".vocabularies"
Cohesion: 0.14
Nodes (11): _v2_duplicate_of(), _required_confidence(), Detecção de cópias ao depositar (ownedSha), Remover documentos (caixote do lixo, removed: {at, by}), Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Blob, Cópias e duplicados (duplicate_of, near_duplicates_dismissed) (+3 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 98 - "config.py"
Cohesion: 0.20
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 99 - "catalog_io.py"
Cohesion: 0.14
Nodes (18): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+10 more)

### Community 100 - "raspberry-pi/instalar.sh"
Cohesion: 0.37
Nodes (11): as_nexus(), ask(), info(), install_all(), say(), set_env(), instalar.sh script, uninstall() (+3 more)

### Community 101 - "source_weights"
Cohesion: 0.25
Nodes (8): source_weights, archive, body, filename, header, layout, metadata, path

### Community 102 - "github.js"
Cohesion: 0.23
Nodes (14): adminCache, adminLogin(), appJwt(), dataRepo(), der(), derLength(), HEADERS, importAppKey() (+6 more)

### Community 104 - "nexus.yaml (definições e format_version)"
Cohesion: 0.17
Nodes (9): DataRepoError, missing_credentials(), Serviço knowledge-nexus no Raspberry Pi, Credenciais NEXUS_R2_* (R2 API token), Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Configurar a página pública (estudo-publico), Processar num Raspberry Pi (guia de instalação) (+1 more)

### Community 108 - "predefinicoes.yaml"
Cohesion: 0.33
Nodes (5): dedup, min_words, near_duplicate_max_hamming, limits, max_file_bytes

### Community 109 - "code_projects"
Cohesion: 0.33
Nodes (6): code_projects, code_extensions, code_ratio, ignored_dirs, markers, min_code_files

### Community 117 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 121 - "run.py"
Cohesion: 0.05
Nodes (23): Record, BundleRef, HistoryEntry, Manifest, Removal, Review, Status, Evidence (+15 more)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 904 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `classifier.py` to `Propostas de catálogo e texto`, `Estantes, cursos e configuração`, `import_bundle`, `review.py`, `builder.py`, `extract/__init__.py`, `.extraction_meta`, `pt-PT com grafia pré-Acordo (nunca PT-BR)`, `build_indices`, `Testes da classificação`, `run.py`, `search.py`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `DataRepo` (e.g. with `Vocabularies` and `export_tree()`) actually correct?**
  _`DataRepo` has 61 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.09649122807017543 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `useApp`, `pt-PT com grafia pré-Acordo (nunca PT-BR)`, `context.tsx`, `types.ts`, `classifier.py`?**
  _High betweenness centrality (0.084) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.08032786885245902 - nodes in this community are weakly interconnected._