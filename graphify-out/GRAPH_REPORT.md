# Graph Report - knowledge-nexus.github.io  (2026-11-04)

## Corpus Check
- 235 files · ~168,105 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3162 nodes · 9832 edges · 129 communities (111 shown, 18 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 984 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `37625c8b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Testes do pipeline
- LibraryPage.tsx
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- _repo
- nexus/questions.py
- nexus vigiar e API GitHub
- r2.py
- Reconciliação do pipeline
- ui.tsx
- builder.py
- Classifier
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- main
- BulkReview.tsx
- Record
- Regras de classificação contra erros conhecidos
- source.ts
- Testes da classificação
- Reason
- Partilha e visibilidade pública
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- Recepção do depósito
- test_domain.py
- Visor de documentos e PDF
- package.json
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- ocr.py
- Catálogo de exemplo
- Layout
- Índice e tipos da interface
- Workflow de CI
- Credencial GitHub do Worker
- review.py
- proxy.js
- extract_file
- read_yaml
- Layout e ajuda
- Projectos de código
- predefinicoes.yaml
- Regras de partilha e visibilidade (documento, tipo, cadeira, privado)
- RunReport
- Configuração do Biome
- Repositório de dados (privado)
- Conjuntos e organização
- Gestão dos acessos
- Depositar ficheiros
- Testes do servir
- publish_public_if_due
- Dependências de desenvolvimento
- config.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- app-ref
- Git
- Raspberry Pi
- SqliteFtsSearch
- Cursos e ligações
- test_index_publish.py
- Skills de revisão e catálogo
- Modo de leitura
- Privacidade e CSP
- ReaderPage
- Skill processar depósito
- shutil
- FakeGitHub
- extract/__init__.py
- normalize
- _Corpus
- index.js
- catalog_io.py
- Blobs no git
- Workflow Pages
- classification
- App.tsx
- write_extraction
- env
- SKILL.md
- json
- nexus.yml
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- github.js
- Configuração Vite
- document_types
- screenshots.spec.ts
- Material público num repositório público à parte
- reclassificar
- Remoto ocupado (testes)
- steps
- 0001_esquema_base_fase_1.py
- vigiar-deposito.sh
- migrations.py
- ErrorBox
- session.ts
- scaffold
- extraction
- subprocess
- Migração dos códigos (D1)
- Projecto Python
- Envio em partes de ficheiros grandes (> 10 MB)
- Regra 1: nunca pôr material real neste repositório
- source_weights
- with
- clock.py
- public.py
- nexus.yaml (definições e format_version)
- archives
- remove_course
- index.html (entrada da interface)
- Originais no Cloudflare R2 (opcional)

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 133 edges
2. `useApp()` - 94 edges
3. `Pipeline` - 84 edges
4. `ErrorBox()` - 83 edges
5. `Button()` - 74 edges
6. `Document` - 73 edges
7. `Layout` - 59 edges
8. `Record` - 51 edges
9. `normalize()` - 51 edges
10. `deposit()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
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

## Communities (129 total, 18 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.11
Nodes (48): pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user(), test_batch_skips_deferred_items_and_reports_unprocessed_items() (+40 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.08
Nodes (44): Página da cadeira (UnitDetail), IconGlobe(), IconLock(), Badge(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility() (+36 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (39): Catalog, contains_unit_phrase(), fix_spacing_accents(), _numbers_after(), roman(), sequel_after(), series_number(), acceptable() (+31 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.07
Nodes (68): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), ErrorBox(), Notice(), unitColor(), CatalogBundle (+60 more)

### Community 4 - "_repo"
Cohesion: 0.10
Nodes (30): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+22 more)

### Community 5 - "nexus/questions.py"
Cohesion: 0.10
Nodes (23): perguntas_mostrar(), perguntas_pendentes(), _print_json(), revisao_listar(), QuestionSet, _blocks(), build(), _check_numbering() (+15 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "r2.py"
Cohesion: 0.06
Nodes (19): BlobStore, migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, missing_credentials(), open_blob_store() (+11 more)

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.10
Nodes (7): Document, HistoryEntry, Review, Pipeline, eligibility(), pending(), pending()

### Community 9 - "ui.tsx"
Cohesion: 0.12
Nodes (26): Nome dado pelo dono (classification.title), ButtonVariant, certaintyLevel(), ConfidenceBadge(), EditButton(), methodKind(), ReasonList(), ReasonText() (+18 more)

### Community 10 - "builder.py"
Cohesion: 0.10
Nodes (16): Topic, export_tree(), ExportReport, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics() (+8 more)

### Community 11 - "Classifier"
Cohesion: 0.10
Nodes (10): Classification, FieldValue, ExtractionMeta, Classifier, weak(), Outcome, _producer(), collect_signals() (+2 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.12
Nodes (42): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+34 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (45): IconTrash(), useApp(), QuestionsToVerify(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog() (+37 more)

### Community 14 - "Página de entrada"
Cohesion: 0.10
Nodes (45): Identidade visual (pergaminho, azul-marinho e dourado), Página de apresentação e popups de entrada, BrandBanner(), IconGoogle(), IconShield(), IconTicket(), IconUser(), IconUserPlus() (+37 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.11
Nodes (32): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+24 more)

### Community 16 - "DataRepo"
Cohesion: 0.15
Nodes (21): DataRepo, still_in_file(), blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused() (+13 more)

### Community 18 - "BulkReview.tsx"
Cohesion: 0.13
Nodes (29): BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconStack(), downloadOriginal() (+21 more)

### Community 19 - "Record"
Cohesion: 0.07
Nodes (16): DataRepoError, Record, Removal, PageMeta, Generated, SourceRef, Question, QuestionContext (+8 more)

### Community 20 - "Regras de classificação contra erros conhecidos"
Cohesion: 0.12
Nodes (12): _text_only(), CLASSIFIER_VERSION (reclassificação), prior, type_prior, neutral_folders, Cadeiras e instituições em falta (siglas ligadas a frases), Classificação heurística e explicável, Confiança: melhor / (melhor + segundo + prior) (+4 more)

### Community 21 - "source.ts"
Cohesion: 0.07
Nodes (29): AccountSession, AppData, RepoInfo, Change, RepoRef, GuestInfo, guestName(), APP_REPOSITORY (+21 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.12
Nodes (27): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+19 more)

### Community 23 - "Reason"
Cohesion: 0.12
Nodes (27): CurricularUnit, Alternative, Reason, contains_phrase(), pick(), unit_features(), Candidate, CompiledTerm (+19 more)

### Community 24 - "Partilha e visibilidade pública"
Cohesion: 0.11
Nodes (17): dump_yaml(), model_to_data(), write_json_if_changed(), write_yaml_if_changed(), User, effective_visibility(), is_public(), type_key() (+9 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (17): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun (+9 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.13
Nodes (26): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+18 more)

### Community 27 - "document_types"
Cohesion: 0.09
Nodes (27): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, labels, exam_seasons (+19 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.15
Nodes (10): uuid7(), BlobRef, Source, sha256_file(), DepositItem, default_cache_dir(), ItemError, PartsIncomplete (+2 more)

### Community 29 - "test_domain.py"
Cohesion: 0.20
Nodes (9): test_catalog_import_rejects_bad_slug(), test_catalog_import_rejects_unknown_unit_reference(), test_catalog_request_adds_aliases_without_losing_existing(), test_catalog_request_keeps_fields_it_does_not_mention(), test_migrations_apply_in_order(), test_normalize_unifies_spellings(), test_slugify(), test_uuid7_is_version_7_and_sortable() (+1 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.14
Nodes (22): pageUnitsHeight(), closeOnRemoval(), openPdf(), OutlineEntry, pageSize(), PdfDocument, pdfOutline(), PdfPage (+14 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.09
Nodes (16): AccountsApi, submit(), submit(), accessesKey(), AccessManager(), change(), remember(), codesKey() (+8 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (10): encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), commitChanges(), encoder (+2 more)

### Community 35 - "ocr.py"
Cohesion: 0.24
Nodes (7): MissingToolError, require(), which(), _has_osd(), ocr_image(), OcrResult, _parse_tsv()

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 38 - "Índice e tipos da interface"
Cohesion: 0.05
Nodes (47): Procedimento para mudar o esquema do índice, Pesquisa FTS5 (texto original e normalizado), ACTIVE, AppContext, dir, hasIndex, vectors, Bind (+39 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "review.py"
Cohesion: 0.11
Nodes (14): CatalogProposal, Evidence, slugify(), filed_name(), original_stem(), unique_name(), accept_unit_proposal(), describe() (+6 more)

### Community 42 - "proxy.js"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "extract_file"
Cohesion: 0.17
Nodes (13): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_ocr_workers_respect_the_machine_limit() (+5 more)

### Community 44 - "read_yaml"
Cohesion: 0.18
Nodes (15): read_yaml(), public_documents(), _configure(), _doc_of(), _prepare(), test_cli_type_visibility(), test_cli_visibility(), test_effective_visibility_follows_unit_then_document() (+7 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.16
Nodes (24): BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp(), IconHome() (+16 more)

### Community 46 - "Projectos de código"
Cohesion: 0.10
Nodes (21): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+13 more)

### Community 47 - "predefinicoes.yaml"
Cohesion: 0.17
Nodes (11): code_projects, code_extensions, code_ratio, ignored_dirs, markers, min_code_files, dedup, min_words (+3 more)

### Community 48 - "Regras de partilha e visibilidade (documento, tipo, cadeira, privado)"
Cohesion: 0.15
Nodes (4): upgrade(), upgrade(), upgrade(), upgrade()

### Community 49 - "RunReport"
Cohesion: 0.31
Nodes (5): RunReport, commit_message(), ProcessResult, test_serve_migrates_and_processes_in_batches(), fake_process()

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (privado)"
Cohesion: 0.12
Nodes (15): Depósito (envio sem organizar), Knowledge Nexus (plataforma de estudo), Repositório da aplicação (público, GitHub Pages), GitHub Actions como worker (concurrency), Ramo indices (órfão, um só commit), SQLite WASM em memória no browser (cache IndexedDB), Publicar a interface (Pages com GitHub Actions), meta.db (índice de metadados) (+7 more)

### Community 52 - "Conjuntos e organização"
Cohesion: 0.10
Nodes (17): BundleRef, DocumentKind, Status, bundle_id(), choose_lead(), key(), folder_name(), folder_of() (+9 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.11
Nodes (41): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), AccessRow(), addDays(), rename(), renew() (+33 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.16
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, UploadPage(), add(), onDrop() (+14 more)

### Community 55 - "Testes do servir"
Cohesion: 0.16
Nodes (12): remote_has_news(), serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_busy_remote_is_not_an_error(), busy(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed() (+4 more)

### Community 56 - "publish_public_if_due"
Cohesion: 0.16
Nodes (9): PublicResult, app_checkout(), app_has_update(), PublicState, publish_public_if_due(), serve(), test_public_material_is_published_when_it_may_have_changed(), failing() (+1 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "config.py"
Cohesion: 0.15
Nodes (14): config_dir(), DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section (+6 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (8): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Knowledge Nexus (plataforma de estudo para o ensino superior), Repositório de dados privado processado pelo GitHub Actions

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "app-ref"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 63 - "Git"
Cohesion: 0.14
Nodes (7): Git, indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source(), public_key(), wait_until_quiet()

### Community 64 - "Raspberry Pi"
Cohesion: 0.37
Nodes (11): as_nexus(), ask(), info(), install_all(), say(), set_env(), instalar.sh script, uninstall() (+3 more)

### Community 65 - "SqliteFtsSearch"
Cohesion: 0.33
Nodes (3): SearchFilters, SearchHit, SqliteFtsSearch

### Community 66 - "Cursos e ligações"
Cohesion: 0.17
Nodes (8): Course, unit_key(), UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Unidade curricular (cadeira)

### Community 67 - "test_index_publish.py"
Cohesion: 0.19
Nodes (13): build_match(), create_search_db(), PageRow, git(), _prepare(), test_alembic_baseline_matches_schema(), test_build_match_is_safe(), test_cli_end_to_end() (+5 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.18
Nodes (16): Modo de leitura (Reader), Marcas de leitura, MarkColor, PAGE_UNITS, StrokeSize, DEFAULT_PREFS, Fit, lastPage() (+8 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.36
Nodes (8): Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta), Marcas de leitura (marcador, sublinhado, caneta), Sessão (identificador aleatório no browser; servidor guarda só um resumo), Tokens de cor da interface (paper, sheet, ink, pen, navy, gold, line), Pedidos do utilizador (mudar nome e palavra-passe; apagar a conta pelo dono)

### Community 71 - "ReaderPage"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (18): Skill /processar-deposito, nexus processar --json, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), Estrutura do repositório de dados, deposito/<login>/ (entrada) e _erros/ (falhas com .log) (+10 more)

### Community 73 - "shutil"
Cohesion: 0.08
Nodes (17): _Dumper, _str_representer(), _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member() (+9 more)

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.14
Nodes (25): ExtractionSettings, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), PageText, archive_listing(), code_project_text() (+17 more)

### Community 76 - "normalize"
Cohesion: 0.10
Nodes (18): ClassificationSettings, normalize(), strip_accents(), _unify_spelling(), Term, Vocabularies, material_folder(), check() (+10 more)

### Community 78 - "index.js"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 79 - "catalog_io.py"
Cohesion: 0.12
Nodes (23): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+15 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (33): runs-on, steps, concurrency, cancel-in-progress, group, environment, needs, runs-on (+25 more)

### Community 82 - "classification"
Cohesion: 0.15
Nodes (10): Opção file_uncertain_type (tipo por confirmar), classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost, file_uncertain_type, header_chars (+2 more)

### Community 83 - "App.tsx"
Cohesion: 0.14
Nodes (34): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+26 more)

### Community 84 - "write_extraction"
Cohesion: 0.10
Nodes (18): write_text_if_changed(), write_extraction(), Detecção de cópias ao depositar (ownedSha), Remover documentos (caixote do lixo, removed: {at, by}), Versão do extractor (provoca nova extracção), Etapa 2: recepção (deduplicar, desempacotar, extrair), Etapa 3: reconciliação (classificar, arrumar ou rever), Fluxo de revisão (patch method: user, depois reviewed) (+10 more)

### Community 85 - "env"
Cohesion: 0.20
Nodes (10): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+2 more)

### Community 87 - "json"
Cohesion: 0.09
Nodes (18): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+10 more)

### Community 88 - "nexus.yml"
Cohesion: 0.12
Nodes (15): concurrency, cancel-in-progress, group, jobs, pipeline, name, permissions, actions (+7 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "app.spec.ts"
Cohesion: 0.23
Nodes (10): CORS, decode(), routeGitHub(), routeWorker(), snapshot, withFakeGitHub(), workerEnv(), workerEnvs (+2 more)

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "Migração de formatos"
Cohesion: 0.13
Nodes (10): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+2 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "github.js"
Cohesion: 0.23
Nodes (14): adminCache, adminLogin(), appJwt(), dataRepo(), der(), derLength(), HEADERS, importAppKey() (+6 more)

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 96 - "document_types"
Cohesion: 0.17
Nodes (12): document_types, excluded_by, extensions, is_assessment, is_fallback, is_submission, is_syllabus, keywords (+4 more)

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 98 - "Material público num repositório público à parte"
Cohesion: 0.20
Nodes (7): CSP estrita e noindex, Material público num repositório público à parte, Segurança e privacidade, Token fine-grained guardado no browser, Criar o repositório de dados privado, Configurar a página pública (estudo-publico), Permissões do token fine-grained (Contents, Actions, Workflows, Metadata)

### Community 99 - "reclassificar"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 101 - "steps"
Cohesion: 0.20
Nodes (10): jobs, processar, runs-on, steps, timeout-minutes, id, if, name (+2 more)

### Community 102 - "0001_esquema_base_fase_1.py"
Cohesion: 0.28
Nodes (4): upgrade(), SearchBackend, Fase 5: abertura a outros utilizadores, Esquema relacional de partida para a fase 5

### Community 103 - "vigiar-deposito.sh"
Cohesion: 0.22
Nodes (9): only_personal(), Processamento local (nexus servir), Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script (+1 more)

### Community 105 - "ErrorBox"
Cohesion: 0.24
Nodes (17): Button(), Card(), siteLink(), AccountCard(), AccountsManager(), accountState(), CopyField(), dateOnly() (+9 more)

### Community 106 - "session.ts"
Cohesion: 0.24
Nodes (9): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession(), read() (+1 more)

### Community 107 - "scaffold"
Cohesion: 0.16
Nodes (11): instalar.sh script, Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Skills do Claude Code no repositório de dados, Flashcard (estado FSRS), Pergunta (banco de perguntas), Simulado (+3 more)

### Community 108 - "extraction"
Cohesion: 0.22
Nodes (9): extraction, ai_transcription_confidence, max_xlsx_cols, max_xlsx_rows, min_native_chars_per_page, ocr_dpi, ocr_languages, ocr_timeout_seconds (+1 more)

### Community 109 - "subprocess"
Cohesion: 0.27
Nodes (6): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), test_push_logs_rejection_reason()

### Community 117 - "Envio em partes de ficheiros grandes (> 10 MB)"
Cohesion: 0.32
Nodes (7): Envio em partes de ficheiros grandes (> 10 MB), Lotes zip para muitos ficheiros (>= 20), Fluxo de depósito (browser para deposito/<login>/<lote>), Limites conhecidos (tamanho, tempo, privacidade, índice), Formas de depositar (interface, GitHub, pasta vigiada), deposito/<login>/<lote>/ (entrada e _erros), Referência *.ref.yaml (conteúdo já existente)

### Community 119 - "source_weights"
Cohesion: 0.25
Nodes (8): source_weights, archive, body, filename, header, layout, metadata, path

### Community 120 - "with"
Cohesion: 0.25
Nodes (8): with, fetch-depth, filter, key, path, restore-keys, sparse-checkout, sparse-checkout-cone-mode

### Community 121 - "clock.py"
Cohesion: 0.38
Nodes (3): fixed(), now(), kept()

### Community 122 - "public.py"
Cohesion: 0.18
Nodes (8): GitError, RemoteBusy, _auth_env(), _check_target(), github_slug(), publish_public(), PublishError, _read_original()

### Community 123 - "nexus.yaml (definições e format_version)"
Cohesion: 0.29
Nodes (7): Serviço knowledge-nexus no Raspberry Pi, Campos obrigatórios para arrumar, Credenciais NEXUS_R2_* (R2 API token), Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), nexus.yaml (definições e format_version)

### Community 124 - "archives"
Cohesion: 0.29
Nodes (7): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio

### Community 126 - "index.html (entrada da interface)"
Cohesion: 0.20
Nodes (8): Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none), Interface em knowledge-nexus.github.io (só código)

## Knowledge Gaps
- **12 isolated node(s):** `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 838 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `normalize` to `Propostas de catálogo e texto`, `test_index_publish.py`, `Estantes, cursos e configuração`, `Índice e tipos da interface`, `Reconciliação do pipeline`, `builder.py`, `Classifier`, `Conjuntos e organização`, `Testes da classificação`, `Reason`, `json`, `test_domain.py`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 69 inferred relationships involving `DataRepo` (e.g. with `Settings` and `Layout`) actually correct?**
  _`DataRepo` has 69 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.11475409836065574 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `BulkReview.tsx`, `normalize`, `Índice e tipos da interface`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08065458796025717 - nodes in this community are weakly interconnected._