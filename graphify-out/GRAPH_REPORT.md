# Graph Report - knowledge-nexus.github.io  (2026-11-04)

## Corpus Check
- 233 files · ~164,706 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3136 nodes · 9765 edges · 113 communities (97 shown, 16 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 995 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `59209bad`
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
- Tipos da interface e revisão
- pathlib
- Classifier
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- cli.py
- contract.test.ts
- run.py
- Regras de classificação
- GitHubDataSource
- Testes da classificação
- Reason
- Partilha e visibilidade pública
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- Recepção do depósito
- watch.py
- Visor de documentos e PDF
- dependencies
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- unpack
- Catálogo de exemplo
- Visibility.tsx
- Índice e tipos da interface
- Workflow de CI
- Credencial GitHub do Worker
- review.py
- proxy.js
- Lotes zip e extracção
- Layout e ajuda
- Projectos de código
- extraction
- Regras de partilha e visibilidade (documento, tipo, cadeira, privado)
- RunReport
- Configuração do Biome
- Repositório de dados (privado)
- Conjuntos e organização
- Gestão dos acessos
- Depositar ficheiros
- Testes do servir
- Processamento local (servir)
- Dependências de desenvolvimento
- Markdown.tsx
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- app-ref
- Git
- Raspberry Pi
- SqliteFtsSearch
- Cursos e ligações
- Path
- Skills de revisão e catálogo
- Modo de leitura
- Privacidade e CSP
- ReaderPage
- Skill processar depósito
- shutil
- app.spec.ts
- extract/__init__.py
- classifier.py
- _Corpus
- pipeline/layout.py
- Catálogo
- Blobs no git
- Workflow Pages
- @testing-library/jest-dom
- App.tsx
- Material público num repositório público à parte
- env
- SKILL.md
- gerar.py
- nexus.yml
- Scripts da interface
- GitHubDataSource
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- github.js
- Configuração Vite
- filetypes.py
- Remoto ocupado (testes)
- vigiar-deposito.sh
- migrations.py
- ErrorBox
- session.ts
- scaffold
- test_push_logs_rejection_reason
- Migração dos códigos (D1)
- Projecto Python
- PublishError
- index.html (entrada da interface)

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 131 edges
2. `useApp()` - 89 edges
3. `Pipeline` - 84 edges
4. `ErrorBox()` - 81 edges
5. `Document` - 72 edges
6. `Button()` - 71 edges
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
- `Fase 1 (concluída)` --references--> `vigiar()`  [EXTRACTED]
  CLAUDE.md → backend/nexus/cli.py
- `Repositório de dados (privado)` --references--> `Layout`  [INFERRED]
  docs/repo-dados.md → backend/nexus/datarepo/layout.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (113 total, 16 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.12
Nodes (47): pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user(), test_batch_skips_deferred_items_and_reports_unprocessed_items() (+39 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.07
Nodes (37): Página da cadeira (UnitDetail), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconStack() (+29 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.06
Nodes (38): Catalog, contains_unit_phrase(), _numbers_after(), roman(), sequel_after(), series_number(), acceptable(), _clean() (+30 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (62): Biblioteca em estantes curso e ano, Sugestões ao registar (lista de referência pt.json), SuggestInput(), ButtonVariant, Notice(), SPINES, unitColor(), ACTIVE (+54 more)

### Community 4 - "_repo"
Cohesion: 0.13
Nodes (22): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_rejeitar(), documento_texto(), exportar_arvore(), _fail(), indexar() (+14 more)

### Community 5 - "nexus/questions.py"
Cohesion: 0.10
Nodes (20): Generated, SourceRef, Question, QuestionContext, QuestionReview, QuestionSet, _blocks(), build() (+12 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (13): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), Pending, _stable() (+5 more)

### Community 7 - "r2.py"
Cohesion: 0.06
Nodes (21): BlobStore, migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, missing_credentials(), QuotaExceeded (+13 more)

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.10
Nodes (13): Document, HistoryEntry, Review, Status, inherit(), Pipeline, eligibility(), pending() (+5 more)

### Community 9 - "Tipos da interface e revisão"
Cohesion: 0.09
Nodes (41): Editar no sítio (lápis, method: user), Nome dado pelo dono (classification.title), certaintyLevel(), ConfidenceBadge(), EditButton(), methodKind(), ReasonList(), ReasonText() (+33 more)

### Community 10 - "pathlib"
Cohesion: 0.07
Nodes (22): Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics(), _strip_reasons(), build_match() (+14 more)

### Community 11 - "Classifier"
Cohesion: 0.09
Nodes (17): Alternative, Classification, FieldValue, ExtractionMeta, Classifier, kept(), pick(), Outcome (+9 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.13
Nodes (40): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+32 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (43): IconTrash(), downloadOriginal(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove() (+35 more)

### Community 14 - "Página de entrada"
Cohesion: 0.14
Nodes (33): Identidade visual (pergaminho, azul-marinho e dourado), Página de apresentação e popups de entrada, BrandBanner(), IconArrowRight(), IconGoogle(), IconShield(), IconTicket(), IconUser() (+25 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.11
Nodes (33): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+25 more)

### Community 16 - "DataRepo"
Cohesion: 0.14
Nodes (22): DataRepo, near_duplicate_pairs(), _required_confidence(), hamming(), propose(), blocks(), exam(), make_exam() (+14 more)

### Community 17 - "cli.py"
Cohesion: 0.10
Nodes (16): catalogo_propostas(), documento_mostrar(), main(), _main(), perguntas_mostrar(), perguntas_pendentes(), _print_json(), processar() (+8 more)

### Community 18 - "contract.test.ts"
Cohesion: 0.10
Nodes (18): Pesquisa FTS5 (texto original e normalizado), useSearchIndex(), dir, hasIndex, vectors, Bind, OoDb, ReadonlyDb (+10 more)

### Community 19 - "run.py"
Cohesion: 0.06
Nodes (22): Record, DocumentKind, Manifest, ManifestFile, ManifestIgnored, Removal, Evidence, Enrollments (+14 more)

### Community 20 - "Regras de classificação"
Cohesion: 0.06
Nodes (33): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+25 more)

### Community 21 - "GitHubDataSource"
Cohesion: 0.09
Nodes (27): yaml@^2.9.1, AccountInvite, ACCOUNTS_URL, AccountsConfig, AccountSession, AccountUser, FetchLike, SignedIn (+19 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (29): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+21 more)

### Community 23 - "Reason"
Cohesion: 0.17
Nodes (17): CurricularUnit, Reason, unit_features(), Candidate, rank(), _acronym_in(), compile_unit(), add() (+9 more)

### Community 24 - "Partilha e visibilidade pública"
Cohesion: 0.11
Nodes (25): write_yaml_if_changed(), User, effective_visibility(), is_public(), type_key(), Visibility, parse_visibility(), set_document_visibility() (+17 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (19): Abertura de PDFs por partes (PDFDataRangeTransport), manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), RepoInfo (+11 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.18
Nodes (14): ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), _unpack_7z(), _unpack_rar() (+6 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (41): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+33 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.13
Nodes (11): uuid7(), BlobRef, Source, DepositItem, default_cache_dir(), ItemError, PartsIncomplete, _Staging (+3 more)

### Community 29 - "watch.py"
Cohesion: 0.11
Nodes (9): dump_yaml(), _Dumper, _str_representer(), write_json_if_changed(), write_text_if_changed(), _remove_empty_dirs(), split_for_upload(), test_yaml_is_deterministic_and_keeps_unknown_fields() (+1 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.17
Nodes (15): closeOnRemoval(), openPdf(), OutlineEntry, pageSize(), PdfDocument, pdfOutline(), PdfPage, pdfPath() (+7 more)

### Community 31 - "dependencies"
Cohesion: 0.11
Nodes (18): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, pdfjs-dist@^6.3.289, react@^19.3.0 (+10 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (37): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+29 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (14): encodePath(), FetchLike, GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), Change (+6 more)

### Community 35 - "unpack"
Cohesion: 0.33
Nodes (10): ArchiveSettings, unpack(), test_7z_is_supported(), test_code_bundle_is_deterministic(), test_junk_is_dropped_and_order_is_stable(), test_tar_is_supported(), test_too_many_entries(), test_zip_bomb_is_refused() (+2 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Visibility.tsx"
Cohesion: 0.22
Nodes (16): IconGlobe(), IconLock(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility(), choose(), save() (+8 more)

### Community 38 - "Índice e tipos da interface"
Cohesion: 0.07
Nodes (33): Procedimento para mudar o esquema do índice, DocumentFilter, JSON_DOC_COLUMNS, MetaIndex, MIN_SCHEMA_VERSION, parse(), SUPPORTED_SCHEMA_VERSION, toDocument() (+25 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (10): resetGitHubCache(), handle(), call(), fakeGitHub(), HEAD, push(), setRole(), sha() (+2 more)

### Community 41 - "review.py"
Cohesion: 0.14
Nodes (12): CatalogProposal, slugify(), weak(), accept_unit_proposal(), describe(), _get(), propose(), resolve() (+4 more)

### Community 42 - "proxy.js"
Cohesion: 0.12
Nodes (35): canRead(), canWrite(), effectiveRole(), handleAccounts(), SESSION_PREFIX, withCors(), adminLogin(), dataRepo() (+27 more)

### Community 43 - "Lotes zip e extracção"
Cohesion: 0.23
Nodes (7): sha256_file(), _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 45 - "Layout e ajuda"
Cohesion: 0.15
Nodes (25): BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp(), IconHome() (+17 more)

### Community 46 - "Projectos de código"
Cohesion: 0.18
Nodes (14): CodeProjectSettings, build_bundle(), _code_ratio(), _dirs_of(), files_in(), find_projects(), _has_documents(), _has_marker() (+6 more)

### Community 47 - "extraction"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 48 - "Regras de partilha e visibilidade (documento, tipo, cadeira, privado)"
Cohesion: 0.12
Nodes (8): upgrade(), upgrade(), upgrade(), upgrade(), Fase 5: abertura a outros utilizadores, Esquema relacional de partida para a fase 5, Grupo (fase 5), Trabalho (enunciado, tarefas, membros)

### Community 49 - "RunReport"
Cohesion: 0.31
Nodes (5): RunReport, commit_message(), ProcessResult, test_serve_migrates_and_processes_in_batches(), fake_process()

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (privado)"
Cohesion: 0.09
Nodes (22): migrar(), vigiar(), Depósito (envio sem organizar), Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20), Repositório da aplicação (público, GitHub Pages), Fluxo de depósito (browser para deposito/<login>/<lote>) (+14 more)

### Community 52 - "Conjuntos e organização"
Cohesion: 0.12
Nodes (15): BundleRef, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup, member_name() (+7 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.08
Nodes (52): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), accessesKey(), AccessManager(), change(), remember() (+44 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.16
Nodes (23): UploadEntry, Known, prepareUpload(), Row, State, UploadPage(), add(), onDrop() (+15 more)

### Community 55 - "Testes do servir"
Cohesion: 0.12
Nodes (14): PublicResult, only_personal(), remote_has_news(), serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_public_material_is_published_when_it_may_have_changed(), fake_publish() (+6 more)

### Community 56 - "Processamento local (servir)"
Cohesion: 0.19
Nodes (9): RemoteBusy, app_checkout(), app_has_update(), public_key(), PublicState, publish_public_if_due(), serve(), test_busy_remote_is_not_an_error() (+1 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.10
Nodes (26): @sqlite.org/sqlite-wasm@3.53.4-build1, devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+18 more)

### Community 58 - "Markdown.tsx"
Cohesion: 0.18
Nodes (10): katex@^0.18.9, react-markdown@^10.1.0, rehype-katex@^7.0.1, remark-gfm@^4.0.1, remark-math@^6.0.0, katex, react-markdown, rehype-katex (+2 more)

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
Cohesion: 0.13
Nodes (10): Git, GitError, _check_target(), github_slug(), publish_public(), _read_original(), indices_up_to_date(), process_and_publish() (+2 more)

### Community 64 - "Raspberry Pi"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 65 - "SqliteFtsSearch"
Cohesion: 0.25
Nodes (4): SearchBackend, SearchFilters, SearchHit, SqliteFtsSearch

### Community 66 - "Cursos e ligações"
Cohesion: 0.15
Nodes (8): Course, unit_key(), UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Unidade curricular (cadeira)

### Community 67 - "Path"
Cohesion: 0.36
Nodes (7): git(), _prepare(), test_cli_end_to_end(), test_process_and_publish_commits_and_indexes_each_batch(), test_process_and_publish_with_git(), test_push_rejected_is_retried_without_losing_files(), test_search_accents_spelling_and_filters()

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
Cohesion: 0.10
Nodes (14): fixed(), now(), config_dir(), _move(), _render(), scaffold(), ScaffoldReport, catalog_root() (+6 more)

### Community 74 - "app.spec.ts"
Cohesion: 0.08
Nodes (22): @playwright/test@^1.63.0, b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup() (+14 more)

### Community 75 - "extract/__init__.py"
Cohesion: 0.05
Nodes (65): DedupSettings, deep_merge(), _defaults(), ExtractionSettings, LimitSettings, load_settings(), PublishingSettings, _Section (+57 more)

### Community 76 - "classifier.py"
Cohesion: 0.10
Nodes (17): ClassificationSettings, contains_phrase(), fix_spacing_accents(), normalize(), strip_accents(), _unify_spelling(), material_folder(), check() (+9 more)

### Community 79 - "Catálogo"
Cohesion: 0.07
Nodes (30): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+22 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 83 - "App.tsx"
Cohesion: 0.12
Nodes (37): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+29 more)

### Community 84 - "Material público num repositório público à parte"
Cohesion: 0.08
Nodes (16): Detecção de cópias ao depositar (ownedSha), CSP estrita e noindex, Etapa 1: pedidos de catálogo, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Material público num repositório público à parte, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez) (+8 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 87 - "gerar.py"
Cohesion: 0.23
Nodes (12): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+4 more)

### Community 88 - "nexus.yml"
Cohesion: 0.08
Nodes (25): concurrency, cancel-in-progress, group, reclassificar, jobs, pipeline, name, on (+17 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "GitHubDataSource"
Cohesion: 0.16
Nodes (5): readCurrent(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "Migração de formatos"
Cohesion: 0.12
Nodes (12): read_yaml(), current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice() (+4 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "github.js"
Cohesion: 0.16
Nodes (17): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), adminCache, appJwt() (+9 more)

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 99 - "filetypes.py"
Cohesion: 0.25
Nodes (4): detect_extension(), extension_of(), mime_of(), _sniff()

### Community 100 - "Remoto ocupado (testes)"
Cohesion: 0.22
Nodes (3): wait_until_quiet(), _QuietGit, test_waits_until_the_interface_stops_writing()

### Community 103 - "vigiar-deposito.sh"
Cohesion: 0.22
Nodes (9): Processamento local (nexus servir), GitHub Actions como worker (concurrency), Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script (+1 more)

### Community 105 - "ErrorBox"
Cohesion: 0.17
Nodes (27): Button(), Card(), ErrorBox(), siteLink(), useAccountError(), WaitingPanel(), CourseRenamer(), UnitEditor() (+19 more)

### Community 106 - "session.ts"
Cohesion: 0.26
Nodes (11): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), GuestInfo, hasFlash(), loadSession() (+3 more)

### Community 107 - "scaffold"
Cohesion: 0.12
Nodes (14): scaffold(), instalar.sh script, Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Skills do Claude Code no repositório de dados, Token fine-grained guardado no browser, Criar o repositório de dados privado (+6 more)

### Community 122 - "PublishError"
Cohesion: 0.50
Nodes (3): PublishError, test_publish_refuses_the_data_repository(), failing()

### Community 126 - "index.html (entrada da interface)"
Cohesion: 0.20
Nodes (8): Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none), Interface em knowledge-nexus.github.io (só código)

## Knowledge Gaps
- **12 isolated node(s):** `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 833 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `classifier.py` to `Propostas de catálogo e texto`, `Estantes, cursos e configuração`, `Reconciliação do pipeline`, `review.py`, `pathlib`, `Classifier`, `run.py`, `Regras de classificação`, `Testes da classificação`, `Reason`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 72 inferred relationships involving `DataRepo` (e.g. with `Settings` and `Layout`) actually correct?**
  _`DataRepo` has 72 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.11639344262295082 - nodes in this community are weakly interconnected._
- **Why does `Contas no Worker do Cloudflare (D1)` connect `github.js` to `Contas no Worker`, `Cliente da API GitHub`, `r2.py`, `proxy.js`, `Repositório de dados (privado)`, `GitHubDataSource`, `Gestão dos acessos`?**
  _High betweenness centrality (0.078) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07402031930333818 - nodes in this community are weakly interconnected._