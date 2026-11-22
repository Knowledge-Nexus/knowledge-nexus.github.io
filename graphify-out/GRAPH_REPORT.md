# Graph Report - knowledge-nexus.github.io  (2026-11-22)

## Corpus Check
- 239 files · ~177,932 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3293 nodes · 10088 edges · 130 communities (104 shown, 26 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 970 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b2b893fd`
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
- conftest.py
- test_questions.py
- .run
- types.ts
- public.py
- Regras de classificação contra erros conhecidos
- source.ts
- Testes da classificação
- Reason
- MetaIndex
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- ._expand_archive
- ReaderPage
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- .save_document
- Workflow de CI
- Credencial GitHub do Worker
- read_yaml
- proxy.js
- index.html (entrada da interface)
- GitHubDataSource
- Layout e ajuda
- Projectos de código
- context.tsx
- sqlalchemy
- PdfViewer.tsx
- Configuração do Biome
- yamlio.py
- bundles.py
- invite.ts
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
- extraction
- ._intake_file
- json
- import_bundle
- Skills de revisão e catálogo
- Reader.tsx
- Privacidade e CSP
- annotations.ts
- Skill processar depósito
- pathlib
- FakeGitHub
- extract/__init__.py
- classifier.py
- ._register
- index.js
- Course
- command
- Workflow Pages
- _Corpus
- App.tsx
- archives
- env
- SKILL.md
- extract_file
- nexus.yml
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- search.py
- classification
- Material público num repositório público à parte
- screenshots.spec.ts
- config.py
- catalog_io.py
- raspberry-pi/instalar.sh
- source_weights
- github.js
- migrations.py
- cli.py
- vite.config.ts
- _QuietGit
- pt-PT com grafia pré-Acordo (nunca PT-BR)
- predefinicoes.yaml
- code_projects
- Migração dos códigos (D1)
- clock.py
- Projecto Python
- app-ref
- filing.py
- Record
- remove_course

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 124 edges
2. `useApp()` - 97 edges
3. `ErrorBox()` - 85 edges
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
- `Repositório de dados (privado)` --references--> `Layout`  [INFERRED]
  docs/repo-dados.md → backend/nexus/datarepo/layout.py
- `Sinais de classificação com pesos configuráveis` --references--> `source_weights`  [INFERRED]
  docs/arquitectura.md → config/predefinicoes.yaml

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (130 total, 26 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.09
Nodes (53): pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user(), test_archive_with_too_many_entries_is_kept_whole() (+45 more)

### Community 1 - "useApp"
Cohesion: 0.07
Nodes (58): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS (+50 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.06
Nodes (40): config_dir(), Catalog, fix_spacing_accents(), normalize(), roman(), sequel_after(), series_number(), acceptable() (+32 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (59): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Notice(), CatalogBundle, CourseRow, UnitRow (+51 more)

### Community 4 - "RepoOption"
Cohesion: 0.12
Nodes (19): catalogo_aceitar(), catalogo_importar(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore(), _fail(), indexar() (+11 more)

### Community 5 - "Record"
Cohesion: 0.10
Nodes (20): Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet, _blocks(), build() (+12 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (18): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+10 more)

### Community 7 - "R2BlobStore"
Cohesion: 0.11
Nodes (13): migrate_originals(), MigrationReport, _originals(), _sha256(), QuotaExceeded, R2BlobStore, FakeS3, _file() (+5 more)

### Community 8 - "review.py"
Cohesion: 0.19
Nodes (6): write_unit(), CurricularUnit, CatalogProposal, accept_unit_proposal(), ReviewError, set_proposal_status()

### Community 9 - "ErrorBox"
Cohesion: 0.11
Nodes (46): Button(), ErrorBox(), siteLink(), WaitingPanel(), UnitEditor(), remove(), save(), send() (+38 more)

### Community 10 - "access.ts"
Cohesion: 0.10
Nodes (28): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), GuestInfo, submit(), submit(), remember() (+20 more)

### Community 11 - "DataRepo"
Cohesion: 0.07
Nodes (32): now(), DataRepo, Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics() (+24 more)

### Community 12 - "icons.tsx"
Cohesion: 0.12
Nodes (35): IconArchive(), IconArrowRight(), IconBell(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose() (+27 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.09
Nodes (44): IconTrash(), ProposalRow, downloadOriginal(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog() (+36 more)

### Community 14 - "WelcomePage.tsx"
Cohesion: 0.09
Nodes (49): Página de apresentação e popups de entrada, App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), BrandBanner(), IconGoogle(), IconShield() (+41 more)

### Community 15 - "conftest.py"
Cohesion: 0.12
Nodes (9): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo(), build() (+1 more)

### Community 16 - "test_questions.py"
Cohesion: 0.21
Nodes (17): blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused(), test_a_question_using_an_excluded_case_is_not_shown_either() (+9 more)

### Community 18 - "types.ts"
Cohesion: 0.07
Nodes (59): ButtonVariant, certaintyLevel(), ConfidenceBadge(), EditButton(), methodKind(), ReasonList(), ReasonText(), SPINES (+51 more)

### Community 19 - "public.py"
Cohesion: 0.16
Nodes (10): _auth_env(), build_public_site(), _check_target(), _digest(), github_slug(), PublicResult, publish_public(), PublishError (+2 more)

### Community 20 - "Regras de classificação contra erros conhecidos"
Cohesion: 0.12
Nodes (13): _text_only(), CLASSIFIER_VERSION (reclassificação), Versão do extractor (provoca nova extracção), prior, type_prior, neutral_folders, Classificação heurística e explicável, Etapa 3: reconciliação (classificar, arrumar ou rever) (+5 more)

### Community 21 - "source.ts"
Cohesion: 0.10
Nodes (24): yaml@^2.9.1, AppData, APP_REPOSITORY, buildLotes(), IndexLag, INDICES_BRANCH, LOTE_MAX_BYTES, LOTE_MIN_FILES (+16 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (31): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+23 more)

### Community 23 - "Reason"
Cohesion: 0.09
Nodes (24): ClassificationSettings, Alternative, Classification, DocumentKind, FieldValue, Reason, ExtractionMeta, inherit() (+16 more)

### Community 24 - "MetaIndex"
Cohesion: 0.06
Nodes (32): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts), dir, hasIndex, vectors (+24 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.06
Nodes (18): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun (+10 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.10
Nodes (31): ArchiveSettings, archive_format(), archive_names(), ArchiveToolMissing, _bad(), BadArchiveError, _Budget, _collect_staged() (+23 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (40): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+32 more)

### Community 28 - "._expand_archive"
Cohesion: 0.22
Nodes (4): Review, default_cache_dir(), _Staging, is_archive_name()

### Community 30 - "ReaderPage"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 31 - "package.json"
Cohesion: 0.08
Nodes (34): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+26 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.07
Nodes (21): AccountSession, COMPARE_MAX_FILES, Comparison, encodePath(), GitHubClient, GitHubError, RepoInfo, toBase64() (+13 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.07
Nodes (30): scaffold(), vigiar(), instalar.sh script, Depósito (envio sem organizar), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo) (+22 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.14
Nodes (4): Layout, _render(), scaffold(), ScaffoldReport

### Community 38 - ".save_document"
Cohesion: 0.17
Nodes (4): choose_lead(), key(), Remover documentos (caixote do lixo, removed: {at, by}), GitHub Actions como worker (concurrency)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "read_yaml"
Cohesion: 0.10
Nodes (26): read_yaml(), write_yaml_if_changed(), effective_visibility(), is_public(), type_key(), Visibility, _v1_visibility_inherits(), parse_visibility() (+18 more)

### Community 42 - "proxy.js"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "index.html (entrada da interface)"
Cohesion: 0.20
Nodes (8): Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none), Interface em knowledge-nexus.github.io (só código)

### Community 44 - "GitHubDataSource"
Cohesion: 0.19
Nodes (6): readCurrent(), guestName(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

### Community 45 - "Layout e ajuda"
Cohesion: 0.14
Nodes (26): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconEye() (+18 more)

### Community 46 - "Projectos de código"
Cohesion: 0.10
Nodes (24): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+16 more)

### Community 47 - "context.tsx"
Cohesion: 0.13
Nodes (20): ACTIVE, AppContext, LAG_INTERVAL_MS, useSearchIndex(), searchFiles(), DepositState, More(), NotificationList() (+12 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.07
Nodes (17): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Fase 3: pesquisa semântica, flashcards FSRS e simulados, Fase 5: abertura a outros utilizadores, Blob (+9 more)

### Community 49 - "PdfViewer.tsx"
Cohesion: 0.11
Nodes (22): Drag, useDragScroll(), pageUnitsHeight(), closeOnRemoval(), openPdf(), pageSize(), PdfDocument, pdfOutline() (+14 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "yamlio.py"
Cohesion: 0.14
Nodes (7): _Dumper, _str_representer(), write_json_if_changed(), write_text_if_changed(), write_extraction(), ocr_workers(), simhash()

### Community 52 - "bundles.py"
Cohesion: 0.14
Nodes (11): bundle_id(), folder_name(), folder_of(), FolderGroup, project_folders(), _qualifies(), group_folder(), Layout (+3 more)

### Community 53 - "invite.ts"
Cohesion: 0.48
Nodes (5): decodeInvite(), fromBase64Url(), guestTrailer(), Invite, tokenPageUrl()

### Community 54 - "UploadPage.tsx"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "test_serve.py"
Cohesion: 0.10
Nodes (21): app_checkout(), app_has_update(), only_personal(), PublicState, publish_public_if_due(), remote_has_news(), serve(), serve_once() (+13 more)

### Community 56 - "Document"
Cohesion: 0.11
Nodes (8): Document, HistoryEntry, Status, member_name(), eligibility(), pending(), describe(), pending()

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "r2.py"
Cohesion: 0.08
Nodes (11): StorageSettings, export_tree(), ExportReport, BlobStore, GitRepoBlobStore, HybridBlobStore, open_blob_store(), _s3_client() (+3 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (8): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Knowledge Nexus (plataforma de estudo para o ensino superior), Repositório de dados privado processado pelo GitHub Actions

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 63 - "Git"
Cohesion: 0.10
Nodes (14): Git, GitError, RemoteBusy, _read_original(), commit_message(), indices_up_to_date(), process_and_publish(), publish_index_branch() (+6 more)

### Community 64 - "extraction"
Cohesion: 0.22
Nodes (9): extraction, ai_transcription_confidence, max_xlsx_cols, max_xlsx_rows, min_native_chars_per_page, ocr_dpi, ocr_languages, ocr_timeout_seconds (+1 more)

### Community 65 - "._intake_file"
Cohesion: 0.22
Nodes (5): Source, sha256_file(), DepositItem, ItemError, PartsIncomplete

### Community 66 - "json"
Cohesion: 0.14
Nodes (16): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+8 more)

### Community 67 - "import_bundle"
Cohesion: 0.19
Nodes (13): CatalogError, _check_slug(), import_bundle(), load_catalog(), test_catalog_import_is_idempotent(), test_catalog_import_rejects_bad_slug(), test_catalog_import_rejects_unknown_unit_reference(), test_catalog_request_adds_aliases_without_losing_existing() (+5 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Reader.tsx"
Cohesion: 0.12
Nodes (27): Modo de leitura (Reader), Marcas de leitura, Markdown(), OutlineEntry, imageSource(), PageSource, ReaderText(), Size (+19 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.36
Nodes (8): Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta), Marcas de leitura (marcador, sublinhado, caneta), Sessão (identificador aleatório no browser; servidor guarda só um resumo), Tokens de cor da interface (paper, sheet, ink, pen, navy, gold, line), Pedidos do utilizador (mudar nome e palavra-passe; apagar a conta pelo dono)

### Community 71 - "annotations.ts"
Cohesion: 0.12
Nodes (30): draftKey(), dropDraft(), marksKey(), readDraft(), SAVE_DELAY_MS, scope(), useMarkEditor(), useSavedMarks() (+22 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (18): Skill /processar-deposito, nexus processar --json, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), Estrutura do repositório de dados, deposito/<login>/ (entrada) e _erros/ (falhas com .log) (+10 more)

### Community 73 - "pathlib"
Cohesion: 0.11
Nodes (12): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), _assemble(), expand_lotes(), _extract() (+4 more)

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.11
Nodes (31): ExtractionSettings, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), MissingToolError, PageText, require() (+23 more)

### Community 76 - "classifier.py"
Cohesion: 0.10
Nodes (23): contains_phrase(), contains_unit_phrase(), _numbers_after(), strip_accents(), _unify_spelling(), material_folder(), check(), unit_features() (+15 more)

### Community 78 - "index.js"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 79 - "Course"
Cohesion: 0.17
Nodes (8): Course, unit_key(), UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Unidade curricular (cadeira)

### Community 80 - "command"
Cohesion: 0.18
Nodes (7): catalogo_propostas(), migrar(), perguntas_pendentes(), _print_json(), processar(), publicar(), revisao_listar()

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 83 - "App.tsx"
Cohesion: 0.15
Nodes (37): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+29 more)

### Community 84 - "archives"
Cohesion: 0.25
Nodes (8): archives, keep_whole, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "extract_file"
Cohesion: 0.18
Nodes (13): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_ocr_workers_respect_the_machine_limit() (+5 more)

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
Cohesion: 0.13
Nodes (10): current_version(), migrate(), _set_format_version(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed(), Procedimento para mudar FORMAT_VERSION do repositório de dados (+2 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.07
Nodes (26): build_match(), _code_fingerprint(), create_search_db(), _gzip(), merge_hits(), PageRow, _prune_cache(), SearchBackend (+18 more)

### Community 95 - "classification"
Cohesion: 0.25
Nodes (8): classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost, header_chars, required_fields, required_for_assessments

### Community 96 - "Material público num repositório público à parte"
Cohesion: 0.09
Nodes (14): Detecção de cópias ao depositar (ownedSha), CSP estrita e noindex, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Material público num repositório público à parte, Campos obrigatórios para arrumar, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez) (+6 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 98 - "config.py"
Cohesion: 0.19
Nodes (12): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+4 more)

### Community 99 - "catalog_io.py"
Cohesion: 0.11
Nodes (19): export_bundle(), _given(), ImportReport, _merge(), remove_unit(), _write_entity(), model_to_data(), Assessment (+11 more)

### Community 100 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 101 - "source_weights"
Cohesion: 0.25
Nodes (8): source_weights, archive, body, filename, header, layout, metadata, path

### Community 102 - "github.js"
Cohesion: 0.23
Nodes (14): adminCache, adminLogin(), appJwt(), dataRepo(), der(), derLength(), HEADERS, importAppKey() (+6 more)

### Community 104 - "cli.py"
Cohesion: 0.13
Nodes (12): catalogo_exportar(), main(), _main(), migrar_blobs(), pesquisar(), publicar_indices(), servir(), verificar() (+4 more)

### Community 105 - "vite.config.ts"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 108 - "predefinicoes.yaml"
Cohesion: 0.33
Nodes (5): dedup, min_words, near_duplicate_max_hamming, limits, max_file_bytes

### Community 109 - "code_projects"
Cohesion: 0.33
Nodes (6): code_projects, code_extensions, code_ratio, ignored_dirs, markers, min_code_files

### Community 117 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 118 - "filing.py"
Cohesion: 0.19
Nodes (8): slugify(), Term, Vocabularies, filed_name(), original_stem(), unique_name(), test_unique_name(), test_slugify()

### Community 121 - "Record"
Cohesion: 0.08
Nodes (14): Record, uuid7(), BundleRef, Removal, PageMeta, Evidence, Enrollments, Group (+6 more)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 895 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **26 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `Propostas de catálogo e texto` to `json`, `Estantes, cursos e configuração`, `import_bundle`, `pathlib`, `pt-PT com grafia pré-Acordo (nunca PT-BR)`, `classifier.py`, `Projectos de código`, `yamlio.py`, `Testes da classificação`, `Reason`, `Document`, `search.py`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Are the 55 inferred relationships involving `DataRepo` (e.g. with `export_tree()` and `_catalog_failed()`) actually correct?**
  _`DataRepo` has 55 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.09246575342465753 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `MetaIndex`, `useApp`, `Propostas de catálogo e texto`, `pt-PT com grafia pré-Acordo (nunca PT-BR)`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `Document` (e.g. with `effective_visibility()` and `is_public()`) actually correct?**
  _`Document` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07017543859649122 - nodes in this community are weakly interconnected._