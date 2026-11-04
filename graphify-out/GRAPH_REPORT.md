# Graph Report - knowledge-nexus.github.io  (2026-11-04)

## Corpus Check
- 231 files · ~158,228 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3046 nodes · 9448 edges · 117 communities (104 shown, 13 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 972 edges (avg confidence: 0.89)
- Token cost: 351,276 input · 0 output

## Community Hubs (Navigation)
- Testes do pipeline
- Biblioteca e visibilidade
- Propostas de catálogo e texto
- Estantes, cursos e configuração
- CLI nexus
- Códigos de acesso temporário
- nexus vigiar e API GitHub
- Originais no R2
- Reconciliação do pipeline
- Tipos da interface e revisão
- Índices e material público
- Pontuação da classificação
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Marcas de leitura
- Layout e formatos
- Classificador e razões
- Rotas e página inicial
- Registos do domínio
- Regras de classificação
- GitHubDataSource
- Testes da classificação
- Catálogo (leitura e pedidos)
- Partilha e visibilidade pública
- Fontes de dados e cache
- Abrir arquivos (unpack)
- Vocabulários
- Recepção do depósito
- Pesquisa e publicação
- Visor de documentos e PDF
- Dependências da interface
- Contas no Worker
- API das contas (interface)
- Cliente da API GitHub
- Extractores PDF e Office
- Catálogo de exemplo
- Extracção de texto
- Consultas ao índice
- Workflow de CI
- Credencial GitHub do Worker
- Repositório de dados e revisão
- Proxy e níveis do Worker
- Lotes zip e hashing
- YAML determinístico e scaffold
- Layout e ajuda
- Projectos de código
- Predefinições de extracção
- Esquema SQL e Alembic
- Processar e publicar
- Configuração do Biome
- Repositório de dados (documentação)
- Conjuntos e organização
- Gestão de contas
- Depositar ficheiros
- Testes do servir
- Processamento local (servir)
- Dependências de desenvolvimento
- OCR e diagnóstico
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
- Leitor e marcas
- Privacidade e CSP
- Camada de marcas
- Skill processar depósito
- Fixtures dos testes
- GitHub simulado
- Ramo indices e pesquisa
- Contrato do esquema
- Testes E2E
- Capturas e D1 simulada
- SQLite no browser
- Blobs no git
- Workflow Pages (deploy)
- Workflow nexus (gatilhos)
- Segurança e material público
- Repositório público e guarda
- Pipeline reutilizável (entradas)
- Pipeline reutilizável (ambiente)
- Pipeline reutilizável (passos)
- Workflow nexus (permissões)
- Scripts da interface
- Workflow Pages (permissões)
- Migração das contas (D1)
- Relatório de execução
- nexus.yaml do template
- vigiar-deposito
- Configuração Vite
- Pesquisa no browser
- Pipeline reutilizável (checkout)
- Estrutura do repositório de dados
- Workflow nexus (chamada)
- Remoto ocupado (testes)
- Depósito sem organizar
- Limites e fase 5
- Permissões do pipeline
- Workflow Pages (cache)
- Workflow Pages (gatilhos)
- Identificadores UUIDv7
- Skills e hook do template
- Workflow Pages (ambiente)
- Testes do git
- Migração dos códigos (D1)
- Projecto Python

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 109 edges
2. `useApp()` - 88 edges
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
- `Fase 1 (concluída)` --references--> `vigiar()`  [EXTRACTED]
  CLAUDE.md → backend/nexus/cli.py
- `Repositório de dados (privado)` --references--> `Layout`  [INFERRED]
  docs/repo-dados.md → backend/nexus/datarepo/layout.py
- `Unidade curricular (cadeira)` --references--> `CurricularUnit`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/catalog.py

## Import Cycles
- 2-file cycle: `frontend/src/features/library/LibraryPage.tsx -> frontend/src/features/library/Shelves.tsx -> frontend/src/features/library/LibraryPage.tsx`

## Hyperedges (group relationships)
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (117 total, 13 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.06
Nodes (72): docx_com_equacao(), _font(), imagem_texto(), notebook(), pasta_exemplo(), pdf_bytes(), pdf_digitalizado(), pdf_nativo() (+64 more)

### Community 1 - "Biblioteca e visibilidade"
Cohesion: 0.07
Nodes (67): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS (+59 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.05
Nodes (43): Catalog, contains_phrase(), contains_unit_phrase(), fix_spacing_accents(), normalize(), _numbers_after(), roman(), sequel_after() (+35 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (58): Biblioteca em estantes curso e ano, Sugestões ao registar (lista de referência pt.json), SuggestInput(), Button(), unitColor(), CatalogBundle, CourseRow, CourseCreator() (+50 more)

### Community 4 - "CLI nexus"
Cohesion: 0.09
Nodes (32): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+24 more)

### Community 5 - "Códigos de acesso temporário"
Cohesion: 0.08
Nodes (53): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), accessesKey(), AccessManager(), change(), AccessRow() (+45 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (18): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+10 more)

### Community 7 - "Originais no R2"
Cohesion: 0.06
Nodes (22): BlobStore, migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, missing_credentials(), QuotaExceeded (+14 more)

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.07
Nodes (13): Document, HistoryEntry, Review, Status, choose_lead(), key(), inherit(), member_name() (+5 more)

### Community 9 - "Tipos da interface e revisão"
Cohesion: 0.08
Nodes (51): Editar no sítio (lápis, method: user), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind(), ReasonList(), ReasonText(), SPINES (+43 more)

### Community 10 - "Índices e material público"
Cohesion: 0.07
Nodes (25): fixed(), now(), Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics() (+17 more)

### Community 11 - "Pontuação da classificação"
Cohesion: 0.09
Nodes (25): ClassificationSettings, Alternative, ExtractionMeta, PageMeta, strip_accents(), material_folder(), check(), _producer() (+17 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.11
Nodes (45): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+37 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.09
Nodes (44): IconTrash(), ProposalRow, downloadOriginal(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog() (+36 more)

### Community 14 - "Página de entrada"
Cohesion: 0.11
Nodes (41): Página de apresentação e popups de entrada, BrandBanner(), IconGoogle(), IconShield(), IconTicket(), IconUser(), IconUserPlus(), Modal() (+33 more)

### Community 15 - "Marcas de leitura"
Cohesion: 0.09
Nodes (36): draftKey(), dropDraft(), LoadedMarks, marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope() (+28 more)

### Community 16 - "Layout e formatos"
Cohesion: 0.09
Nodes (12): Layout, read_yaml(), current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v3_bundles(), _v4_bundle_lead_choice() (+4 more)

### Community 17 - "Classificador e razões"
Cohesion: 0.10
Nodes (16): Classification, FieldValue, Reason, Classifier, pick(), weak(), Outcome, keyword_points() (+8 more)

### Community 18 - "Rotas e página inicial"
Cohesion: 0.13
Nodes (34): Montagem da aplicação (#root e /src/main.tsx), App(), Home(), PublicShell(), queryClient, Shell(), signOutAccount(), WelcomeOrHome() (+26 more)

### Community 19 - "Registos do domínio"
Cohesion: 0.08
Nodes (16): Assessment, UnitEdition, Record, Removal, Evidence, Generated, SourceRef, Enrollments (+8 more)

### Community 20 - "Regras de classificação"
Cohesion: 0.05
Nodes (34): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+26 more)

### Community 21 - "GitHubDataSource"
Cohesion: 0.08
Nodes (26): AccountSession, RepoInfo, RepoRef, GuestInfo, APP_REPOSITORY, buildLotes(), GitHubDataSource, INDICES_BRANCH (+18 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (30): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+22 more)

### Community 23 - "Catálogo (leitura e pedidos)"
Cohesion: 0.11
Nodes (27): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, load_catalog(), _merge() (+19 more)

### Community 24 - "Partilha e visibilidade pública"
Cohesion: 0.11
Nodes (25): User, effective_visibility(), is_public(), type_key(), Visibility, parse_visibility(), set_document_visibility(), set_type_visibility() (+17 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (16): manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), AppData, WorkflowRun (+8 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.14
Nodes (25): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+17 more)

### Community 27 - "Vocabulários"
Cohesion: 0.06
Nodes (39): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+31 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.13
Nodes (13): BlobRef, DocumentKind, Source, _batch_items(), DepositItem, _files_under(), Scan, scan_deposit() (+5 more)

### Community 29 - "Pesquisa e publicação"
Cohesion: 0.11
Nodes (20): build_match(), create_search_db(), PageRow, SearchFilters, SearchHit, SqliteFtsSearch, git(), _prepare() (+12 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.12
Nodes (31): DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), TextPane(), useBinary(), pageUnitsHeight(), closeOnRemoval() (+23 more)

### Community 31 - "Dependências da interface"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.17
Nodes (34): admin(), applyInvite(), cleanEmail(), cleanName(), cleanPassword(), cleanRole(), cleanUntil(), clientIp() (+26 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.09
Nodes (9): AccountError, AccountInvite, ACCOUNTS_URL, AccountsApi, AccountsConfig, FetchLike, SignedIn, STORAGE_URL (+1 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (11): encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), Change, commitChanges() (+3 more)

### Community 35 - "Extractores PDF e Office"
Cohesion: 0.16
Nodes (19): ExtractionSettings, clean_text(), ExtractionError, looks_mathematical(), require(), which(), extract_docx(), extract_legacy() (+11 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 37 - "Extracção de texto"
Cohesion: 0.15
Nodes (15): Manifest, ExtractionResult, PageText, archive_listing(), code_project_text(), expected_extractor(), extract_file(), write_extraction() (+7 more)

### Community 38 - "Consultas ao índice"
Cohesion: 0.14
Nodes (4): MetaIndex, parse(), toDocument(), UserRow

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "Repositório de dados e revisão"
Cohesion: 0.14
Nodes (13): DataRepo, DataRepoError, CatalogProposal, export_tree(), accept_unit_proposal(), describe(), _get(), propose() (+5 more)

### Community 42 - "Proxy e níveis do Worker"
Cohesion: 0.13
Nodes (29): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite), canRead(), canWrite() (+21 more)

### Community 43 - "Lotes zip e hashing"
Cohesion: 0.11
Nodes (10): ExportReport, alembic_config(), sha256_file(), simhash(), _assemble(), expand_lotes(), _extract(), LoteError (+2 more)

### Community 44 - "YAML determinístico e scaffold"
Cohesion: 0.12
Nodes (12): config_dir(), dump_yaml(), _Dumper, model_to_data(), _str_representer(), write_json_if_changed(), write_text_if_changed(), write_yaml_if_changed() (+4 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.14
Nodes (26): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+18 more)

### Community 46 - "Projectos de código"
Cohesion: 0.13
Nodes (15): CodeProjectSettings, ManifestFile, ManifestIgnored, build_bundle(), _code_ratio(), _dirs_of(), files_in(), find_projects() (+7 more)

### Community 47 - "Predefinições de extracção"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 48 - "Esquema SQL e Alembic"
Cohesion: 0.12
Nodes (6): upgrade(), upgrade(), upgrade(), upgrade(), SearchBackend, Esquema relacional de partida para a fase 5

### Community 49 - "Processar e publicar"
Cohesion: 0.14
Nodes (9): GitError, RemoteBusy, commit_message(), indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source(), test_busy_remote_is_not_an_error() (+1 more)

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (documentação)"
Cohesion: 0.10
Nodes (18): _v2_duplicate_of(), Detecção de cópias ao depositar (ownedSha), Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Etapa 2: recepção (deduplicar, desempacotar, extrair), Guarda de originais no workflow do repositório de dados, Cópias e duplicados (duplicate_of, near_duplicates_dismissed) (+10 more)

### Community 52 - "Conjuntos e organização"
Cohesion: 0.13
Nodes (13): BundleRef, bundle_id(), folder_name(), folder_of(), FolderGroup, project_folders(), _qualifies(), full_path() (+5 more)

### Community 53 - "Gestão de contas"
Cohesion: 0.20
Nodes (16): ErrorBox(), siteLink(), AccountCard(), AccountsManager(), accountState(), CopyField(), dateOnly(), endOfDay() (+8 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "Testes do servir"
Cohesion: 0.15
Nodes (12): PublicResult, _git(), test_app_update_is_seen_only_when_pull_is_safe(), test_public_material_is_published_when_it_may_have_changed(), failing(), fake_publish(), test_quiet_remote_is_checked_without_fetching(), test_reading_marks_alone_are_not_processed() (+4 more)

### Community 56 - "Processamento local (servir)"
Cohesion: 0.16
Nodes (11): app_checkout(), app_has_update(), only_personal(), public_key(), PublicState, publish_public_if_due(), remote_has_news(), serve() (+3 more)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "OCR e diagnóstico"
Cohesion: 0.17
Nodes (10): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), MissingToolError, _has_osd(), ocr_image() (+2 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.23
Nodes (18): encoder, ensureTable(), handleCodes(), key(), repoOf(), seal(), unseal(), base64url() (+10 more)

### Community 60 - "README e regras dos dados"
Cohesion: 0.14
Nodes (9): Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo), Marcadores __OWNER__ e __APP_REPOSITORY__, README do repositório de dados (template), Canais de envio: interface, nexus vigiar ou deposito/__OWNER__/, Grafo do projecto (graphify), Acções no material ficam no histórico do repositório do dono (nome e email), Knowledge Nexus README, Interface em knowledge-nexus.github.io (só código) (+1 more)

### Community 61 - "Configuração TypeScript"
Cohesion: 0.11
Nodes (17): compilerOptions, isolatedModules, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+9 more)

### Community 62 - "Definições do motor"
Cohesion: 0.20
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 64 - "Raspberry Pi"
Cohesion: 0.25
Nodes (15): Serviço knowledge-nexus no Raspberry Pi, Chave de deploy com escrita para o repositório de dados, Segredo NEXUS_PUBLICO_TOKEN, Processar num Raspberry Pi (guia de instalação), as_nexus(), ask(), info(), install_all() (+7 more)

### Community 65 - "Entrada do Worker e blobs"
Cohesion: 0.22
Nodes (16): handleAccounts(), SESSION_PREFIX, sessionUser(), withCors(), allowed(), authCache, handle(), handleBlob() (+8 more)

### Community 66 - "Cursos e ligações"
Cohesion: 0.17
Nodes (7): Course, CourseUnitLink, unit_key(), Cursos com cadeiras de outras instituições, Curso, Instituição, Unidade curricular (cadeira)

### Community 67 - "Vocabulário e arrumação"
Cohesion: 0.19
Nodes (8): slugify(), Term, Vocabularies, filed_name(), original_stem(), unique_name(), test_unique_name(), test_slugify()

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Leitor e marcas"
Cohesion: 0.16
Nodes (15): Modo de leitura (Reader), Marcas de leitura, MarkColor, PAGE_UNITS, StrokeSize, DEFAULT_PREFS, Fit, lastPage() (+7 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "Camada de marcas"
Cohesion: 0.20
Nodes (15): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+7 more)

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "Fixtures dos testes"
Cohesion: 0.22
Nodes (7): catalog_root(), data_root(), fixed_clock(), git_root(), has(), isolated_cache(), repo()

### Community 74 - "GitHub simulado"
Cohesion: 0.23
Nodes (6): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json()

### Community 75 - "Ramo indices e pesquisa"
Cohesion: 0.19
Nodes (7): GitHub Actions como worker (concurrency), Pesquisa FTS5 (texto original e normalizado), Publicação incremental (commit por item, índices a cada dez), Ramo indices (órfão, um só commit), SQLite WASM em memória no browser (cache IndexedDB), meta.db (índice de metadados), pesquisa.db.gz (FTS5 pages_fts)

### Community 76 - "Contrato do esquema"
Cohesion: 0.21
Nodes (11): Procedimento para mudar o esquema do índice, dir, hasIndex, vectors, DocumentFilter, JSON_DOC_COLUMNS, MIN_SCHEMA_VERSION, SUPPORTED_SCHEMA_VERSION (+3 more)

### Community 77 - "Testes E2E"
Cohesion: 0.23
Nodes (10): CORS, decode(), routeGitHub(), routeWorker(), snapshot, withFakeGitHub(), workerEnv(), workerEnvs (+2 more)

### Community 78 - "Capturas e D1 simulada"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 79 - "SQLite no browser"
Cohesion: 0.18
Nodes (5): Bind, OoDb, ReadonlyDb, sqlite(), Sqlite3

### Community 81 - "Workflow Pages (deploy)"
Cohesion: 0.20
Nodes (11): runs-on, steps, needs, runs-on, steps, jobs, build, deploy (+3 more)

### Community 82 - "Workflow nexus (gatilhos)"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

### Community 83 - "Segurança e material público"
Cohesion: 0.22
Nodes (6): CSP estrita e noindex, Material público num repositório público à parte, Segurança e privacidade, Token fine-grained guardado no browser, Criar o repositório de dados privado, Permissões do token fine-grained (Contents, Actions, Workflows, Metadata)

### Community 84 - "Repositório público e guarda"
Cohesion: 0.20
Nodes (4): Repositório da aplicação (público, GitHub Pages), Publicar a interface (Pages com GitHub Actions), Uso local para desenvolvimento (WSL2), guarda-binarios.sh script

### Community 85 - "Pipeline reutilizável (entradas)"
Cohesion: 0.20
Nodes (10): default, description, type, app-ref, reclassify, on, workflow_call, default (+2 more)

### Community 86 - "Pipeline reutilizável (ambiente)"
Cohesion: 0.20
Nodes (10): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+2 more)

### Community 87 - "Pipeline reutilizável (passos)"
Cohesion: 0.20
Nodes (10): jobs, processar, runs-on, steps, timeout-minutes, id, if, name (+2 more)

### Community 88 - "Workflow nexus (permissões)"
Cohesion: 0.22
Nodes (8): concurrency, cancel-in-progress, group, jobs, name, permissions, actions, contents

### Community 89 - "Scripts da interface"
Cohesion: 0.22
Nodes (9): scripts, build, dev, e2e, format, lint, preview, test (+1 more)

### Community 90 - "Workflow Pages (permissões)"
Cohesion: 0.22
Nodes (8): concurrency, cancel-in-progress, group, name, permissions, contents, id-token, pages

### Community 91 - "Migração das contas (D1)"
Cohesion: 0.33
Nodes (8): attempts, attempts_key, invites, marks, sessions, sessions_user, tickets, users

### Community 92 - "Relatório de execução"
Cohesion: 0.36
Nodes (4): RunReport, ProcessResult, test_serve_migrates_and_processes_in_batches(), fake_process()

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "vigiar-deposito"
Cohesion: 0.29
Nodes (7): Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script, UV_PROJECT_ENVIRONMENT

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 96 - "Pesquisa no browser"
Cohesion: 0.36
Nodes (6): buildMatch(), HIGHLIGHT_END, HIGHLIGHT_START, SearchIndex, SearchFilters, SearchHit

### Community 97 - "Pipeline reutilizável (checkout)"
Cohesion: 0.25
Nodes (8): with, fetch-depth, filter, key, path, restore-keys, sparse-checkout, sparse-checkout-cone-mode

### Community 98 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 99 - "Workflow nexus (chamada)"
Cohesion: 0.29
Nodes (7): pipeline, if, secrets, uses, with, app-ref, reclassify

### Community 101 - "Depósito sem organizar"
Cohesion: 0.40
Nodes (6): Depósito (envio sem organizar), Knowledge Nexus (plataforma de estudo), Fluxo de depósito (browser para deposito/<login>/<lote>), Formas de depositar (interface, GitHub, pasta vigiada), deposito/<login>/<lote>/ (entrada e _erros), Referência *.ref.yaml (conteúdo já existente)

### Community 102 - "Limites e fase 5"
Cohesion: 0.47
Nodes (5): Fase 5: abertura a outros utilizadores, Envio em partes de ficheiros grandes (> 10 MB), Lotes zip para muitos ficheiros (>= 20), Limites conhecidos (tamanho, tempo, privacidade, índice), Questões por decidir

### Community 103 - "Permissões do pipeline"
Cohesion: 0.33
Nodes (5): .github/workflows/nexus.yml do repositório de dados, name, permissions, actions, contents

### Community 104 - "Workflow Pages (cache)"
Cohesion: 0.33
Nodes (6): with, cache, cache-dependency-path, node-version, path, version

### Community 105 - "Workflow Pages (gatilhos)"
Cohesion: 0.40
Nodes (5): on, push, workflow_dispatch, branches, paths

### Community 108 - "Workflow Pages (ambiente)"
Cohesion: 0.67
Nodes (3): environment, name, url

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Grafo do projecto (graphify)`, `Correcção do DNS do WSL («Could not resolve host»)`, `Chave de deploy com escrita para o repositório de dados` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 801 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Contas no Worker do Cloudflare (D1)` connect `Proxy e níveis do Worker` to `Contas no Worker`, `API das contas (interface)`, `Cliente da API GitHub`, `Códigos de acesso temporário`, `Originais no R2`, `Credencial GitHub do Worker`, `Ramo indices e pesquisa`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Are the 73 inferred relationships involving `DataRepo` (e.g. with `servir()` and `Settings`) actually correct?**
  _`DataRepo` has 73 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Grafo do projecto (graphify)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.06158415841584158 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Propostas de catálogo e texto` to `Estantes, cursos e configuração`, `Extracção de texto`, `Reconciliação do pipeline`, `Pontuação da classificação`, `Lotes zip e hashing`, `Classificador e razões`, `Regras de classificação`, `Testes da classificação`, `Catálogo (leitura e pedidos)`, `Pesquisa e publicação`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `Biblioteca e visibilidade` be split into smaller, more focused modules?**
  _Cohesion score 0.06511761331038439 - nodes in this community are weakly interconnected._