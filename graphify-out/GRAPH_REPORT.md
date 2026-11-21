# Graph Report - knowledge-nexus.github.io  (2026-11-21)

## Corpus Check
- 239 files · ~174,864 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3244 nodes · 9960 edges · 112 communities (90 shown, 22 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 981 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `702de735`
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
- R2BlobStore
- review.py
- ErrorBox
- access.ts
- DataSource
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- .run
- types.ts
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
- index.html (entrada da interface)
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
- pytest
- GitHubDataSource
- Layout e ajuda
- Projectos de código
- Contas no Worker do Cloudflare (D1)
- sqlalchemy
- useDragScroll
- Configuração do Biome
- User
- run.py
- Gestão dos acessos
- Button
- test_serve.py
- Document
- Dependências de desenvolvimento
- store.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- ProcessResult
- Git
- raspberry-pi/instalar.sh
- PartsIncomplete
- Skills de revisão e catálogo
- Modo de leitura
- Privacidade e CSP
- annotations.ts
- Skill processar depósito
- shutil
- FakeGitHub
- extract/__init__.py
- Classifier
- _Corpus
- index.js
- read_yaml
- Workflow Pages
- Estrutura do repositório de dados
- Card
- Skills do Claude Code no repositório de dados
- env
- SKILL.md
- Processamento local (nexus servir)
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- search.py
- Configuração Vite
- screenshots.spec.ts
- reclassificar
- signals.py
- Regra 1: nunca pôr material real neste repositório
- _QuietGit
- test_push_logs_rejection_reason
- serve
- Migração dos códigos (D1)
- Projecto Python
- Record

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
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `Ramo indices (órfão, um só commit)` --references--> `publish_index_branch()`  [INFERRED]
  docs/arquitectura.md → backend/nexus/publish.py
- `Unidade curricular (cadeira)` --references--> `CurricularUnit`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/catalog.py
- `Extracção (texto/<sha>/meta.json)` --references--> `ExtractionMeta`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/extraction.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (112 total, 22 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.05
Nodes (82): alembic_config(), extract_file(), docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes() (+74 more)

### Community 1 - "useApp"
Cohesion: 0.07
Nodes (62): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), Home(), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat() (+54 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (44): Catalog, contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman(), sequel_after(), series_number() (+36 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (57): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Notice(), CatalogBundle, CourseRow, UnitRow (+49 more)

### Community 4 - "_repo"
Cohesion: 0.09
Nodes (35): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+27 more)

### Community 5 - "Record"
Cohesion: 0.09
Nodes (25): Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet, _blocks(), build() (+17 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.07
Nodes (14): GitHub, GitHubApiError, Repo, Api, candidate_files(), _move(), Pending, _remove_empty_dirs() (+6 more)

### Community 7 - "R2BlobStore"
Cohesion: 0.08
Nodes (16): migrate_originals(), MigrationReport, HybridBlobStore, missing_credentials(), QuotaExceeded, R2BlobStore, _s3_client(), StorageUnavailable (+8 more)

### Community 8 - "review.py"
Cohesion: 0.15
Nodes (9): CatalogProposal, accept_unit_proposal(), describe(), _get(), propose(), resolve(), ReviewError, set_proposal_status() (+1 more)

### Community 9 - "ErrorBox"
Cohesion: 0.24
Nodes (15): AccountSession, siteLink(), AccountCard(), AccountsManager(), accountState(), CopyField(), dateOnly(), endOfDay() (+7 more)

### Community 10 - "access.ts"
Cohesion: 0.12
Nodes (25): submit(), submit(), accessesKey(), AccessManager(), change(), remember(), AccessEntry, AccessState (+17 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.13
Nodes (40): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+32 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (45): IconTrash(), downloadOriginal(), QuestionsToVerify(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog() (+37 more)

### Community 14 - "Página de entrada"
Cohesion: 0.08
Nodes (54): Página de apresentação e popups de entrada, App(), queryClient, signOutAccount(), WelcomeOrHome(), WelcomeRoute(), BrandBanner(), IconShield() (+46 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.15
Nodes (19): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+11 more)

### Community 16 - "DataRepo"
Cohesion: 0.09
Nodes (28): DataRepo, DataRepoError, near_duplicate_pairs(), _catalog_failed(), deposit_status(), _failed(), _log_fields(), _short() (+20 more)

### Community 18 - "types.ts"
Cohesion: 0.06
Nodes (60): ButtonVariant, certaintyLevel(), ConfidenceBadge(), EditButton(), ErrorBox(), methodKind(), ReasonList(), ReasonText() (+52 more)

### Community 19 - "pathlib"
Cohesion: 0.15
Nodes (8): GitError, RemoteBusy, _check_target(), github_slug(), PublicResult, PublishError, _read_original(), is_offline()

### Community 20 - "classification"
Cohesion: 0.06
Nodes (32): CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost (+24 more)

### Community 21 - "source.ts"
Cohesion: 0.09
Nodes (29): ACTIVE, AppContext, AppData, LAG_INTERVAL_MS, WorkflowRun, APP_REPOSITORY, buildLotes(), IndexLag (+21 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.13
Nodes (26): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+18 more)

### Community 23 - "Reason"
Cohesion: 0.10
Nodes (29): CurricularUnit, Alternative, Reason, contains_phrase(), pick(), _text_only(), unit_features(), Candidate (+21 more)

### Community 24 - "MetaIndex"
Cohesion: 0.05
Nodes (36): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), pesquisa.db.gz (FTS5 pages_fts), dir, hasIndex, vectors, Bind (+28 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.16
Nodes (11): clearCache(), Entry, getCached(), openDb(), putCached(), fetchPublicManifest(), get(), pad() (+3 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.20
Nodes (14): ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack(), _unpack_7z() (+6 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (41): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+33 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.14
Nodes (12): BlobRef, Review, Source, expected_extractor(), mime_of(), sha256_file(), DepositItem, default_cache_dir() (+4 more)

### Community 29 - "index.html (entrada da interface)"
Cohesion: 0.25
Nodes (6): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none)

### Community 30 - "pdf.ts"
Cohesion: 0.13
Nodes (18): closeOnRemoval(), openPdf(), OutlineEntry, pageSize(), PdfDocument, pdfOutline(), PdfPage, pdfPath() (+10 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (35): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+27 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.08
Nodes (18): COMPARE_MAX_FILES, Comparison, encodePath(), GitHubClient, GitHubError, RepoInfo, toBase64(), TreeEntry (+10 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.04
Nodes (43): _v2_duplicate_of(), Depósito (envio sem organizar), Detecção de cópias ao depositar (ownedSha), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 5: abertura a outros utilizadores, Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo) (+35 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.12
Nodes (6): remove_course(), Layout, _render(), scaffold(), ScaffoldReport, Criar e remover cursos (courses_remove)

### Community 38 - "pipeline"
Cohesion: 0.29
Nodes (7): pipeline, if, secrets, uses, with, app-ref, reclassify

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "test_public.py"
Cohesion: 0.08
Nodes (24): _auth_env(), build_public_site(), _digest(), publish_public(), data_root(), fixed_clock(), git_root(), has() (+16 more)

### Community 42 - "proxy.js"
Cohesion: 0.18
Nodes (21): effectiveRole(), requireAdmin(), adminLogin(), dataRepo(), github(), ownerLogin(), accountTrailer(), json() (+13 more)

### Community 43 - "pytest"
Cohesion: 0.23
Nodes (12): ArchiveSettings, test_document_visibility_values(), test_field_value_rejects_unknown_method(), test_7z_is_supported(), test_code_bundle_is_deterministic(), test_junk_is_dropped_and_order_is_stable(), test_rejects_unsafe_paths(), test_tar_is_supported() (+4 more)

### Community 44 - "GitHubDataSource"
Cohesion: 0.14
Nodes (6): readCurrent(), guestName(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

### Community 45 - "Layout e ajuda"
Cohesion: 0.12
Nodes (30): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBell(), IconBooks(), IconHelp() (+22 more)

### Community 46 - "Projectos de código"
Cohesion: 0.16
Nodes (17): CodeProjectSettings, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in(), find_projects() (+9 more)

### Community 47 - "Contas no Worker do Cloudflare (D1)"
Cohesion: 0.25
Nodes (8): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Originais no Cloudflare R2 (opcional), Abertura de PDFs por partes (PDFDataRangeTransport), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite)

### Community 48 - "sqlalchemy"
Cohesion: 0.14
Nodes (5): upgrade(), upgrade(), upgrade(), upgrade(), upgrade()

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "User"
Cohesion: 0.13
Nodes (18): User, effective_visibility(), is_public(), type_key(), Visibility, public_documents(), parse_visibility(), set_document_visibility() (+10 more)

### Community 52 - "run.py"
Cohesion: 0.06
Nodes (27): fixed(), now(), BundleRef, DocumentKind, Manifest, PageMeta, slugify(), bundle_id() (+19 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.15
Nodes (31): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), AccessRow(), addDays(), rename(), renew() (+23 more)

### Community 54 - "Button"
Cohesion: 0.10
Nodes (42): DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), TextPane(), useBinary(), Drag, IconDownload() (+34 more)

### Community 55 - "test_serve.py"
Cohesion: 0.14
Nodes (15): remote_has_news(), serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_busy_remote_is_not_an_error(), busy(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed() (+7 more)

### Community 56 - "Document"
Cohesion: 0.08
Nodes (13): Document, HistoryEntry, Status, export_tree(), ExportReport, _question_rows(), _required_confidence(), inherit() (+5 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "store.py"
Cohesion: 0.06
Nodes (20): config_dir(), DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section (+12 more)

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
Nodes (7): Git, commit_message(), indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source(), public_key()

### Community 64 - "raspberry-pi/instalar.sh"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.18
Nodes (16): Modo de leitura (Reader), MarkColor, StrokeSize, DEFAULT_PREFS, Fit, lastPage(), loadPrefs(), nextPage() (+8 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.36
Nodes (8): Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta), Marcas de leitura (marcador, sublinhado, caneta), Sessão (identificador aleatório no browser; servidor guarda só um resumo), Tokens de cor da interface (paper, sheet, ink, pen, navy, gold, line), Pedidos do utilizador (mudar nome e palavra-passe; apagar a conta pelo dono)

### Community 71 - "annotations.ts"
Cohesion: 0.10
Nodes (33): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), BASE_WIDTH, COLORS (+25 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "shutil"
Cohesion: 0.19
Nodes (8): detect_extension(), _sniff(), _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.06
Nodes (53): ExtractionSettings, Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), clean_text(), ExtractionError (+45 more)

### Community 76 - "Classifier"
Cohesion: 0.09
Nodes (14): ClassificationSettings, Classification, FieldValue, ExtractionMeta, Term, Vocabularies, Classifier, kept() (+6 more)

### Community 77 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 78 - "index.js"
Cohesion: 0.21
Nodes (17): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+9 more)

### Community 79 - "read_yaml"
Cohesion: 0.06
Nodes (43): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+35 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 83 - "Card"
Cohesion: 0.16
Nodes (25): PublicShell(), Shell(), IconArrowRight(), IconCheckList(), IconInbox(), Card(), Empty(), PageHeader() (+17 more)

### Community 85 - "env"
Cohesion: 0.05
Nodes (43): .github/workflows/nexus.yml do repositório de dados, default, description, type, GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL (+35 more)

### Community 88 - "Processamento local (nexus servir)"
Cohesion: 0.12
Nodes (17): concurrency, cancel-in-progress, group, jobs, name, permissions, actions, contents (+9 more)

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
Nodes (8): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed(), Procedimento para mudar FORMAT_VERSION do repositório de dados

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.06
Nodes (32): Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics(), _strip_reasons(), build_match() (+24 more)

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 101 - "reclassificar"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 103 - "signals.py"
Cohesion: 0.14
Nodes (11): strip_accents(), material_folder(), check(), _raw(), _signal(), group_folder(), Layout, Organização da origem (<inst>/<ano>/<semestre>/<cadeira>) (+3 more)

### Community 106 - "_QuietGit"
Cohesion: 0.22
Nodes (3): wait_until_quiet(), _QuietGit, test_waits_until_the_interface_stops_writing()

### Community 109 - "serve"
Cohesion: 0.20
Nodes (8): app_checkout(), app_has_update(), PublicState, publish_public_if_due(), serve(), test_public_material_is_published_when_it_may_have_changed(), failing(), fake_publish()

### Community 121 - "Record"
Cohesion: 0.08
Nodes (12): Assessment, Record, uuid7(), Removal, Evidence, Enrollments, Group, GroupMember (+4 more)

## Knowledge Gaps
- **12 isolated node(s):** `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 869 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `Estantes, cursos e configuração`, `signals.py`, `review.py`, `Classifier`, `run.py`, `Testes da classificação`, `Reason`, `Document`, `MetaIndex`, `search.py`?**
  _High betweenness centrality (0.090) - this node is a cross-community bridge._
- **Are the 60 inferred relationships involving `DataRepo` (e.g. with `export_tree()` and `build_indices()`) actually correct?**
  _`DataRepo` has 60 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.05055772852383022 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `MetaIndex`, `useApp`, `Propostas de catálogo e texto`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.06664388243335612 - nodes in this community are weakly interconnected._