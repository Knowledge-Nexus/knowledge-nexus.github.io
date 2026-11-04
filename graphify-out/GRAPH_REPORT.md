# Graph Report - knowledge-nexus.github.io  (2026-11-04)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3047 nodes · 9460 edges · 128 communities (112 shown, 16 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 972 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `36064a1d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Testes do pipeline
- Biblioteca e visibilidade
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- Comandos da CLI
- Acessos e cofre de códigos
- nexus vigiar e API GitHub
- Originais no R2
- Reconciliação do pipeline
- Tipos da interface e revisão
- Índices e material público
- Pontuação da classificação
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- Layout do repositório de dados
- Classificador
- Rotas e página inicial
- Registos do domínio
- Regras de classificação
- GitHubDataSource
- Testes da classificação
- Catálogo (leitura e pedidos)
- Partilha e visibilidade pública
- Fontes de dados e cache
- Abrir arquivos (unpack)
- Vocabulários (papéis e épocas)
- Recepção do depósito
- Geradores de amostras e índices
- Visor de documentos e PDF
- Dependências da interface
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Extractores PDF e Office
- Catálogo de exemplo
- Testes da extracção
- Índice e tipos da interface
- Workflow de CI
- Credencial GitHub do Worker
- Revisão na CLI
- Proxy e níveis do Worker
- Lotes zip e extracção
- YAML determinístico e scaffold
- Layout e ajuda
- Projectos de código
- Predefinições (arquivos e limites)
- Esquema SQL e Alembic
- Processar e publicar
- Configuração do Biome
- Repositório de dados (documentação)
- Conjuntos e organização
- Gestão dos acessos
- Depositar ficheiros
- Testes do servir
- Processamento local (servir)
- Dependências de desenvolvimento
- Armazenamento e diagnóstico
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
- Marcas na página
- Skill processar depósito
- Fixtures dos testes
- GitHub simulado
- Ramo indices e pesquisa
- Texto e sinais
- Testes E2E
- Capturas e D1 simulada
- Catálogo
- Blobs no git
- Workflow Pages
- Workflow nexus (gatilhos)
- Segurança e material público
- Repositório público e guarda
- Pipeline reutilizável (entradas)
- Pipeline reutilizável (ambiente)
- Pipeline reutilizável (passos)
- Processamento local e workflow
- Scripts da interface
- GitHubDataSource
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- Worker: erros e códigos
- Configuração Vite
- Abrir o repositório (CLI)
- Pipeline reutilizável (checkout)
- Estrutura do repositório de dados
- Workflow nexus (chamada)
- Remoto ocupado (testes)
- Depósito e pipeline
- Fase 5 e limites
- Tipos de documento
- Vocabulário e catálogo
- Visibilidade na CLI
- Sessão da interface
- Skills e hook do template
- Credenciais e serviços
- Testes do git
- Migração dos códigos (D1)
- Projecto Python
- Predefinições de extracção
- Organização da origem
- Reconciliação e revisão
- Documentos e cópias
- Pesos das fontes
- Testes da publicação
- Projectos de código (config)
- Pesquisa FTS5
- Remover cursos
- Montagem da interface
- Contas: configuração

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

## Communities (128 total, 16 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.12
Nodes (48): pdf_nativo(), deposit(), docs(), _lote(), run(), _split(), test_ai_proposal_never_overrides_user(), test_archive_with_code_project_and_nested_zip() (+40 more)

### Community 1 - "Biblioteca e visibilidade"
Cohesion: 0.08
Nodes (56): Página da cadeira (UnitDetail), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconDownload() (+48 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.07
Nodes (36): config_dir(), Catalog, normalize(), series_number(), acceptable(), _clean(), detect(), add() (+28 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (71): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), IconArrowRight(), SuggestInput(), Button(), ErrorBox(), Notice() (+63 more)

### Community 4 - "Comandos da CLI"
Cohesion: 0.14
Nodes (16): catalogo_aceitar(), catalogo_importar(), documento_texto(), exportar_arvore(), _fail(), _main(), migrar(), migrar_blobs() (+8 more)

### Community 5 - "Acessos e cofre de códigos"
Cohesion: 0.10
Nodes (29): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), GuestInfo, submit(), submit(), remember() (+21 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "Originais no R2"
Cohesion: 0.08
Nodes (14): migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, QuotaExceeded, R2BlobStore, FakeS3 (+6 more)

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.10
Nodes (6): Document, HistoryEntry, choose_lead(), key(), member_name(), Remover documentos (caixote do lixo, removed: {at, by})

### Community 9 - "Tipos da interface e revisão"
Cohesion: 0.09
Nodes (44): Nome dado pelo dono (classification.title), ButtonVariant, certaintyLevel(), ConfidenceBadge(), EditButton(), methodKind(), ReasonList(), ReasonText() (+36 more)

### Community 10 - "Índices e material público"
Cohesion: 0.07
Nodes (36): DataRepo, Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics(), near_duplicate_pairs() (+28 more)

### Community 11 - "Pontuação da classificação"
Cohesion: 0.11
Nodes (26): Alternative, Reason, pick(), _text_only(), unit_features(), Candidate, CompiledTerm, confidence() (+18 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.16
Nodes (30): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+22 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (42): IconTrash(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove(), RemovedList() (+34 more)

### Community 14 - "Página de entrada"
Cohesion: 0.10
Nodes (42): Página de apresentação e popups de entrada, BrandBanner(), IconGoogle(), IconShield(), IconTicket(), IconUser(), IconUserPlus(), Modal() (+34 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.19
Nodes (18): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, scope(), useMarkEditor() (+10 more)

### Community 17 - "Classificador"
Cohesion: 0.11
Nodes (10): Classification, FieldValue, ExtractionMeta, inherit(), Classifier, weak(), Outcome, _producer() (+2 more)

### Community 18 - "Rotas e página inicial"
Cohesion: 0.15
Nodes (32): Home(), PublicShell(), queryClient, Shell(), buttonClass(), Card(), Empty(), PageHeader() (+24 more)

### Community 19 - "Registos do domínio"
Cohesion: 0.06
Nodes (20): Record, uuid7(), DocumentKind, Removal, Status, CatalogProposal, Evidence, Generated (+12 more)

### Community 20 - "Regras de classificação"
Cohesion: 0.10
Nodes (18): Opção file_uncertain_type (tipo por confirmar), classification, academic_year_start_month, auto_file_threshold, body_pages, enrollment_boost, file_uncertain_type, header_chars (+10 more)

### Community 21 - "GitHubDataSource"
Cohesion: 0.09
Nodes (25): Níveis de conta (none, viewer, reader, contributor, organizer, editor), fflate@^0.8.3, yaml@^2.9.1, AccountSession, AppData, RepoInfo, RepoRef, APP_REPOSITORY (+17 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.12
Nodes (28): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+20 more)

### Community 23 - "Catálogo (leitura e pedidos)"
Cohesion: 0.16
Nodes (13): CatalogError, _check_slug(), _given(), import_bundle(), ImportReport, _merge(), _write_entity(), test_catalog_import_is_idempotent() (+5 more)

### Community 24 - "Partilha e visibilidade pública"
Cohesion: 0.12
Nodes (26): read_yaml(), User, effective_visibility(), is_public(), type_key(), Visibility, parse_visibility(), set_document_visibility() (+18 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (16): Abertura de PDFs por partes (PDFDataRangeTransport), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun, fetchPublicManifest() (+8 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.14
Nodes (25): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+17 more)

### Community 27 - "Vocabulários (papéis e épocas)"
Cohesion: 0.14
Nodes (18): labels, labels, exam_seasons, keywords, labels, slug, en, pt-PT (+10 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.13
Nodes (10): BlobRef, Review, Source, sha256_file(), DepositItem, ItemError, PartsIncomplete, Pipeline (+2 more)

### Community 29 - "Geradores de amostras e índices"
Cohesion: 0.10
Nodes (18): _auth_env(), docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado() (+10 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.15
Nodes (20): pageUnitsHeight(), closeOnRemoval(), openPdf(), pageSize(), PdfDocument, pdfOutline(), PdfPage, pdfPath() (+12 more)

### Community 31 - "Dependências da interface"
Cohesion: 0.08
Nodes (31): dependencies, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289, react@^19.3.0 (+23 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.21
Nodes (24): cleanEmail(), cleanPassword(), clientIp(), createSession(), decodeIdToken(), findInvite(), googleReady(), googleReturn() (+16 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (12): encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), Change, commitChanges() (+4 more)

### Community 35 - "Extractores PDF e Office"
Cohesion: 0.10
Nodes (32): ExtractionSettings, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), MissingToolError, PageText, require() (+24 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Testes da extracção"
Cohesion: 0.18
Nodes (13): extract_file(), test_detect_extension_without_name(), test_docx_equation_becomes_latex(), test_image_ocr(), test_latex_style_accents_are_joined(), test_legacy_doc_is_converted(), test_native_pdf(), test_ocr_workers_respect_the_machine_limit() (+5 more)

### Community 38 - "Índice e tipos da interface"
Cohesion: 0.05
Nodes (45): Procedimento para mudar o esquema do índice, vitest@^5.0.2, ACTIVE, AppContext, useSearchIndex(), dir, hasIndex, vectors (+37 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "Revisão na CLI"
Cohesion: 0.14
Nodes (14): catalogo_propostas(), documento_mostrar(), main(), _print_json(), revisao_listar(), accept_unit_proposal(), describe(), _get() (+6 more)

### Community 42 - "Proxy e níveis do Worker"
Cohesion: 0.17
Nodes (23): Contas no Worker do Cloudflare (D1), canRead(), canWrite(), effectiveRole(), adminLogin(), dataRepo(), github(), ownerLogin() (+15 more)

### Community 43 - "Lotes zip e extracção"
Cohesion: 0.16
Nodes (9): write_text_if_changed(), PageMeta, write_extraction(), _assemble(), expand_lotes(), _extract(), LoteError, LoteReport (+1 more)

### Community 44 - "YAML determinístico e scaffold"
Cohesion: 0.11
Nodes (12): fixed(), now(), dump_yaml(), _Dumper, _str_representer(), write_json_if_changed(), write_yaml_if_changed(), kept() (+4 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.15
Nodes (25): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+17 more)

### Community 46 - "Projectos de código"
Cohesion: 0.11
Nodes (21): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in() (+13 more)

### Community 47 - "Predefinições (arquivos e limites)"
Cohesion: 0.15
Nodes (12): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, dedup (+4 more)

### Community 48 - "Esquema SQL e Alembic"
Cohesion: 0.17
Nodes (3): upgrade(), upgrade(), upgrade()

### Community 49 - "Processar e publicar"
Cohesion: 0.17
Nodes (8): RunReport, commit_message(), indices_up_to_date(), process_and_publish(), ProcessResult, publish_index_branch(), _remote_indices_source(), fake_process()

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (documentação)"
Cohesion: 0.15
Nodes (14): Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Extracção (texto/<sha>/meta.json), Flashcard (estado FSRS), Pergunta (banco de perguntas) (+6 more)

### Community 52 - "Conjuntos e organização"
Cohesion: 0.14
Nodes (11): BundleRef, bundle_id(), folder_name(), folder_of(), FolderGroup, project_folders(), _qualifies(), expected_extractor() (+3 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.15
Nodes (31): accessesKey(), AccessManager(), change(), AccessRow(), addDays(), rename(), renew(), setUntil() (+23 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.12
Nodes (31): DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), TextPane(), useBinary(), UploadEntry, ReaderLoader() (+23 more)

### Community 55 - "Testes do servir"
Cohesion: 0.18
Nodes (10): serve_once(), _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed(), test_remote_has_news_after_other_clone_pushes(), test_serve_commits_skip_ci(), test_serve_migrates_and_processes_in_batches() (+2 more)

### Community 56 - "Processamento local (servir)"
Cohesion: 0.18
Nodes (10): GitError, RemoteBusy, publish_public(), app_checkout(), app_has_update(), PublicState, publish_public_if_due(), serve() (+2 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (21): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+13 more)

### Community 58 - "Armazenamento e diagnóstico"
Cohesion: 0.09
Nodes (11): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), alembic_config(), BlobStore, _s3_client() (+3 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.33
Nodes (12): dummyHash(), base64url(), checkPassword(), encoder, fromBase64url(), hashPassword(), hmacKey(), pbkdf2() (+4 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (9): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+1 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "Definições do motor"
Cohesion: 0.19
Nodes (14): ClassificationSettings, DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section (+6 more)

### Community 63 - "Git do motor"
Cohesion: 0.20
Nodes (3): Git, public_key(), wait_until_quiet()

### Community 64 - "Raspberry Pi"
Cohesion: 0.37
Nodes (11): as_nexus(), ask(), info(), install_all(), say(), set_env(), instalar.sh script, uninstall() (+3 more)

### Community 65 - "Entrada do Worker e blobs"
Cohesion: 0.23
Nodes (15): handleAccounts(), SESSION_PREFIX, sessionUser(), withCors(), allowed(), authCache, handle(), handleBlob() (+7 more)

### Community 66 - "Cursos e ligações"
Cohesion: 0.16
Nodes (8): Course, UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira, Instituição, Unidade curricular (cadeira)

### Community 67 - "Vocabulário e arrumação"
Cohesion: 0.15
Nodes (12): slugify(), Term, Vocabularies, material_folder(), check(), compile_terms(), _signal(), filed_name() (+4 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.11
Nodes (29): Modo de leitura (Reader), Markdown(), OutlineEntry, ChromeButton(), imageSource(), OutlineList(), PageSource, ReaderText() (+21 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "Marcas na página"
Cohesion: 0.11
Nodes (30): Marcas de leitura, MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), BASE_WIDTH (+22 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "Fixtures dos testes"
Cohesion: 0.27
Nodes (7): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo()

### Community 74 - "GitHub simulado"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "Ramo indices e pesquisa"
Cohesion: 0.15
Nodes (7): GitHub Actions como worker (concurrency), Pesquisa FTS5 (texto original e normalizado), Ramo indices (órfão, um só commit), SQLite WASM em memória no browser (cache IndexedDB), manifest.json (built_from, built_at, SHA-256), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts)

### Community 76 - "Texto e sinais"
Cohesion: 0.09
Nodes (12): contains_phrase(), contains_unit_phrase(), fix_spacing_accents(), _numbers_after(), roman(), sequel_after(), strip_accents(), _unify_spelling() (+4 more)

### Community 77 - "Testes E2E"
Cohesion: 0.23
Nodes (10): CORS, decode(), routeGitHub(), routeWorker(), snapshot, withFakeGitHub(), workerEnv(), workerEnvs (+2 more)

### Community 78 - "Capturas e D1 simulada"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 79 - "Catálogo"
Cohesion: 0.15
Nodes (16): export_bundle(), load_catalog(), remove_unit(), write_unit(), model_to_data(), Assessment, CatalogBundle, CourseUnitLink (+8 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Workflow nexus (gatilhos)"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 83 - "Segurança e material público"
Cohesion: 0.13
Nodes (10): scaffold(), vigiar(), CSP estrita e noindex, Material público num repositório público à parte, Pipeline nexus processar, Publicação incremental (commit por item, índices a cada dez), Segurança e privacidade, Token fine-grained guardado no browser (+2 more)

### Community 85 - "Pipeline reutilizável (entradas)"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 86 - "Pipeline reutilizável (ambiente)"
Cohesion: 0.20
Nodes (10): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+2 more)

### Community 87 - "Pipeline reutilizável (passos)"
Cohesion: 0.20
Nodes (10): jobs, processar, runs-on, steps, timeout-minutes, id, if, name (+2 more)

### Community 88 - "Processamento local e workflow"
Cohesion: 0.11
Nodes (17): concurrency, cancel-in-progress, group, name, permissions, actions, contents, only_personal() (+9 more)

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "GitHubDataSource"
Cohesion: 0.15
Nodes (6): readCurrent(), GitHubDataSource, nowIso(), pad(), yamlUpdate(), IndexManifest

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "Migração de formatos"
Cohesion: 0.14
Nodes (10): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+2 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "Worker: erros e códigos"
Cohesion: 0.22
Nodes (18): admin(), applyInvite(), cleanName(), cleanRole(), cleanUntil(), createUser(), newId(), requireAdmin() (+10 more)

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 96 - "Abrir o repositório (CLI)"
Cohesion: 0.24
Nodes (4): catalogo_exportar(), indexar(), _repo(), DataRepoError

### Community 97 - "Pipeline reutilizável (checkout)"
Cohesion: 0.25
Nodes (8): with, fetch-depth, filter, key, path, restore-keys, sparse-checkout, sparse-checkout-cone-mode

### Community 98 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 99 - "Workflow nexus (chamada)"
Cohesion: 0.25
Nodes (8): jobs, pipeline, if, secrets, uses, with, app-ref, reclassify

### Community 101 - "Depósito e pipeline"
Cohesion: 0.17
Nodes (12): Depósito (envio sem organizar), Knowledge Nexus (plataforma de estudo), Repositório da aplicação (público, GitHub Pages), Fluxo de depósito (browser para deposito/<login>/<lote>), Formas de depositar (interface, GitHub, pasta vigiada), deposito/<login>/<lote>/ (entrada e _erros), Referência *.ref.yaml (conteúdo já existente), .github/workflows/nexus.yml do repositório de dados (+4 more)

### Community 102 - "Fase 5 e limites"
Cohesion: 0.19
Nodes (8): upgrade(), SearchBackend, Fase 5: abertura a outros utilizadores, Envio em partes de ficheiros grandes (> 10 MB), Lotes zip para muitos ficheiros (>= 20), Limites conhecidos (tamanho, tempo, privacidade, índice), Questões por decidir, Esquema relacional de partida para a fase 5

### Community 103 - "Tipos de documento"
Cohesion: 0.17
Nodes (12): document_types, excluded_by, extensions, is_assessment, is_fallback, is_submission, is_syllabus, keywords (+4 more)

### Community 104 - "Vocabulário e catálogo"
Cohesion: 0.24
Nodes (9): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, patterns, slug, generic_terms, version, Vocabulários (+1 more)

### Community 105 - "Visibilidade na CLI"
Cohesion: 0.24
Nodes (4): catalogo_rejeitar(), visibilidade_cadeira(), visibilidade_documento(), visibilidade_tipo()

### Community 106 - "Sessão da interface"
Cohesion: 0.31
Nodes (9): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession(), read() (+1 more)

### Community 108 - "Credenciais e serviços"
Cohesion: 0.25
Nodes (9): missing_credentials(), Serviço knowledge-nexus no Raspberry Pi, Campos obrigatórios para arrumar, Credenciais NEXUS_R2_* (R2 API token), Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Configurar a página pública (estudo-publico), Processar num Raspberry Pi (guia de instalação) (+1 more)

### Community 117 - "Predefinições de extracção"
Cohesion: 0.22
Nodes (9): extraction, ai_transcription_confidence, max_xlsx_cols, max_xlsx_rows, min_native_chars_per_page, ocr_dpi, ocr_languages, ocr_timeout_seconds (+1 more)

### Community 118 - "Organização da origem"
Cohesion: 0.32
Nodes (4): group_folder(), Layout, parse(), Organização da origem (<inst>/<ano>/<semestre>/<cadeira>)

### Community 119 - "Reconciliação e revisão"
Cohesion: 0.25
Nodes (7): CLASSIFIER_VERSION (reclassificação), Versão do extractor (provoca nova extracção), Etapa 3: reconciliação (classificar, arrumar ou rever), Fluxo de revisão (patch method: user, depois reviewed), Proposta de catálogo, Classificação por campo (value, confidence, method, reasons, alternatives), Estados do documento (received, extracted, classified, filed, enriched, reviewed)

### Community 120 - "Documentos e cópias"
Cohesion: 0.29
Nodes (6): Detecção de cópias ao depositar (ownedSha), Blob, Cópias e duplicados (duplicate_of, near_duplicates_dismissed), Documento (cópia lógica por utilizador), Grupo (fase 5), Trabalho (enunciado, tarefas, membros)

### Community 121 - "Pesos das fontes"
Cohesion: 0.25
Nodes (8): source_weights, archive, body, filename, header, layout, metadata, path

### Community 122 - "Testes da publicação"
Cohesion: 0.33
Nodes (4): PublicResult, test_public_material_is_published_when_it_may_have_changed(), failing(), fake_publish()

### Community 123 - "Projectos de código (config)"
Cohesion: 0.33
Nodes (6): code_projects, code_extensions, code_ratio, ignored_dirs, markers, min_code_files

### Community 126 - "Montagem da interface"
Cohesion: 0.40
Nodes (3): Montagem da aplicação (#root e /src/main.tsx), react-dom@^19.3.0, react-dom

### Community 127 - "Contas: configuração"
Cohesion: 0.50
Nodes (4): Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 801 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Visão geral «só GitHub»` connect `Ramo indices e pesquisa` to `Depósito e pipeline`, `Proxy e níveis do Worker`, `Skills e hook do template`, `Repositório de dados (documentação)`, `Segurança e material público`?**
  _High betweenness centrality (0.085) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `DataRepo` (e.g. with `servir()` and `Settings`) actually correct?**
  _`DataRepo` has 73 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Chave de deploy com escrita para o repositório de dados` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.11912568306010929 - nodes in this community are weakly interconnected._
- **Why does `Contas no Worker do Cloudflare (D1)` connect `Proxy e níveis do Worker` to `Contas no Worker`, `Cliente da API GitHub`, `Acessos e cofre de códigos`, `Credencial GitHub do Worker`, `Ramo indices e pesquisa`, `Página de entrada`, `GitHubDataSource`, `Armazenamento e diagnóstico`, `Contas: configuração`?**
  _High betweenness centrality (0.079) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `Biblioteca e visibilidade` be split into smaller, more focused modules?**
  _Cohesion score 0.07534246575342465 - nodes in this community are weakly interconnected._