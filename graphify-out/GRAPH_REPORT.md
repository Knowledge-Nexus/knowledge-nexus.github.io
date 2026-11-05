# Graph Report - knowledge-nexus.github.io  (2026-11-05)

## Corpus Check
- 235 files · ~168,430 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3166 nodes · 9835 edges · 113 communities (95 shown, 18 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 982 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `550c1ebf`
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
- GitHubDataSource
- builder.py
- Vocabularies
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- main
- BulkReview.tsx
- Record
- classification
- source.ts
- Testes da classificação
- Reason
- dump_yaml
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
- Visibility.tsx
- Catálogo de exemplo
- Layout
- Índice e tipos da interface
- Workflow de CI
- Credencial GitHub do Worker
- DataRepo
- proxy.js
- extract_file
- read_yaml
- Layout e ajuda
- Projectos de código
- HttpError
- Regras de partilha e visibilidade (documento, tipo, cadeira, privado)
- RunReport
- Configuração do Biome
- Repositório de dados (privado)
- bundles.py
- Gestão dos acessos
- Depositar ficheiros
- test_serve.py
- domain/questions.py
- Dependências de desenvolvimento
- config.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- app-ref
- Git
- raspberry-pi/instalar.sh
- _write_entity
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
- GitRepoBlobStore
- Workflow Pages
- Estrutura do repositório de dados
- ErrorBox
- Skills do Claude Code no repositório de dados
- env
- SKILL.md
- nexus.yml
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- DataRepoError
- Configuração Vite
- screenshots.spec.ts
- migrations.py
- session.ts
- scaffold
- conftest.py
- Migração dos códigos (D1)
- Projecto Python
- run.py
- public.py
- index.html (entrada da interface)
- Contas no Worker do Cloudflare (D1)

## God Nodes (most connected - your core abstractions)
1. `DataRepo` - 133 edges
2. `useApp()` - 94 edges
3. `Pipeline` - 84 edges
4. `ErrorBox()` - 83 edges
5. `Button()` - 74 edges
6. `Document` - 73 edges
7. `Layout` - 58 edges
8. `Record` - 51 edges
9. `normalize()` - 51 edges
10. `deposit()` - 48 edges

## Surprising Connections (you probably didn't know these)
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
- `acessos.yaml (acessos temporários sem tokens)` --references--> `only_personal()`  [INFERRED]
  docs/repo-dados.md → backend/nexus/serve.py
- `Segredo NEXUS_PUBLICO_TOKEN` --references--> `publish_public_if_due()`  [INFERRED]
  docs/configuracao.md → backend/nexus/serve.py
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

## Communities (113 total, 18 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.11
Nodes (51): pasta_exemplo(), pdf_nativo(), projecto_codigo(), deposit(), docs(), _lote(), run(), _split() (+43 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.08
Nodes (47): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), FileBadge(), fileFormat(), FORMATS, EditButton(), useApp(), ClassificationFields() (+39 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.06
Nodes (37): Catalog, roman(), sequel_after(), series_number(), acceptable(), _clean(), detect(), add() (+29 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (58): Biblioteca em estantes curso e ano, Editar no sítio (lápis, method: user), Sugestões ao registar (lista de referência pt.json), SuggestInput(), Notice(), unitColor(), CatalogBundle, CourseRow (+50 more)

### Community 4 - "_repo"
Cohesion: 0.09
Nodes (36): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+28 more)

### Community 5 - "nexus/questions.py"
Cohesion: 0.13
Nodes (20): QuestionSet, _blocks(), build(), _check_numbering(), describe(), _document(), exclusion(), _folded() (+12 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.06
Nodes (17): GitHub, GitHubApiError, Repo, Api, batch_id(), candidate_files(), _move(), Pending (+9 more)

### Community 7 - "r2.py"
Cohesion: 0.07
Nodes (17): migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, QuotaExceeded, R2BlobStore, _s3_client() (+9 more)

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.07
Nodes (16): Document, Status, slugify(), _question_rows(), member_name(), filed_name(), original_stem(), unique_name() (+8 more)

### Community 9 - "GitHubDataSource"
Cohesion: 0.12
Nodes (8): manifest.json (built_from, built_at, SHA-256), readCurrent(), guestName(), GitHubDataSource, nowIso(), pad(), yamlUpdate(), IndexManifest

### Community 10 - "builder.py"
Cohesion: 0.10
Nodes (16): Topic, effective_visibility(), is_public(), type_key(), Visibility, _v1_visibility_inherits(), BuildResult, _dump() (+8 more)

### Community 11 - "Vocabularies"
Cohesion: 0.14
Nodes (5): Classification, Term, Vocabularies, inherit(), weak()

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.12
Nodes (42): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+34 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (42): IconTrash(), downloadOriginal(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove() (+34 more)

### Community 14 - "Página de entrada"
Cohesion: 0.17
Nodes (29): Página de apresentação e popups de entrada, BrandBanner(), IconGoogle(), IconShield(), IconTicket(), IconUser(), IconUserPlus(), Modal() (+21 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.11
Nodes (34): draftKey(), dropDraft(), marksKey(), readDraft(), SAVE_DELAY_MS, SaveState, scope(), useMarkEditor() (+26 more)

### Community 16 - "DataRepo"
Cohesion: 0.11
Nodes (17): blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused(), test_a_question_rewritten_by_the_ai_is_refused(), test_a_question_using_an_excluded_case_is_not_shown_either() (+9 more)

### Community 18 - "BulkReview.tsx"
Cohesion: 0.11
Nodes (37): BundleEditor(), save(), shortPath(), IconStack(), ButtonVariant, certaintyLevel(), ConfidenceBadge(), methodKind() (+29 more)

### Community 19 - "Record"
Cohesion: 0.12
Nodes (9): Assessment, Record, Removal, Enrollments, Group, GroupMember, Preferences, Sharing (+1 more)

### Community 20 - "classification"
Cohesion: 0.05
Nodes (35): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+27 more)

### Community 21 - "source.ts"
Cohesion: 0.08
Nodes (28): AccountError, AccountInvite, ACCOUNTS_URL, AccountsConfig, AccountSession, FetchLike, AppData, RepoInfo (+20 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.13
Nodes (26): _classifier(), _custom(), _doc(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred(), test_exam_statement_is_confident() (+18 more)

### Community 23 - "Reason"
Cohesion: 0.10
Nodes (29): Alternative, FieldValue, Reason, contains_phrase(), contains_unit_phrase(), User, Classifier, pick() (+21 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.07
Nodes (16): Abertura de PDFs por partes (PDFDataRangeTransport), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun, fetchPublicManifest() (+8 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.13
Nodes (26): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+18 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (39): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+31 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.08
Nodes (16): uuid7(), BlobRef, BundleRef, DocumentKind, HistoryEntry, Review, Source, sha256_file() (+8 more)

### Community 29 - "test_domain.py"
Cohesion: 0.17
Nodes (13): CatalogError, _check_slug(), import_bundle(), load_catalog(), remove_course(), test_catalog_import_is_idempotent(), test_catalog_import_rejects_bad_slug(), test_catalog_import_rejects_unknown_unit_reference() (+5 more)

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.12
Nodes (29): DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane(), useBinary(), Markdown(), pageUnitsHeight(), closeOnRemoval() (+21 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.23
Nodes (22): applyInvite(), cleanEmail(), cleanPassword(), clientIp(), createSession(), decodeIdToken(), findInvite(), googleReady() (+14 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.09
Nodes (17): AccountsApi, submit(), submit(), accessesKey(), AccessManager(), change(), remember(), registerAccess() (+9 more)

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.10
Nodes (18): AccountUser, encodePath(), FetchLike, GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree() (+10 more)

### Community 35 - "Visibility.tsx"
Cohesion: 0.21
Nodes (17): IconArrowRight(), IconGlobe(), IconLock(), Choice, ConfirmPublic(), DocChoice, DocumentVisibility(), choose() (+9 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 38 - "Índice e tipos da interface"
Cohesion: 0.05
Nodes (50): Procedimento para mudar o esquema do índice, ACTIVE, AppContext, useSearchIndex(), dir, hasIndex, vectors, Bind (+42 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "DataRepo"
Cohesion: 0.09
Nodes (22): DataRepo, read_yaml(), CatalogProposal, export_tree(), ExportReport, build_indices(), near_duplicate_pairs(), _required_confidence() (+14 more)

### Community 42 - "proxy.js"
Cohesion: 0.16
Nodes (26): canRead(), canWrite(), effectiveRole(), requireAdmin(), requireUser(), sessionUser(), adminLogin(), dataRepo() (+18 more)

### Community 43 - "extract_file"
Cohesion: 0.11
Nodes (21): docx_com_equacao(), _font(), imagem_texto(), notebook(), pdf_bytes(), pdf_digitalizado(), pptx_slides(), xlsx_notas() (+13 more)

### Community 44 - "read_yaml"
Cohesion: 0.13
Nodes (20): write_yaml_if_changed(), parse_visibility(), set_document_visibility(), set_type_visibility(), set_unit_visibility(), SharingError, GitHub Actions como worker (concurrency), _configure() (+12 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.20
Nodes (20): Identidade visual (pergaminho, azul-marinho e dourado), BRAND, Brand(), BrandIcon(), DefaultMark(), IconBooks(), IconCheckList(), IconHelp() (+12 more)

### Community 46 - "Projectos de código"
Cohesion: 0.09
Nodes (26): CodeProjectSettings, Manifest, ManifestFile, ManifestIgnored, choose_lead(), key(), build_bundle(), _code_ratio() (+18 more)

### Community 47 - "HttpError"
Cohesion: 0.23
Nodes (17): admin(), cleanName(), cleanRole(), cleanUntil(), createUser(), managerLimits(), newId(), encoder (+9 more)

### Community 48 - "Regras de partilha e visibilidade (documento, tipo, cadeira, privado)"
Cohesion: 0.09
Nodes (10): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), SearchBackend, Fase 5: abertura a outros utilizadores, Esquema relacional de partida para a fase 5 (+2 more)

### Community 49 - "RunReport"
Cohesion: 0.33
Nodes (4): RunReport, commit_message(), ProcessResult, fake_process()

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (privado)"
Cohesion: 0.05
Nodes (35): Depósito (envio sem organizar), Detecção de cópias ao depositar (ownedSha), Envio em partes de ficheiros grandes (> 10 MB), Knowledge Nexus (plataforma de estudo), Lotes zip para muitos ficheiros (>= 20), Repositório da aplicação (público, GitHub Pages), CSP estrita e noindex, Etapa 2: recepção (deduplicar, desempacotar, extrair) (+27 more)

### Community 52 - "bundles.py"
Cohesion: 0.13
Nodes (11): bundle_id(), folder_name(), folder_of(), FolderGroup, project_folders(), _qualifies(), group_folder(), Layout (+3 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.09
Nodes (39): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), GuestInfo, AccessRow(), addDays(), rename() (+31 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.14
Nodes (22): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+14 more)

### Community 55 - "test_serve.py"
Cohesion: 0.08
Nodes (21): app_checkout(), PublicState, serve(), _git(), _QuietGit, test_app_update_is_seen_only_when_pull_is_safe(), test_busy_remote_is_not_an_error(), busy() (+13 more)

### Community 56 - "domain/questions.py"
Cohesion: 0.15
Nodes (6): Generated, SourceRef, Question, QuestionContext, QuestionReview, Proveniência (SourceRef e Generated)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "config.py"
Cohesion: 0.20
Nodes (13): DedupSettings, deep_merge(), _defaults(), LimitSettings, load_settings(), PublishingSettings, _Section, Settings (+5 more)

### Community 59 - "Utilitários e cofre de códigos"
Cohesion: 0.30
Nodes (13): dummyHash(), base64url(), checkPassword(), encoder, fromBase64url(), hashPassword(), hex(), hmacKey() (+5 more)

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
Cohesion: 0.10
Nodes (13): Git, indices_up_to_date(), process_and_publish(), publish_index_branch(), _remote_indices_source(), app_has_update(), only_personal(), public_key() (+5 more)

### Community 64 - "raspberry-pi/instalar.sh"
Cohesion: 0.06
Nodes (42): Serviço knowledge-nexus no Raspberry Pi, archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio (+34 more)

### Community 65 - "_write_entity"
Cohesion: 0.38
Nodes (4): _given(), ImportReport, _merge(), _write_entity()

### Community 66 - "Cursos e ligações"
Cohesion: 0.14
Nodes (9): Course, CurricularUnit, unit_key(), UnitEdition, Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira (+1 more)

### Community 67 - "test_index_publish.py"
Cohesion: 0.14
Nodes (17): build_match(), create_search_db(), PageRow, SearchFilters, SearchHit, Pesquisa FTS5 (texto original e normalizado), pesquisa.db.gz (FTS5 pages_fts), git() (+9 more)

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
Cohesion: 0.22
Nodes (14): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), newStrokeId(), rotatedBox() (+6 more)

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
Cohesion: 0.11
Nodes (33): ExtractionSettings, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), MissingToolError, PageText, require() (+25 more)

### Community 76 - "normalize"
Cohesion: 0.10
Nodes (21): ClassificationSettings, ExtractionMeta, fix_spacing_accents(), normalize(), _numbers_after(), strip_accents(), _unify_spelling(), material_folder() (+13 more)

### Community 78 - "index.js"
Cohesion: 0.25
Nodes (14): handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle(), handleBlob(), keyFor() (+6 more)

### Community 79 - "catalog_io.py"
Cohesion: 0.17
Nodes (13): export_bundle(), remove_unit(), write_unit(), model_to_data(), CatalogBundle, CourseUnitLink, Institution, InstitutionBundle (+5 more)

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 83 - "ErrorBox"
Cohesion: 0.09
Nodes (57): Home(), PublicShell(), queryClient, Shell(), TextPane(), IconDownload(), Badge(), Button() (+49 more)

### Community 85 - "env"
Cohesion: 0.07
Nodes (28): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+20 more)

### Community 88 - "nexus.yml"
Cohesion: 0.06
Nodes (32): concurrency, cancel-in-progress, group, reclassificar, jobs, pipeline, name, on (+24 more)

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
Cohesion: 0.12
Nodes (10): current_version(), migrate(), _set_format_version(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed(), Procedimento para mudar FORMAT_VERSION do repositório de dados (+2 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 106 - "session.ts"
Cohesion: 0.24
Nodes (9): App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), clearSession(), hasFlash(), loadSession(), read() (+1 more)

### Community 107 - "scaffold"
Cohesion: 0.24
Nodes (9): Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Flashcard (estado FSRS), Pergunta (banco de perguntas), Simulado, Tentativa (o modo tutor conta as dicas), Utilizador (+1 more)

### Community 109 - "conftest.py"
Cohesion: 0.14
Nodes (13): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), catalog_root(), data_root(), fixed_clock() (+5 more)

### Community 121 - "run.py"
Cohesion: 0.07
Nodes (16): fixed(), now(), config_dir(), _Dumper, _str_representer(), write_json_if_changed(), write_text_if_changed(), PageMeta (+8 more)

### Community 122 - "public.py"
Cohesion: 0.10
Nodes (14): GitError, RemoteBusy, _auth_env(), build_public_site(), _check_target(), _digest(), github_slug(), PublicResult (+6 more)

### Community 126 - "index.html (entrada da interface)"
Cohesion: 0.25
Nodes (6): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Montagem da aplicação (#root e /src/main.tsx), CSP restrita da página de privacidade (default-src none)

### Community 127 - "Contas no Worker do Cloudflare (D1)"
Cohesion: 0.33
Nodes (7): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Originais no Cloudflare R2 (opcional), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite)

## Knowledge Gaps
- **12 isolated node(s):** `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)`, `Chave de deploy com escrita para o repositório de dados`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 838 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Contas no Worker do Cloudflare (D1)` connect `Contas no Worker do Cloudflare (D1)` to `Contas no Worker`, `Cliente da API GitHub`, `Credencial GitHub do Worker`, `proxy.js`, `Repositório de dados (privado)`, `source.ts`, `Gestão dos acessos`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **Are the 69 inferred relationships involving `DataRepo` (e.g. with `Settings` and `Layout`) actually correct?**
  _`DataRepo` has 69 INFERRED edges - model-reasoned connections that need verification._
- **What connects `UV_PROJECT_ENVIRONMENT`, `nexus`, `Correcção do DNS do WSL («Could not resolve host»)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.10675990675990676 - nodes in this community are weakly interconnected._
- **Why does `Visão geral «só GitHub»` connect `Repositório de dados (privado)` to `_repo`, `builder.py`, `read_yaml`, `Skills do Claude Code no repositório de dados`, `Contas no Worker do Cloudflare (D1)`?**
  _High betweenness centrality (0.074) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07540983606557378 - nodes in this community are weakly interconnected._