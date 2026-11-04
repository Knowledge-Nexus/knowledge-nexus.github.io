# Graph Report - knowledge-nexus.github.io  (2026-11-04)

## Corpus Check
- 229 files · ~159,618 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3049 nodes · 9470 edges · 120 communities (103 shown, 17 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 972 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b67004d6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Testes do pipeline
- Biblioteca e visibilidade
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- cli.py
- AccessManager
- nexus vigiar e API GitHub
- R2BlobStore
- Reconciliação do pipeline
- Tipos da interface e revisão
- Índices e material público
- Pontuação da classificação
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- Layout do repositório de dados
- useApp
- Registos do domínio
- Regras de classificação
- GitHubDataSource
- Testes da classificação
- test_domain.py
- Partilha e visibilidade pública
- Fontes de dados e cache
- Abrir arquivos (unpack)
- document_types
- Recepção do depósito
- pathlib
- Visor de documentos e PDF
- Dependências da interface
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- pdf.py
- Catálogo de exemplo
- Testes da extracção
- Índice e tipos da interface
- Workflow de CI
- Credencial GitHub do Worker
- DataRepo
- Proxy e níveis do Worker
- Lotes zip e extracção
- public.py
- Layout e ajuda
- Projectos de código
- extraction
- Regras de partilha e visibilidade (documento, tipo, cadeira, privado)
- Processar e publicar
- Configuração do Biome
- Repositório de dados (privado)
- Conjuntos e organização
- Gestão dos acessos
- Depositar ficheiros
- Testes do servir
- Processamento local (servir)
- Dependências de desenvolvimento
- shutil
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- Definições do motor
- Git do motor
- Raspberry Pi
- Entrada do Worker e blobs
- Cursos e ligações
- Vocabulário e arrumação
- Skills de revisão e catálogo
- Modo de leitura
- Privacidade e CSP
- ReaderPage
- Skill processar depósito
- Fixtures dos testes
- GitHub simulado
- extract/__init__.py
- Texto e sinais
- Testes E2E
- Capturas e D1 simulada
- Catálogo
- Blobs no git
- Workflow Pages
- Workflow nexus (gatilhos)
- DocumentPage.tsx
- Repositório público e guarda
- env
- office.py
- gerar.py
- nexus.yml
- Scripts da interface
- GitHubDataSource
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- github.js
- Configuração Vite
- migrate.py
- FakeS3
- Estrutura do repositório de dados
- filetypes.py
- Remoto ocupado (testes)
- HybridBlobStore
- BlobStore
- vigiar-deposito.sh
- migrations.py
- UnitEditor
- App.tsx
- Skills e hook do template
- r2.py
- git.py
- Migração dos códigos (D1)
- Projecto Python
- uuid7
- Testes da publicação
- index.html (entrada da interface)

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 109 edges
2. `useApp()` - 89 edges
3. `Pipeline` - 84 edges
4. `ErrorBox()` - 81 edges
5. `Button()` - 71 edges
6. `Document` - 68 edges
7. `Layout` - 58 edges
8. `normalize()` - 51 edges
9. `deposit()` - 48 edges
10. `Record` - 46 edges

## Surprising Connections (you probably didn't know these)
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
- `Repositório de dados (privado)` --references--> `Layout`  [INFERRED]
  docs/repo-dados.md → backend/nexus/datarepo/layout.py
- `Extracção (texto/<sha>/meta.json)` --references--> `ExtractionMeta`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/extraction.py
- `Proposta de catálogo` --references--> `CatalogProposal`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/proposals.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (120 total, 17 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.11
Nodes (50): pdf_nativo(), deposit(), git(), test_cli_end_to_end(), test_process_and_publish_commits_and_indexes_each_batch(), test_process_and_publish_with_git(), test_push_rejected_is_retried_without_losing_files(), docs() (+42 more)

### Community 1 - "Biblioteca e visibilidade"
Cohesion: 0.07
Nodes (57): Página da cadeira (UnitDetail), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconArrowRight() (+49 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (40): config_dir(), Catalog, roman(), series_number(), acceptable(), _clean(), detect(), add() (+32 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (59): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Notice(), unitColor(), CatalogBundle, CourseRow (+51 more)

### Community 4 - "cli.py"
Cohesion: 0.06
Nodes (50): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+42 more)

### Community 5 - "AccessManager"
Cohesion: 0.20
Nodes (15): submit(), submit(), accessesKey(), AccessManager(), change(), remember(), codesKey(), storeCode() (+7 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "R2BlobStore"
Cohesion: 0.24
Nodes (6): R2BlobStore, _file(), test_client_only_when_needed(), test_hard_cut_when_over_limit(), test_migrate_originals(), test_put_materialize_and_dedup()

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.08
Nodes (7): Document, HistoryEntry, Status, Pipeline, Remover documentos (caixote do lixo, removed: {at, by}), Documento (cópia lógica por utilizador), Estados do documento (received, extracted, classified, filed, enriched, reviewed)

### Community 9 - "Tipos da interface e revisão"
Cohesion: 0.08
Nodes (48): ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList(), ReasonText(), SPINES, Alternative (+40 more)

### Community 10 - "Índices e material público"
Cohesion: 0.09
Nodes (21): Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics(), near_duplicate_pairs(), _required_confidence() (+13 more)

### Community 11 - "Pontuação da classificação"
Cohesion: 0.09
Nodes (29): Alternative, Classification, FieldValue, Reason, contains_phrase(), Classifier, kept(), pick() (+21 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.15
Nodes (31): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+23 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.15
Nodes (28): IconTrash(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove(), RemovedList() (+20 more)

### Community 14 - "Página de entrada"
Cohesion: 0.11
Nodes (47): Identidade visual (pergaminho, azul-marinho e dourado), Página de apresentação e popups de entrada, BrandBanner(), BrandIcon(), DefaultMark(), IconShield(), IconTicket(), IconUser() (+39 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.10
Nodes (34): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, scope(), useMarkEditor() (+26 more)

### Community 16 - "Layout do repositório de dados"
Cohesion: 0.16
Nodes (4): Layout, _render(), scaffold(), ScaffoldReport

### Community 18 - "useApp"
Cohesion: 0.10
Nodes (40): Home(), Shell(), Card(), PageHeader(), ACTIVE, AppContext, useApp(), useSearchIndex() (+32 more)

### Community 19 - "Registos do domínio"
Cohesion: 0.09
Nodes (12): Record, Removal, Evidence, Generated, SourceRef, Enrollments, Group, GroupMember (+4 more)

### Community 20 - "Regras de classificação"
Cohesion: 0.06
Nodes (34): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+26 more)

### Community 21 - "GitHubDataSource"
Cohesion: 0.09
Nodes (25): fflate@^0.8.3, yaml@^2.9.1, AccountSession, RepoInfo, RepoRef, GuestInfo, APP_REPOSITORY, buildLotes() (+17 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.13
Nodes (26): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+18 more)

### Community 23 - "test_domain.py"
Cohesion: 0.25
Nodes (7): test_catalog_import_rejects_bad_slug(), test_catalog_import_rejects_unknown_unit_reference(), test_catalog_request_adds_aliases_without_losing_existing(), test_catalog_request_keeps_fields_it_does_not_mention(), test_migrations_apply_in_order(), test_normalize_unifies_spellings(), test_yaml_is_deterministic_and_keeps_unknown_fields()

### Community 24 - "Partilha e visibilidade pública"
Cohesion: 0.14
Nodes (22): read_yaml(), User, effective_visibility(), is_public(), type_key(), Visibility, parse_visibility(), set_type_visibility() (+14 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.08
Nodes (16): manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), AppData, WorkflowRun (+8 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.14
Nodes (25): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+17 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (39): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+31 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.16
Nodes (8): Review, Source, expected_extractor(), DepositItem, ItemError, PartsIncomplete, _Staging, is_archive_name()

### Community 29 - "pathlib"
Cohesion: 0.09
Nodes (13): dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed(), build() (+5 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.13
Nodes (23): pageUnitsHeight(), closeOnRemoval(), openPdf(), pageSize(), PdfDocument, pdfOutline(), PdfPage, pdfPath() (+15 more)

### Community 31 - "Dependências da interface"
Cohesion: 0.08
Nodes (33): dependencies, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289, react@^19.3.0 (+25 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (36): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+28 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.10
Nodes (8): AccountError, AccountInvite, ACCOUNTS_URL, AccountsApi, AccountsConfig, FetchLike, STORAGE_URL, AccountRole

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (11): encodePath(), FetchLike, GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), Change (+3 more)

### Community 35 - "pdf.py"
Cohesion: 0.14
Nodes (10): MissingToolError, require(), which(), _has_osd(), ocr_image(), OcrResult, _parse_tsv(), extract_pdf() (+2 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Testes da extracção"
Cohesion: 0.18
Nodes (13): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_ocr_workers_respect_the_machine_limit() (+5 more)

### Community 38 - "Índice e tipos da interface"
Cohesion: 0.06
Nodes (26): Procedimento para mudar o esquema do índice, GitHub Actions como worker (concurrency), Pesquisa FTS5 (texto original e normalizado), Ramo indices (órfão, um só commit), SQLite WASM em memória no browser (cache IndexedDB), pesquisa.db.gz (FTS5 pages_fts), dir, hasIndex (+18 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.14
Nodes (9): resetGitHubCache(), call(), fakeGitHub(), HEAD, push(), setRole(), sha(), signup() (+1 more)

### Community 41 - "DataRepo"
Cohesion: 0.24
Nodes (9): DataRepo, CatalogProposal, accept_unit_proposal(), set_document_visibility(), test_project_folder_is_a_bundle_filed_with_its_statement(), test_same_text_in_different_files_is_kept_once(), test_stale_junk_proposals_are_rejected(), test_user_bundle_is_kept_and_named() (+1 more)

### Community 42 - "Proxy e níveis do Worker"
Cohesion: 0.14
Nodes (24): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), effectiveRole(), github() (+16 more)

### Community 43 - "Lotes zip e extracção"
Cohesion: 0.27
Nodes (6): _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 44 - "public.py"
Cohesion: 0.10
Nodes (15): fixed(), now(), DocumentKind, export_tree(), ExportReport, _auth_env(), build_public_site(), _check_target() (+7 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.17
Nodes (22): BRAND, Brand(), IconBooks(), IconCheckList(), IconHelp(), IconHome(), IconInbox(), IconSearch() (+14 more)

### Community 46 - "Projectos de código"
Cohesion: 0.12
Nodes (19): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+11 more)

### Community 47 - "extraction"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 48 - "Regras de partilha e visibilidade (documento, tipo, cadeira, privado)"
Cohesion: 0.07
Nodes (19): upgrade(), upgrade(), upgrade(), upgrade(), SearchBackend, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Fase 5: abertura a outros utilizadores, Envio em partes de ficheiros grandes (> 10 MB) (+11 more)

### Community 49 - "Processar e publicar"
Cohesion: 0.15
Nodes (9): GitError, RunReport, commit_message(), indices_up_to_date(), process_and_publish(), ProcessResult, publish_index_branch(), _remote_indices_source() (+1 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (privado)"
Cohesion: 0.17
Nodes (13): Depósito (envio sem organizar), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Knowledge Nexus (plataforma de estudo), Fluxo de depósito (browser para deposito/<login>/<lote>), Formas de depositar (interface, GitHub, pasta vigiada), Extracção (texto/<sha>/meta.json), Pergunta (banco de perguntas) (+5 more)

### Community 52 - "Conjuntos e organização"
Cohesion: 0.09
Nodes (19): BundleRef, bundle_id(), choose_lead(), key(), folder_name(), folder_of(), FolderGroup, inherit() (+11 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.11
Nodes (41): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), AccessRow(), addDays(), rename(), renew() (+33 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.16
Nodes (23): UploadEntry, Known, prepareUpload(), Row, State, UploadPage(), add(), onDrop() (+15 more)

### Community 55 - "Testes do servir"
Cohesion: 0.18
Nodes (10): remote_has_news(), serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed(), test_remote_has_news_after_other_clone_pushes(), test_serve_migrates_and_processes_in_batches() (+2 more)

### Community 56 - "Processamento local (servir)"
Cohesion: 0.15
Nodes (12): RemoteBusy, app_checkout(), app_has_update(), only_personal(), public_key(), PublicState, publish_public_if_due(), serve() (+4 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "shutil"
Cohesion: 0.44
Nodes (5): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version()

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.21
Nodes (19): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+11 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (9): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+1 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "Definições do motor"
Cohesion: 0.18
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 64 - "Raspberry Pi"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 65 - "Entrada do Worker e blobs"
Cohesion: 0.22
Nodes (16): canRead(), canWrite(), handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle() (+8 more)

### Community 66 - "Cursos e ligações"
Cohesion: 0.14
Nodes (9): Course, CurricularUnit, unit_key(), UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira (+1 more)

### Community 67 - "Vocabulário e arrumação"
Cohesion: 0.26
Nodes (6): slugify(), Term, Vocabularies, filed_name(), original_stem(), test_slugify()

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.11
Nodes (30): Modo de leitura (Reader), Marcas de leitura, Markdown(), OutlineEntry, ChromeButton(), OutlineList(), PageSource, ReaderText() (+22 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.36
Nodes (8): Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta), Marcas de leitura (marcador, sublinhado, caneta), Sessão (identificador aleatório no browser; servidor guarda só um resumo), Tokens de cor da interface (paper, sheet, ink, pen, navy, gold, line), Pedidos do utilizador (mudar nome e palavra-passe; apagar a conta pelo dono)

### Community 71 - "ReaderPage"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "Fixtures dos testes"
Cohesion: 0.27
Nodes (7): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo()

### Community 74 - "GitHub simulado"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.14
Nodes (15): PageMeta, clean_text(), ExtractionResult, looks_mathematical(), PageText, archive_listing(), code_project_text(), write_extraction() (+7 more)

### Community 76 - "Texto e sinais"
Cohesion: 0.09
Nodes (23): ClassificationSettings, ExtractionMeta, contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), sequel_after(), strip_accents() (+15 more)

### Community 77 - "Testes E2E"
Cohesion: 0.23
Nodes (10): CORS, decode(), routeGitHub(), routeWorker(), snapshot, withFakeGitHub(), workerEnv(), workerEnvs (+2 more)

### Community 78 - "Capturas e D1 simulada"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 79 - "Catálogo"
Cohesion: 0.11
Nodes (24): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+16 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Workflow nexus (gatilhos)"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 83 - "DocumentPage.tsx"
Cohesion: 0.17
Nodes (22): Nome dado pelo dono (classification.title), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), TextPane(), useBinary(), IconDownload() (+14 more)

### Community 84 - "Repositório público e guarda"
Cohesion: 0.22
Nodes (3): Repositório da aplicação (público, GitHub Pages), Uso local para desenvolvimento (WSL2), guarda-binarios.sh script

### Community 85 - "env"
Cohesion: 0.05
Nodes (43): .github/workflows/nexus.yml do repositório de dados, default, description, type, GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL (+35 more)

### Community 86 - "office.py"
Cohesion: 0.33
Nodes (11): ExtractionSettings, ExtractionError, extract_docx(), extract_legacy(), extract_pptx(), extract_xlsx(), libreoffice_convert(), _markdown_table() (+3 more)

### Community 87 - "gerar.py"
Cohesion: 0.23
Nodes (11): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pptx_slides() (+3 more)

### Community 88 - "nexus.yml"
Cohesion: 0.12
Nodes (15): concurrency, cancel-in-progress, group, jobs, pipeline, name, permissions, actions (+7 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "GitHubDataSource"
Cohesion: 0.17
Nodes (5): readCurrent(), GitHubDataSource, nowIso(), pad(), yamlUpdate()

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

### Community 96 - "migrate.py"
Cohesion: 0.31
Nodes (5): migrate_originals(), MigrationReport, _originals(), _sha256(), QuotaExceeded

### Community 98 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 99 - "filetypes.py"
Cohesion: 0.31
Nodes (3): detect_extension(), mime_of(), _sniff()

### Community 103 - "vigiar-deposito.sh"
Cohesion: 0.29
Nodes (7): Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script, UV_PROJECT_ENVIRONMENT

### Community 105 - "UnitEditor"
Cohesion: 0.83
Nodes (4): UnitEditor(), remove(), save(), send()

### Community 106 - "App.tsx"
Cohesion: 0.13
Nodes (18): App(), PublicShell(), queryClient, signOutAccount(), WelcomeOrHome(), WelcomeRoute(), buttonClass(), AccountUser (+10 more)

### Community 108 - "r2.py"
Cohesion: 0.23
Nodes (7): missing_credentials(), _s3_client(), StorageUnavailable, unavailable_message(), Originais no Cloudflare R2 (opcional), Abertura de PDFs por partes (PDFDataRangeTransport), Credenciais NEXUS_R2_* (R2 API token)

### Community 120 - "uuid7"
Cohesion: 0.16
Nodes (8): uuid7(), BlobRef, Detecção de cópias ao depositar (ownedSha), Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Blob, originais/<aa>/<sha256>.<ext> (imutáveis), test_uuid7_is_version_7_and_sortable()

### Community 122 - "Testes da publicação"
Cohesion: 0.33
Nodes (4): PublicResult, test_public_material_is_published_when_it_may_have_changed(), failing(), fake_publish()

### Community 126 - "index.html (entrada da interface)"
Cohesion: 0.25
Nodes (6): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 801 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **17 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Visão geral «só GitHub»` connect `Índice e tipos da interface` to `cli.py`, `Proxy e níveis do Worker`, `Skills e hook do template`, `Repositório de dados (privado)`, `Repositório público e guarda`, `env`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `DataRepo` (e.g. with `servir()` and `Settings`) actually correct?**
  _`DataRepo` has 73 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.10576923076923077 - nodes in this community are weakly interconnected._
- **Why does `Contas no Worker do Cloudflare (D1)` connect `Proxy e níveis do Worker` to `Contas no Worker`, `API das contas (interface)`, `Cliente da API GitHub`, `Índice e tipos da interface`, `r2.py`, `Gestão dos acessos`, `github.js`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `Biblioteca e visibilidade` be split into smaller, more focused modules?**
  _Cohesion score 0.06773211567732115 - nodes in this community are weakly interconnected._