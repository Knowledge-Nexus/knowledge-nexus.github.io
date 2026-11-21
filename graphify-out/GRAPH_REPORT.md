# Graph Report - knowledge-nexus.github.io  (2026-11-21)

## Corpus Check
- 236 files · ~171,074 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3203 nodes · 9842 edges · 128 communities (106 shown, 22 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 968 edges (avg confidence: 0.88)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5fc86014`
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
- DataRepo
- ErrorBox
- ocr.py
- raspberry-pi/instalar.sh
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- write_yaml_if_changed
- types.ts
- publish.py
- classification
- source.ts
- Testes da classificação
- Reason
- MetaIndex
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- Recepção do depósito
- index.ts
- Visor de documentos e PDF
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Repositório de dados (privado)
- Catálogo de exemplo
- Layout
- contract.test.ts
- Workflow de CI
- Credencial GitHub do Worker
- json
- proxy.js
- extract_file
- GitHubDataSource
- Layout e ajuda
- Projectos de código
- GitRepoBlobStore
- sqlalchemy
- test_public.py
- Configuração do Biome
- visibilidade_tipo
- bundles.py
- Gestão dos acessos
- Depositar ficheiros
- test_serve.py
- Document
- Dependências de desenvolvimento
- config.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- app-ref
- Git
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
- os
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
- queries.ts
- Classification
- CurricularUnit
- reclassificar
- session.ts
- signals.py
- MarksLayer.tsx
- Regra 1: nunca pôr material real neste repositório
- _QuietGit
- vigiar-deposito.sh
- pathlib
- serve.py
- Migração dos códigos (D1)
- Projecto Python
- DataRepoError
- ocr_workers
- Record
- _check_target
- PublicResult
- main

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
- `Cadeira só no texto fica abaixo do limiar (BODY_ONLY_MAX)` --references--> `_text_only()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/classify/classifier.py
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `Unidade curricular (cadeira)` --references--> `CurricularUnit`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/catalog.py
- `Edição da cadeira` --references--> `UnitEdition`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/catalog.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (128 total, 22 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.11
Nodes (51): pasta_exemplo(), pdf_nativo(), projecto_codigo(), deposit(), docs(), _lote(), run(), _split() (+43 more)

### Community 1 - "useApp"
Cohesion: 0.08
Nodes (56): Conjuntos (bundles), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconArrowRight() (+48 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.06
Nodes (39): config_dir(), Catalog, fix_spacing_accents(), normalize(), roman(), sequel_after(), series_number(), acceptable() (+31 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.07
Nodes (61): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), unitColor(), ACTIVE, AppContext, CatalogBundle (+53 more)

### Community 4 - "_repo"
Cohesion: 0.09
Nodes (33): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+25 more)

### Community 5 - "Record"
Cohesion: 0.11
Nodes (23): QuestionSet, _question_rows(), _blocks(), build(), _check_numbering(), describe(), _document(), eligibility() (+15 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "R2BlobStore"
Cohesion: 0.10
Nodes (13): migrate_originals(), MigrationReport, _originals(), _sha256(), QuotaExceeded, R2BlobStore, FakeS3, _file() (+5 more)

### Community 8 - "DataRepo"
Cohesion: 0.09
Nodes (21): now(), DataRepo, CatalogProposal, build_indices(), BuildResult, near_duplicate_pairs(), _required_confidence(), build_public_site() (+13 more)

### Community 9 - "ErrorBox"
Cohesion: 0.18
Nodes (23): Nome dado pelo dono (classification.title), Button(), ErrorBox(), siteLink(), FieldForm(), TitleEditor(), useFieldSaver(), RenameForm() (+15 more)

### Community 10 - "ocr.py"
Cohesion: 0.25
Nodes (7): MissingToolError, require(), which(), _has_osd(), ocr_image(), OcrResult, _parse_tsv()

### Community 11 - "raspberry-pi/instalar.sh"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.16
Nodes (30): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+22 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (42): IconTrash(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove(), RemovedList() (+34 more)

### Community 14 - "Página de entrada"
Cohesion: 0.10
Nodes (43): Página de apresentação e popups de entrada, BrandBanner(), IconGoogle(), IconShield(), IconTicket(), IconUser(), IconUserPlus(), Modal() (+35 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.11
Nodes (33): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+25 more)

### Community 16 - "DataRepo"
Cohesion: 0.23
Nodes (16): blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused(), test_a_question_using_an_excluded_case_is_not_shown_either() (+8 more)

### Community 17 - "write_yaml_if_changed"
Cohesion: 0.15
Nodes (11): dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), _render() (+3 more)

### Community 18 - "types.ts"
Cohesion: 0.07
Nodes (58): Página da cadeira (UnitDetail), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList(), ReasonText(), SPINES (+50 more)

### Community 19 - "publish.py"
Cohesion: 0.13
Nodes (9): GitError, RemoteBusy, RunReport, _read_original(), commit_message(), ProcessResult, busy(), fake_process() (+1 more)

### Community 20 - "classification"
Cohesion: 0.06
Nodes (30): CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost (+22 more)

### Community 21 - "source.ts"
Cohesion: 0.08
Nodes (29): AccountSession, AppData, GitHubError, RepoInfo, TreeEntry, WorkflowRun, Change, COMMIT_RETRY (+21 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (30): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+22 more)

### Community 23 - "Reason"
Cohesion: 0.10
Nodes (27): Alternative, FieldValue, Reason, contains_phrase(), contains_unit_phrase(), Classifier, pick(), Outcome (+19 more)

### Community 24 - "MetaIndex"
Cohesion: 0.13
Nodes (4): MetaIndex, parse(), toDocument(), UserRow

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (15): manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), fetchPublicManifest(), get() (+7 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.13
Nodes (26): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+18 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (42): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+34 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.15
Nodes (12): uuid7(), BlobRef, HistoryEntry, Review, Source, DepositItem, ItemError, PartsIncomplete (+4 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.10
Nodes (23): Abertura de PDFs por partes (PDFDataRangeTransport), Drag, useDragScroll(), pageUnitsHeight(), closeOnRemoval(), openPdf(), pageSize(), PdfDocument (+15 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.10
Nodes (13): AccountsApi, submit(), submit(), remember(), codesKey(), storeCode(), storedCodes(), api (+5 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.13
Nodes (10): encodePath(), GitHubClient, toBase64(), BranchBusyError, buildTree(), commitChanges(), wait(), connect() (+2 more)

### Community 35 - "Repositório de dados (privado)"
Cohesion: 0.07
Nodes (29): vigiar(), Depósito (envio sem organizar), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 5: abertura a outros utilizadores, Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20) (+21 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Layout"
Cohesion: 0.13
Nodes (3): remove_course(), Layout, Criar e remover cursos (courses_remove)

### Community 38 - "contract.test.ts"
Cohesion: 0.10
Nodes (19): Pesquisa FTS5 (texto original e normalizado), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts), dir, hasIndex, vectors, Bind (+11 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "json"
Cohesion: 0.10
Nodes (13): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo(), build() (+5 more)

### Community 42 - "proxy.js"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "extract_file"
Cohesion: 0.13
Nodes (21): extract_file(), docx_com_equacao(), _font(), imagem_texto(), notebook(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+13 more)

### Community 44 - "GitHubDataSource"
Cohesion: 0.14
Nodes (6): readCurrent(), guestName(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

### Community 45 - "Layout e ajuda"
Cohesion: 0.15
Nodes (25): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+17 more)

### Community 46 - "Projectos de código"
Cohesion: 0.13
Nodes (19): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+11 more)

### Community 47 - "GitRepoBlobStore"
Cohesion: 0.10
Nodes (9): BlobStore, GitRepoBlobStore, HybridBlobStore, missing_credentials(), _s3_client(), StorageUnavailable, unavailable_message(), Originais no Cloudflare R2 (opcional) (+1 more)

### Community 48 - "sqlalchemy"
Cohesion: 0.12
Nodes (6): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), Esquema relacional de partida para a fase 5

### Community 49 - "test_public.py"
Cohesion: 0.17
Nodes (19): read_yaml(), parse_visibility(), set_document_visibility(), set_unit_visibility(), SharingError, search_doc_ids(), _configure(), _doc_of() (+11 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "visibilidade_tipo"
Cohesion: 0.09
Nodes (18): visibilidade_tipo(), type_key(), set_type_visibility(), Fase 3: pesquisa semântica, flashcards FSRS e simulados, CSP estrita e noindex, Material público num repositório público à parte, Campos obrigatórios para arrumar, Segurança e privacidade (+10 more)

### Community 52 - "bundles.py"
Cohesion: 0.10
Nodes (18): BundleRef, DocumentKind, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup (+10 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.10
Nodes (44): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), accessesKey(), AccessManager(), change(), AccessRow() (+36 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "test_serve.py"
Cohesion: 0.18
Nodes (11): _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_busy_remote_is_not_an_error(), test_public_material_is_published_when_it_may_have_changed(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed(), test_remote_has_news_after_other_clone_pushes(), test_serve_migrates_and_processes_in_batches() (+3 more)

### Community 56 - "Document"
Cohesion: 0.09
Nodes (3): Document, public_documents(), Remover documentos (caixote do lixo, removed: {at, by})

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

### Community 63 - "Git"
Cohesion: 0.15
Nodes (5): Git, indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source()

### Community 64 - "raspberry-pi/instalar.sh"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 65 - "Documento (cópia lógica por utilizador)"
Cohesion: 0.21
Nodes (9): Detecção de cópias ao depositar (ownedSha), Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez), Blob, Cópias e duplicados (duplicate_of, near_duplicates_dismissed), Documento (cópia lógica por utilizador) (+1 more)

### Community 66 - "Cursos e ligações"
Cohesion: 0.15
Nodes (8): Course, CourseUnitLink, unit_key(), Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Unidade curricular (cadeira)

### Community 67 - "builder.py"
Cohesion: 0.09
Nodes (14): fixed(), Topic, effective_visibility(), is_public(), Visibility, _dump(), _file_info(), _flatten_topics() (+6 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.11
Nodes (28): Modo de leitura (Reader), Markdown(), OutlineEntry, ChromeButton(), imageSource(), OutlineList(), PageSource, ReaderText() (+20 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "ReaderPage"
Cohesion: 0.33
Nodes (9): ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), simplify(), straighten(), strokeWidth() (+1 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "shutil"
Cohesion: 0.26
Nodes (6): _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.12
Nodes (26): ExtractionSettings, PageMeta, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), PageText, archive_listing() (+18 more)

### Community 76 - "Vocabularies"
Cohesion: 0.11
Nodes (13): _numbers_after(), slugify(), _unify_spelling(), Term, Vocabularies, material_folder(), check(), compile_terms() (+5 more)

### Community 77 - "_Corpus"
Cohesion: 0.22
Nodes (3): _Corpus, spy(), spy()

### Community 78 - "index.js"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 79 - "catalog_io.py"
Cohesion: 0.12
Nodes (25): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+17 more)

### Community 80 - "os"
Cohesion: 0.20
Nodes (4): Status, export_tree(), ExportReport, open_blob_store()

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (33): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+25 more)

### Community 82 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 83 - "useApp"
Cohesion: 0.13
Nodes (39): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+31 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 88 - "nexus.yml"
Cohesion: 0.12
Nodes (15): concurrency, cancel-in-progress, group, jobs, pipeline, name, permissions, actions (+7 more)

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
Nodes (9): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+1 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "search.py"
Cohesion: 0.09
Nodes (24): build_match(), create_search_db(), _gzip(), merge_hits(), PageRow, SearchBackend, SearchHit, shard_files() (+16 more)

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 96 - "github.js"
Cohesion: 0.23
Nodes (14): adminCache, adminLogin(), appJwt(), dataRepo(), der(), derLength(), HEADERS, importAppKey() (+6 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 98 - "queries.ts"
Cohesion: 0.18
Nodes (12): Procedimento para mudar o esquema do índice, DocumentFilter, JSON_DOC_COLUMNS, MIN_SCHEMA_VERSION, parsePages(), SUPPORTED_SCHEMA_VERSION, CourseUnitRow, InstitutionRow (+4 more)

### Community 99 - "Classification"
Cohesion: 0.22
Nodes (3): Classification, inherit(), weak()

### Community 100 - "CurricularUnit"
Cohesion: 0.53
Nodes (5): CurricularUnit, unit_features(), compile_unit(), add(), UnitFeatures

### Community 101 - "reclassificar"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 102 - "session.ts"
Cohesion: 0.31
Nodes (9): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession(), read() (+1 more)

### Community 103 - "signals.py"
Cohesion: 0.14
Nodes (12): ClassificationSettings, ExtractionMeta, strip_accents(), _producer(), collect_signals(), _raw(), _signal(), full_path() (+4 more)

### Community 104 - "MarksLayer.tsx"
Cohesion: 0.33
Nodes (8): Marcas de leitura, MarksLayer(), StrokeShape(), PAGE_UNITS, rotatedBox(), rotationTransform(), Stroke, strokePath()

### Community 107 - "vigiar-deposito.sh"
Cohesion: 0.29
Nodes (7): Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script, UV_PROJECT_ENVIRONMENT

### Community 108 - "pathlib"
Cohesion: 0.16
Nodes (7): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), alembic_config(), test_push_logs_rejection_reason()

### Community 109 - "serve.py"
Cohesion: 0.12
Nodes (14): publish_public(), app_checkout(), app_has_update(), is_offline(), only_personal(), public_key(), PublicState, publish_public_if_due() (+6 more)

### Community 121 - "Record"
Cohesion: 0.07
Nodes (19): Assessment, UnitEdition, Record, Removal, Evidence, Generated, SourceRef, Question (+11 more)

### Community 125 - "_check_target"
Cohesion: 0.40
Nodes (4): _check_target(), github_slug(), PublishError, failing()

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 856 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Contas no Worker do Cloudflare (D1)` connect `proxy.js` to `Contas no Worker`, `github.js`, `Cliente da API GitHub`, `Repositório de dados (privado)`, `Página de entrada`, `GitRepoBlobStore`, `Gestão dos acessos`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 61 inferred relationships involving `DataRepo` (e.g. with `Settings` and `Layout`) actually correct?**
  _`DataRepo` has 61 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.1062937062937063 - nodes in this community are weakly interconnected._
- **Why does `Visão geral «só GitHub»` connect `Repositório de dados (privado)` to `proxy.js`, `Skills do Claude Code no repositório de dados`, `serve.py`, `contract.test.ts`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 26 inferred relationships involving `Document` (e.g. with `DataRepo` and `effective_visibility()`) actually correct?**
  _`Document` has 26 INFERRED edges - model-reasoned connections that need verification._
- **Should `useApp` be split into smaller, more focused modules?**
  _Cohesion score 0.07857769973661106 - nodes in this community are weakly interconnected._