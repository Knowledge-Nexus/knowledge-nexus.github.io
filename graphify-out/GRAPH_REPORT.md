# Graph Report - knowledge-nexus.github.io  (2026-11-23)

## Corpus Check
- 244 files · ~182,460 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3334 nodes · 10224 edges · 114 communities (96 shown, 18 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 989 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1afef61f`
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
- resolve
- Button
- AccessManager.tsx
- deposit.py
- icons.tsx
- RemoveDocuments.tsx
- WelcomePage.tsx
- pathlib
- test_questions.py
- .run
- types.ts
- public.py
- classification
- source.ts
- Testes da classificação
- classifier.py
- MetaIndex
- Fontes de dados e cache
- unpack.py
- document_types
- ._expand_archive
- signals.py
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
- DocumentFields.tsx
- GitRepoBlobStore
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- visibilidade_tipo
- Git
- extraction
- ._intake_file
- gerar.py
- vigiar
- Skills de revisão e catálogo
- Reader.tsx
- Privacidade e CSP
- annotations.ts
- Skill processar depósito
- filetypes.py
- app.spec.ts
- extract/__init__.py
- Contas no Worker do Cloudflare (D1)
- subprocess
- index.js
- vigiar-deposito.sh
- HelpPage.tsx
- Workflow Pages
- EnvironmentBroken
- useApp
- env
- SKILL.md
- Documento (cópia lógica por utilizador)
- nexus.yml
- Scripts da interface
- Migração das contas (D1)
- nexus.yaml do template
- builder.py
- publish.py
- Material público num repositório público à parte
- Record
- raspberry-pi/instalar.sh
- cli.py
- intake.py
- Migração dos códigos (D1)
- Projecto Python
- app-ref

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

## Communities (114 total, 18 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.10
Nodes (54): DataRepo, pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user() (+46 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.07
Nodes (48): Página da cadeira (UnitDetail), FileBadge(), fileFormat(), FORMATS, IconGlobe(), IconLock(), IconStack(), Badge() (+40 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (43): Catalog, contains_phrase(), contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman(), sequel_after() (+35 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (60): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Notice(), unitColor(), CatalogBundle, CourseRow (+52 more)

### Community 4 - "_repo"
Cohesion: 0.11
Nodes (23): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore(), _fail() (+15 more)

### Community 5 - "Record"
Cohesion: 0.06
Nodes (32): Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet, _question_rows(), _blocks() (+24 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "r2.py"
Cohesion: 0.09
Nodes (18): migrate_originals(), MigrationReport, _originals(), _sha256(), missing_credentials(), open_blob_store(), QuotaExceeded, R2BlobStore (+10 more)

### Community 8 - "resolve"
Cohesion: 0.33
Nodes (4): propose(), resolve(), ReviewError, _validate()

### Community 9 - "Button"
Cohesion: 0.11
Nodes (32): Button(), siteLink(), DepositState, AccountCard(), AccountsManager(), accountState(), CopyField(), dateOnly() (+24 more)

### Community 10 - "AccessManager.tsx"
Cohesion: 0.09
Nodes (42): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), GuestInfo, accessesKey(), AccessManager(), change() (+34 more)

### Community 11 - "deposit.py"
Cohesion: 0.38
Nodes (5): _catalog_failed(), deposit_status(), _failed(), _log_fields(), _short()

### Community 12 - "icons.tsx"
Cohesion: 0.10
Nodes (48): IconArchive(), IconBell(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode() (+40 more)

### Community 13 - "RemoveDocuments.tsx"
Cohesion: 0.14
Nodes (27): IconTrash(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove(), RemovedNotice() (+19 more)

### Community 14 - "WelcomePage.tsx"
Cohesion: 0.08
Nodes (55): Página de apresentação e popups de entrada, App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), BrandBanner(), IconShield(), IconTicket() (+47 more)

### Community 15 - "pathlib"
Cohesion: 0.08
Nodes (11): export_tree(), ExportReport, alembic_config(), catalog_root(), data_root(), fixed_clock(), git_root(), has() (+3 more)

### Community 16 - "test_questions.py"
Cohesion: 0.17
Nodes (18): blocks(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused(), test_a_question_using_an_excluded_case_is_not_shown_either(), test_cli() (+10 more)

### Community 18 - "types.ts"
Cohesion: 0.06
Nodes (63): BundleEditor(), save(), shortPath(), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList() (+55 more)

### Community 19 - "public.py"
Cohesion: 0.14
Nodes (13): GitError, _auth_env(), build_public_site(), _check_target(), _digest(), github_slug(), PublicResult, publish_public() (+5 more)

### Community 20 - "classification"
Cohesion: 0.06
Nodes (31): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+23 more)

### Community 21 - "source.ts"
Cohesion: 0.07
Nodes (32): fflate@^0.8.3, yaml@^2.9.1, AccountSession, AppData, RepoInfo, Change, RepoRef, guestName() (+24 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (30): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+22 more)

### Community 23 - "classifier.py"
Cohesion: 0.11
Nodes (26): Alternative, Reason, Term, pick(), Outcome, unit_features(), Candidate, compile_terms() (+18 more)

### Community 24 - "MetaIndex"
Cohesion: 0.05
Nodes (45): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), Ramo indices (órfão, um só commit), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts), ACTIVE, AppContext (+37 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.06
Nodes (15): manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun, fetchPublicManifest() (+7 more)

### Community 26 - "unpack.py"
Cohesion: 0.07
Nodes (39): ArchiveSettings, _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member(), archive_format() (+31 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (41): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, color (+33 more)

### Community 28 - "._expand_archive"
Cohesion: 0.24
Nodes (4): BlobRef, Review, Pipeline, _Staging

### Community 29 - "signals.py"
Cohesion: 0.13
Nodes (15): ClassificationSettings, ExtractionMeta, slugify(), strip_accents(), Vocabularies, material_folder(), check(), collect_signals() (+7 more)

### Community 30 - "Classifier"
Cohesion: 0.13
Nodes (8): Classification, FieldValue, inherit(), Classifier, weak(), _producer(), Signal, score_dates()

### Community 31 - "package.json"
Cohesion: 0.04
Nodes (62): Montagem da aplicação (#root e /src/main.tsx), dependencies, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+54 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (35): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+27 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.11
Nodes (11): AccountsApi, remember(), codesKey(), storeCode(), storedCodes(), api, loadCodes(), LoadedCodes (+3 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.08
Nodes (17): COMPARE_MAX_FILES, Comparison, encodePath(), FetchLike, GitHubClient, GitHubError, toBase64(), TreeEntry (+9 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.09
Nodes (18): scaffold(), instalar.sh script, Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Skills do Claude Code no repositório de dados, Token fine-grained guardado no browser, Criar o repositório de dados privado, Permissões do token fine-grained (Contents, Actions, Workflows, Metadata) (+10 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.06
Nodes (16): config_dir(), Layout, read_yaml(), current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v3_bundles() (+8 more)

### Community 38 - "extract_file"
Cohesion: 0.18
Nodes (13): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_ocr_workers_respect_the_machine_limit() (+5 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "read_yaml"
Cohesion: 0.10
Nodes (26): User, effective_visibility(), is_public(), type_key(), Visibility, public_documents(), pending(), parse_visibility() (+18 more)

### Community 42 - "proxy.js"
Cohesion: 0.18
Nodes (21): effectiveRole(), requireAdmin(), adminLogin(), dataRepo(), github(), ownerLogin(), accountTrailer(), json() (+13 more)

### Community 43 - "Layout.tsx"
Cohesion: 0.20
Nodes (20): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+12 more)

### Community 44 - "base.py"
Cohesion: 0.22
Nodes (8): ExtractionError, MissingToolError, require(), which(), _has_osd(), ocr_image(), OcrResult, _parse_tsv()

### Community 45 - "config.py"
Cohesion: 0.20
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 46 - "Projectos de código"
Cohesion: 0.16
Nodes (15): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+7 more)

### Community 47 - "office.py"
Cohesion: 0.35
Nodes (11): ExtractionSettings, clean_text(), extract_docx(), extract_legacy(), extract_pptx(), extract_xlsx(), libreoffice_convert(), _markdown_table() (+3 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.08
Nodes (15): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Fase 3: pesquisa semântica, flashcards FSRS e simulados, Fase 5: abertura a outros utilizadores (+7 more)

### Community 49 - "pdf.ts"
Cohesion: 0.11
Nodes (22): Drag, useDragScroll(), pageUnitsHeight(), closeOnRemoval(), openPdf(), pageSize(), PdfDocument, pdfOutline() (+14 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "write_yaml_if_changed"
Cohesion: 0.11
Nodes (13): dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), build() (+5 more)

### Community 52 - "bundles.py"
Cohesion: 0.10
Nodes (19): BundleRef, DocumentKind, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup (+11 more)

### Community 53 - "pdf.py"
Cohesion: 0.23
Nodes (5): looks_mathematical(), extract_pdf(), ocr_workers(), pdf_pages(), collect()

### Community 54 - "UploadPage.tsx"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "test_serve.py"
Cohesion: 0.09
Nodes (17): _git(), _QuietGit, test_a_broken_disk_exits_for_the_bat_to_restart_wsl(), test_a_broken_disk_in_the_update_check_also_exits(), test_app_update_is_seen_only_when_pull_is_safe(), test_busy_remote_is_not_an_error(), test_public_material_is_published_when_it_may_have_changed(), failing() (+9 more)

### Community 56 - "Document"
Cohesion: 0.11
Nodes (5): Document, HistoryEntry, Status, member_name(), describe()

### Community 57 - "DocumentFields.tsx"
Cohesion: 0.24
Nodes (11): Nome dado pelo dono (classification.title), EditButton(), ClassificationFields(), FieldForm(), OPTIONAL, RowField, setUserField(), TitleEditor() (+3 more)

### Community 58 - "GitRepoBlobStore"
Cohesion: 0.10
Nodes (3): BlobStore, GitRepoBlobStore, HybridBlobStore

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.13
Nodes (10): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+2 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "visibilidade_tipo"
Cohesion: 0.20
Nodes (7): visibilidade_cadeira(), visibilidade_documento(), visibilidade_tipo(), Campos obrigatórios para arrumar, Credenciais NEXUS_R2_* (R2 API token), Configurar a página pública (estudo-publico), nexus.yaml (definições e format_version)

### Community 63 - "Git"
Cohesion: 0.09
Nodes (16): Git, indices_up_to_date(), process_and_publish(), _remote_indices_source(), app_checkout(), app_has_update(), is_broken(), only_personal() (+8 more)

### Community 64 - "extraction"
Cohesion: 0.07
Nodes (28): archives, keep_whole, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio (+20 more)

### Community 65 - "._intake_file"
Cohesion: 0.22
Nodes (5): uuid7(), Source, DepositItem, ItemError, PartsIncomplete

### Community 66 - "gerar.py"
Cohesion: 0.23
Nodes (11): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+3 more)

### Community 67 - "vigiar"
Cohesion: 0.27
Nodes (8): vigiar(), Envio em partes de ficheiros grandes (> 10 MB), Lotes zip para muitos ficheiros (>= 20), Fluxo de depósito (browser para deposito/<login>/<lote>), Limites conhecidos (tamanho, tempo, privacidade, índice), Formas de depositar (interface, GitHub, pasta vigiada), deposito/<login>/<lote>/ (entrada e _erros), Referência *.ref.yaml (conteúdo já existente)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Reader.tsx"
Cohesion: 0.18
Nodes (16): Modo de leitura (Reader), Marcas de leitura, MarkColor, PAGE_UNITS, StrokeSize, DEFAULT_PREFS, Fit, lastPage() (+8 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "annotations.ts"
Cohesion: 0.08
Nodes (48): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), draftKey(), dropDraft() (+40 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (18): Skill /processar-deposito, nexus processar --json, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), Estrutura do repositório de dados, deposito/<login>/ (entrada) e _erros/ (falhas com .log) (+10 more)

### Community 73 - "filetypes.py"
Cohesion: 0.31
Nodes (3): detect_extension(), mime_of(), _sniff()

### Community 74 - "app.spec.ts"
Cohesion: 0.08
Nodes (22): @playwright/test@^1.63.0, b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup() (+14 more)

### Community 75 - "extract/__init__.py"
Cohesion: 0.16
Nodes (12): PageMeta, ExtractionResult, PageText, archive_listing(), code_project_text(), write_extraction(), decode_bytes(), extract_image() (+4 more)

### Community 76 - "Contas no Worker do Cloudflare (D1)"
Cohesion: 0.25
Nodes (8): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Originais no Cloudflare R2 (opcional), Abertura de PDFs por partes (PDFDataRangeTransport), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite)

### Community 77 - "subprocess"
Cohesion: 0.50
Nodes (5): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version()

### Community 78 - "index.js"
Cohesion: 0.21
Nodes (17): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+9 more)

### Community 79 - "vigiar-deposito.sh"
Cohesion: 0.29
Nodes (7): Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script, UV_PROJECT_ENVIRONMENT

### Community 80 - "HelpPage.tsx"
Cohesion: 0.33
Nodes (5): Faq, HowItWorks(), Step, STEP_ICONS, STEP_LINKS

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 83 - "useApp"
Cohesion: 0.09
Nodes (64): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+56 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "Documento (cópia lógica por utilizador)"
Cohesion: 0.12
Nodes (11): _v2_duplicate_of(), Detecção de cópias ao depositar (ownedSha), Remover documentos (caixote do lixo, removed: {at, by}), GitHub Actions como worker (concurrency), Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Blob, Cópias e duplicados (duplicate_of, near_duplicates_dismissed) (+3 more)

### Community 88 - "nexus.yml"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, reclassificar, jobs, pipeline, name, on (+17 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "builder.py"
Cohesion: 0.05
Nodes (40): fixed(), now(), Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics() (+32 more)

### Community 95 - "publish.py"
Cohesion: 0.11
Nodes (9): RemoteBusy, default_cache_dir(), commit_message(), ProcessResult, publish_index_branch(), search_cache_dir(), test_push_logs_rejection_reason(), busy() (+1 more)

### Community 96 - "Material público num repositório público à parte"
Cohesion: 0.11
Nodes (10): Depósito (envio sem organizar), Knowledge Nexus (plataforma de estudo), Repositório da aplicação (público, GitHub Pages), CSP estrita e noindex, Material público num repositório público à parte, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez), Segurança e privacidade (+2 more)

### Community 99 - "Record"
Cohesion: 0.04
Nodes (54): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+46 more)

### Community 100 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 104 - "cli.py"
Cohesion: 0.17
Nodes (9): catalogo_propostas(), migrar(), perguntas_pendentes(), _print_json(), processar(), publicar(), revisao_listar(), servir() (+1 more)

### Community 106 - "intake.py"
Cohesion: 0.36
Nodes (7): is_junk(), _batch_items(), _batch_options(), _files_under(), _items_of(), Scan, scan_deposit()

### Community 117 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 910 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `Estantes, cursos e configuração`, `Record`, `extract/__init__.py`, `write_yaml_if_changed`, `bundles.py`, `classification`, `Testes da classificação`, `classifier.py`, `Document`, `builder.py`, `signals.py`, `Classifier`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `DataRepo` (e.g. with `Vocabularies` and `export_tree()`) actually correct?**
  _`DataRepo` has 61 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.10107367641614216 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `MetaIndex`, `Propostas de catálogo e texto`, `types.ts`, `classification`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07305669199298656 - nodes in this community are weakly interconnected._