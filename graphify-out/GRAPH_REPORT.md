# Graph Report - knowledge-nexus.github.io  (2026-11-15)

## Corpus Check
- 236 files · ~169,146 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 12 file(s) not represented in the graph (top: (none) 6, .example 1, .mako 1)

## Summary
- 3174 nodes · 9849 edges · 109 communities (96 shown, 13 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 986 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b68f5df9`
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
- Reconciliação do pipeline
- ErrorBox
- ocr.py
- raspberry-pi/instalar.sh
- Modo de leitura e ícones
- Remover e «A rever»
- Página de entrada
- Gravar marcas de leitura
- DataRepo
- scaffold/__init__.py
- types.ts
- write_extraction
- classification
- source.ts
- Testes da classificação
- Reason
- BundleEditor.tsx
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
- pipeline.yml
- Catálogo de exemplo
- Layout
- Índice e tipos da interface
- Workflow de CI
- Credencial GitHub do Worker
- gerar_repo.py
- proxy.js
- extract_file
- read_yaml
- Layout e ajuda
- Projectos de código
- HttpError
- Regras de partilha e visibilidade (documento, tipo, cadeira, privado)
- nexus.yml
- Configuração do Biome
- Repositório de dados (privado)
- bundles.py
- Gestão dos acessos
- Depositar ficheiros
- test_serve.py
- remove_unit
- Dependências de desenvolvimento
- config.py
- Utilitários e cofre de códigos
- README e regras dos dados
- Configuração TypeScript
- app-ref
- Git
- raspberry-pi/instalar.sh
- vigiar-deposito.sh
- Cursos e ligações
- builder.py
- Skills de revisão e catálogo
- Modo de leitura
- Privacidade e CSP
- with
- Skill processar depósito
- shutil
- FakeGitHub
- extract/__init__.py
- normalize
- _Corpus
- index.js
- catalog_io.py
- pipeline
- Workflow Pages
- Estrutura do repositório de dados
- useApp
- Skills do Claude Code no repositório de dados
- env
- SKILL.md
- reclassificar
- Scripts da interface
- app.spec.ts
- Migração das contas (D1)
- Migração de formatos
- nexus.yaml do template
- steps
- Configuração Vite
- screenshots.spec.ts
- scaffold
- conftest.py
- Migração dos códigos (D1)
- Projecto Python
- store.py
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
- `A IA é discreta (certeza em palavras, sugestão automática)` --references--> `ConfidenceBadge()`  [INFERRED]
  CLAUDE.md → frontend/src/components/ui.tsx
- `Versão do extractor (provoca nova extracção)` --references--> `expected_extractor()`  [INFERRED]
  CLAUDE.md → backend/nexus/pipeline/extract/__init__.py
- `Vocabulários` --references--> `Vocabularies`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/vocab.py
- `Regras de partilha e visibilidade (documento, tipo, cadeira, privado)` --references--> `Sharing`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/users.py
- `Blob` --references--> `BlobRef`  [INFERRED]
  docs/modelo-dados.md → backend/nexus/domain/documents.py

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Ciclo de revisão de classificações pela IA** — backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_listar, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_documento_texto, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_proposal_json, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill_nexus_revisao_propor, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill_nexus_processar [EXTRACTED 1.00]
- **Pontos de troca preparados para a fase 5** — claude_pontos_de_troca, frontend_src_data_source_datasource, backend_nexus_storage_blobstore_blobstore, backend_nexus_index_search_searchbackend, backend_nexus_index_alembic_versions_0001_esquema_base_fase_1 [EXTRACTED 1.00]
- **Regras que nunca se quebram** — claude_regra_01_sem_material_real, claude_regra_02_repositorio_dados_privado, claude_regra_03_originais_imutaveis, claude_regra_04_pipeline_idempotente, claude_regra_05_deduplicacao_sha256, claude_regra_06_nunca_arrumar_a_sorte, claude_regra_07_nao_sobrepor_campos, claude_regra_08_ia_marcada, claude_regra_09_cursos_sao_dados, claude_regra_10_modo_tutor [EXTRACTED 1.00]
- **Skills do Claude Code no repositório de dados** — backend_nexus_scaffold_template_claude, backend_nexus_scaffold_template__claude_skills_processar_deposito_skill, backend_nexus_scaffold_template__claude_skills_rever_classificacoes_skill, backend_nexus_scaffold_template__claude_skills_inferir_catalogo_skill [EXTRACTED 1.00]
- **Etapas do pipeline nexus processar** — docs_arquitectura_pipeline_processar, docs_arquitectura_etapa_pedidos_catalogo, docs_arquitectura_etapa_recepcao, docs_arquitectura_etapa_reconciliacao, docs_arquitectura_publicacao [EXTRACTED 1.00]
- **Dados pessoais guardados na Cloudflare D1** — frontend_public_privacidade_account_data, frontend_public_privacidade_session_identifier, frontend_public_privacidade_reading_marks, frontend_public_privacidade_cloudflare_d1_storage [EXTRACTED 1.00]

## Communities (109 total, 13 thin omitted)

### Community 0 - "Testes do pipeline"
Cohesion: 0.11
Nodes (51): pasta_exemplo(), pdf_nativo(), projecto_codigo(), deposit(), docs(), _lote(), run(), _split() (+43 more)

### Community 1 - "LibraryPage.tsx"
Cohesion: 0.08
Nodes (46): Página da cadeira (UnitDetail), Nome dado pelo dono (classification.title), IconGlobe(), IconLock(), Badge(), Choice, ConfirmPublic(), DocChoice (+38 more)

### Community 2 - "Propostas de catálogo e texto"
Cohesion: 0.06
Nodes (39): Catalog, contains_unit_phrase(), _numbers_after(), roman(), sequel_after(), series_number(), acceptable(), _clean() (+31 more)

### Community 3 - "Estantes, cursos e configuração"
Cohesion: 0.08
Nodes (56): Biblioteca em estantes curso e ano, Sugestões ao registar (lista de referência pt.json), SuggestInput(), Notice(), unitColor(), CatalogBundle, CourseRow, CourseCreator() (+48 more)

### Community 4 - "_repo"
Cohesion: 0.08
Nodes (37): catalogo_aceitar(), catalogo_exportar(), catalogo_importar(), catalogo_propostas(), catalogo_rejeitar(), documento_mostrar(), documento_texto(), exportar_arvore() (+29 more)

### Community 5 - "Record"
Cohesion: 0.05
Nodes (39): fixed(), now(), Assessment, UnitEdition, Record, ManifestFile, ManifestIgnored, Generated (+31 more)

### Community 6 - "nexus vigiar e API GitHub"
Cohesion: 0.05
Nodes (23): deep_merge(), _defaults(), load_settings(), GitHub, GitHubApiError, Repo, Api, batch_id() (+15 more)

### Community 7 - "r2.py"
Cohesion: 0.07
Nodes (17): migrate_originals(), MigrationReport, _originals(), _sha256(), HybridBlobStore, QuotaExceeded, R2BlobStore, _s3_client() (+9 more)

### Community 8 - "Reconciliação do pipeline"
Cohesion: 0.05
Nodes (24): Document, HistoryEntry, CatalogProposal, Evidence, slugify(), member_name(), filed_name(), original_stem() (+16 more)

### Community 9 - "ErrorBox"
Cohesion: 0.18
Nodes (25): Button(), Card(), ErrorBox(), siteLink(), WaitingPanel(), UnitEditor(), remove(), save() (+17 more)

### Community 10 - "ocr.py"
Cohesion: 0.23
Nodes (7): MissingToolError, require(), which(), _has_osd(), ocr_image(), OcrResult, _parse_tsv()

### Community 11 - "raspberry-pi/instalar.sh"
Cohesion: 0.37
Nodes (11): as_nexus(), ask(), info(), install_all(), say(), set_env(), instalar.sh script, uninstall() (+3 more)

### Community 12 - "Modo de leitura e ícones"
Cohesion: 0.12
Nodes (42): IconArchive(), IconBookOpen(), IconChevronLeft(), IconChevronRight(), IconClearPage(), IconClose(), IconCode(), IconEraser() (+34 more)

### Community 13 - "Remover e «A rever»"
Cohesion: 0.10
Nodes (43): IconTrash(), downloadOriginal(), labelOf(), Removal, RemoveButton(), remove(), RemoveDialog(), remove() (+35 more)

### Community 14 - "Página de entrada"
Cohesion: 0.09
Nodes (49): Identidade visual (pergaminho, azul-marinho e dourado), Página de apresentação e popups de entrada, App(), signOutAccount(), WelcomeOrHome(), WelcomeRoute(), BRAND, BrandBanner() (+41 more)

### Community 15 - "Gravar marcas de leitura"
Cohesion: 0.09
Nodes (43): MarksLayer(), StrokeShape(), ReaderPage(), finish(), onPointerDown(), onPointerMove(), draftKey(), dropDraft() (+35 more)

### Community 16 - "DataRepo"
Cohesion: 0.17
Nodes (21): DataRepo, Group, blocks(), exam(), make_exam(), refused(), _rows(), test_a_missing_question_or_text_between_blocks_is_refused() (+13 more)

### Community 17 - "scaffold/__init__.py"
Cohesion: 0.21
Nodes (4): config_dir(), _render(), scaffold(), ScaffoldReport

### Community 18 - "types.ts"
Cohesion: 0.06
Nodes (61): Editar no sítio (lápis, method: user), Montagem da aplicação (#root e /src/main.tsx), ButtonVariant, certaintyLevel(), ConfidenceBadge(), EditButton(), methodKind(), ReasonList() (+53 more)

### Community 19 - "write_extraction"
Cohesion: 0.18
Nodes (5): write_text_if_changed(), PageMeta, write_extraction(), simhash(), test_write_extraction_layout()

### Community 20 - "classification"
Cohesion: 0.06
Nodes (32): _text_only(), CLASSIFIER_VERSION (reclassificação), Opção file_uncertain_type (tipo por confirmar), Versão do extractor (provoca nova extracção), classification, academic_year_start_month, auto_file_threshold, body_pages (+24 more)

### Community 21 - "source.ts"
Cohesion: 0.07
Nodes (29): AccountSession, AppData, RepoInfo, Change, RepoRef, GuestInfo, guestName(), APP_REPOSITORY (+21 more)

### Community 22 - "Testes da classificação"
Cohesion: 0.11
Nodes (29): _classifier(), _custom(), _doc(), _signal(), test_acronym_must_be_written_as_acronym(), test_ambiguous_goes_to_review_with_alternatives(), test_assessment_date_variant_and_ordinal(), test_enrolled_units_are_preferred() (+21 more)

### Community 23 - "Reason"
Cohesion: 0.08
Nodes (29): Alternative, Classification, FieldValue, Reason, contains_phrase(), inherit(), Classifier, pick() (+21 more)

### Community 24 - "BundleEditor.tsx"
Cohesion: 0.33
Nodes (9): BundleEditor(), save(), shortPath(), FileBadge(), fileFormat(), FORMATS, IconStack(), BundleMembers() (+1 more)

### Community 25 - "Fontes de dados e cache"
Cohesion: 0.06
Nodes (21): manifest.json (built_from, built_at, SHA-256), clearCache(), Entry, getCached(), openDb(), putCached(), WorkflowRun, fetchPublicManifest() (+13 more)

### Community 26 - "Abrir arquivos (unpack)"
Cohesion: 0.13
Nodes (26): ArchiveSettings, ArchiveToolMissing, _Budget, _collect_staged(), _copy_limited(), Entry, safe_member_path(), unpack() (+18 more)

### Community 27 - "document_types"
Cohesion: 0.06
Nodes (42): Vocabulário do repositório de dados substitui o da aplicação, assessment_types, keywords, labels, patterns, slug, document_types, excluded_by (+34 more)

### Community 28 - "Recepção do depósito"
Cohesion: 0.12
Nodes (13): uuid7(), BlobRef, Review, Source, mime_of(), sha256_file(), DepositItem, default_cache_dir() (+5 more)

### Community 29 - "test_domain.py"
Cohesion: 0.23
Nodes (8): load_catalog(), test_catalog_import_is_idempotent(), test_catalog_import_rejects_unknown_unit_reference(), test_catalog_request_adds_aliases_without_losing_existing(), test_catalog_request_keeps_fields_it_does_not_mention(), test_normalize_unifies_spellings(), test_slugify(), test_uuid7_is_version_7_and_sortable()

### Community 30 - "Visor de documentos e PDF"
Cohesion: 0.09
Nodes (25): Abertura de PDFs por partes (PDFDataRangeTransport), Drag, useDragScroll(), pageUnitsHeight(), closeOnRemoval(), openPdf(), OutlineEntry, pageSize() (+17 more)

### Community 31 - "package.json"
Cohesion: 0.07
Nodes (35): dependencies, fflate@^0.8.3, @fontsource/cinzel@^5.3.0, @fontsource-variable/inter@^5.3.0, @fontsource-variable/source-serif-4@^5.3.0, i18next@^26.4.2, katex@^0.18.9, pdfjs-dist@^6.3.289 (+27 more)

### Community 32 - "Contas no Worker"
Cohesion: 0.23
Nodes (22): applyInvite(), cleanEmail(), cleanPassword(), clientIp(), createSession(), decodeIdToken(), findInvite(), googleReady() (+14 more)

### Community 33 - "API das contas (interface)"
Cohesion: 0.09
Nodes (8): AccountError, AccountInvite, ACCOUNTS_URL, AccountsApi, AccountsConfig, FetchLike, STORAGE_URL, AccountRole

### Community 34 - "Cliente da API GitHub"
Cohesion: 0.11
Nodes (10): encodePath(), GitHubClient, GitHubError, toBase64(), TreeEntry, buildTree(), commitChanges(), encoder (+2 more)

### Community 35 - "pipeline.yml"
Cohesion: 0.20
Nodes (9): .github/workflows/nexus.yml do repositório de dados, jobs, processar, name, permissions, actions, contents, runs-on (+1 more)

### Community 36 - "Catálogo de exemplo"
Cohesion: 0.06
Nodes (33): degree, name, slug, units, academic_year, assessment_method, assessments, lecturers (+25 more)

### Community 38 - "Índice e tipos da interface"
Cohesion: 0.06
Nodes (31): Procedimento para mudar o esquema do índice, dir, hasIndex, vectors, Bind, OoDb, ReadonlyDb, sqlite() (+23 more)

### Community 39 - "Workflow de CI"
Cohesion: 0.08
Nodes (31): runs-on, steps, runs-on, steps, name, runs-on, steps, jobs (+23 more)

### Community 40 - "Credencial GitHub do Worker"
Cohesion: 0.10
Nodes (20): adminCache, appJwt(), der(), derLength(), HEADERS, importAppKey(), installation, ownerCache (+12 more)

### Community 41 - "gerar_repo.py"
Cohesion: 0.18
Nodes (3): _auth_env(), build(), _files()

### Community 42 - "proxy.js"
Cohesion: 0.16
Nodes (26): canRead(), canWrite(), effectiveRole(), requireAdmin(), requireUser(), sessionUser(), adminLogin(), dataRepo() (+18 more)

### Community 43 - "extract_file"
Cohesion: 0.12
Nodes (18): docx_com_equacao(), _font(), imagem_texto(), notebook(), pdf_bytes(), pdf_digitalizado(), pptx_slides(), xlsx_notas() (+10 more)

### Community 44 - "read_yaml"
Cohesion: 0.08
Nodes (33): dump_yaml(), model_to_data(), read_yaml(), write_json_if_changed(), write_yaml_if_changed(), User, effective_visibility(), is_public() (+25 more)

### Community 45 - "Layout e ajuda"
Cohesion: 0.19
Nodes (21): Brand(), IconBooks(), IconCheckList(), IconHelp(), IconHome(), IconInbox(), IconSearch(), IconSettings() (+13 more)

### Community 46 - "Projectos de código"
Cohesion: 0.10
Nodes (23): CodeProjectSettings, Manifest, choose_lead(), key(), build_bundle(), _code_ratio(), _dirs_of(), files_in() (+15 more)

### Community 47 - "HttpError"
Cohesion: 0.23
Nodes (17): admin(), cleanName(), cleanRole(), cleanUntil(), createUser(), managerLimits(), newId(), encoder (+9 more)

### Community 48 - "Regras de partilha e visibilidade (documento, tipo, cadeira, privado)"
Cohesion: 0.07
Nodes (13): upgrade(), upgrade(), upgrade(), upgrade(), upgrade(), SearchBackend, BlobStore, Fase 5: abertura a outros utilizadores (+5 more)

### Community 49 - "nexus.yml"
Cohesion: 0.22
Nodes (8): concurrency, cancel-in-progress, group, jobs, name, permissions, actions, contents

### Community 50 - "Configuração do Biome"
Cohesion: 0.08
Nodes (24): noAutofocus, noLabelWithoutControl, css, parser, files, includes, formatter, indentStyle (+16 more)

### Community 51 - "Repositório de dados (privado)"
Cohesion: 0.05
Nodes (38): missing_credentials(), Depósito (envio sem organizar), Detecção de cópias ao depositar (ownedSha), Knowledge Nexus (plataforma de estudo), Serviço knowledge-nexus no Raspberry Pi, Repositório da aplicação (público, GitHub Pages), GitHub Actions como worker (concurrency), CSP estrita e noindex (+30 more)

### Community 52 - "bundles.py"
Cohesion: 0.09
Nodes (20): ClassificationSettings, ExtractionMeta, fix_spacing_accents(), strip_accents(), bundle_id(), folder_name(), folder_of(), FolderGroup (+12 more)

### Community 53 - "Gestão dos acessos"
Cohesion: 0.08
Nodes (55): Acesso temporário (códigos KN1), Gestão dos acessos (acessos.yaml e cofre de códigos), Dar acesso temporário (acesso total ou só ver e descarregar), acessos.yaml (acessos temporários sem tokens), submit(), submit(), accessesKey(), AccessManager() (+47 more)

### Community 54 - "Depositar ficheiros"
Cohesion: 0.15
Nodes (21): UploadEntry, Known, prepareUpload(), Row, State, add(), onDrop(), send() (+13 more)

### Community 55 - "test_serve.py"
Cohesion: 0.07
Nodes (22): PublicResult, app_checkout(), PublicState, publish_public_if_due(), serve(), _git(), _QuietGit, test_app_update_is_seen_only_when_pull_is_safe() (+14 more)

### Community 56 - "remove_unit"
Cohesion: 0.29
Nodes (4): remove_course(), remove_unit(), write_unit(), Criar e remover cursos (courses_remove)

### Community 57 - "Dependências de desenvolvimento"
Cohesion: 0.09
Nodes (22): devDependencies, @biomejs/biome@^2.5.14, jsdom@^30.1.1, tailwindcss@^4.3.3, @testing-library/jest-dom@^7.0.1, @testing-library/react@^16.3.3, @testing-library/user-event@^14.6.7, @types/node@^26.6.3 (+14 more)

### Community 58 - "config.py"
Cohesion: 0.36
Nodes (6): DedupSettings, LimitSettings, PublishingSettings, _Section, Settings, SourceWeights

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
Cohesion: 0.06
Nodes (26): Git, GitError, RemoteBusy, RunReport, _check_target(), github_slug(), publish_public(), PublishError (+18 more)

### Community 64 - "raspberry-pi/instalar.sh"
Cohesion: 0.07
Nodes (27): archives, max_depth, max_entries, max_ratio, max_total_bytes, software_min_entries, software_other_ratio, code_projects (+19 more)

### Community 65 - "vigiar-deposito.sh"
Cohesion: 0.29
Nodes (7): Correcção do DNS do WSL («Could not resolve host»), Variável NEXUS_PROCESSAMENTO=local (desligar o Actions), Onde corre o processamento (Actions ou computador), vigiar-deposito.bat (qualquer PC e pasta), git_app(), vigiar-deposito.sh script, UV_PROJECT_ENVIRONMENT

### Community 66 - "Cursos e ligações"
Cohesion: 0.14
Nodes (9): Course, CourseUnitLink, CurricularUnit, unit_key(), Cursos com cadeiras de outras instituições, Calendário e plano de estudo, Curso, Edição da cadeira (+1 more)

### Community 67 - "builder.py"
Cohesion: 0.06
Nodes (35): Topic, build_indices(), BuildResult, _dump(), _file_info(), _flatten_topics(), near_duplicate_pairs(), _question_rows() (+27 more)

### Community 68 - "Skills de revisão e catálogo"
Cohesion: 0.19
Nodes (13): Skill /inferir-catalogo, Rascunho de catálogo (instituição, cursos, cadeiras), nexus catalogo aceitar / rejeitar <id>, nexus catalogo exportar (formato nexus-catalogo), nexus catalogo importar <ficheiro>, nexus catalogo propostas --json, Skill /rever-classificacoes, nexus documento texto <id> --paginas (+5 more)

### Community 69 - "Modo de leitura"
Cohesion: 0.18
Nodes (16): Modo de leitura (Reader), Marcas de leitura, MarkColor, PAGE_UNITS, StrokeSize, DEFAULT_PREFS, Fit, lastPage() (+8 more)

### Community 70 - "Privacidade e CSP"
Cohesion: 0.17
Nodes (13): index.html (entrada da interface), Ícones da marca (/brand/icon-32, icon-64, icon-192), Worker nexus-ficheiros.nightmareftw.workers.dev, CSP da interface (connect-src api.github.com e Worker nexus-ficheiros; wasm-unsafe-eval), Página de privacidade, Dados da conta (nome, email, datas, nível; palavra-passe só como resumo PBKDF2), Base de dados Cloudflare D1 (contas, sessões, marcas de leitura), Entrar com Google (nome, email confirmado, identificador da conta) (+5 more)

### Community 71 - "with"
Cohesion: 0.25
Nodes (8): with, fetch-depth, filter, key, path, restore-keys, sparse-checkout, sparse-checkout-cone-mode

### Community 72 - "Skill processar depósito"
Cohesion: 0.16
Nodes (12): Skill /processar-deposito, nexus verificar, Resumo do resultado em pt-PT (novos, deduplicados, arrumados, A rever, propostas, erros), Ferramentas de sistema (Tesseract com por, Pandoc, LibreOffice), CLAUDE.md do repositório de dados (template), deposito/<login>/ (entrada) e _erros/ (falhas com .log), CLI nexus, Português europeu, grafia pré-Acordo (+4 more)

### Community 73 - "shutil"
Cohesion: 0.27
Nodes (6): _assemble(), expand_lotes(), _extract(), LoteError, LoteReport, _safe_member()

### Community 74 - "FakeGitHub"
Cohesion: 0.22
Nodes (7): b64decode(), decoder, encoder, FakeGitHub, FakeRepo, json(), setup()

### Community 75 - "extract/__init__.py"
Cohesion: 0.14
Nodes (26): ExtractionSettings, clean_text(), ExtractionError, ExtractionResult, looks_mathematical(), PageText, archive_listing(), code_project_text() (+18 more)

### Community 76 - "normalize"
Cohesion: 0.18
Nodes (10): normalize(), _unify_spelling(), Term, Vocabularies, material_folder(), check(), unit_features(), compile_terms() (+2 more)

### Community 78 - "index.js"
Cohesion: 0.25
Nodes (14): handleAccounts(), SESSION_PREFIX, withCors(), allowed(), authCache, handle(), handleBlob(), keyFor() (+6 more)

### Community 79 - "catalog_io.py"
Cohesion: 0.16
Nodes (16): CatalogError, _check_slug(), export_bundle(), _given(), import_bundle(), ImportReport, _merge(), _write_entity() (+8 more)

### Community 80 - "pipeline"
Cohesion: 0.29
Nodes (7): pipeline, if, secrets, uses, with, app-ref, reclassify

### Community 81 - "Workflow Pages"
Cohesion: 0.06
Nodes (34): Publicar a interface (Pages com GitHub Actions), runs-on, steps, concurrency, cancel-in-progress, group, environment, needs (+26 more)

### Community 82 - "Estrutura do repositório de dados"
Cohesion: 0.43
Nodes (7): nexus processar --json, Estrutura do repositório de dados, documentos/<id>.yaml (cópia lógica por utilizador), Ramo indices (meta.db e pesquisa.db.gz, derivados), revisao/propostas/ (propostas de catálogo), texto/<sha256>/ (páginas em Markdown + LaTeX, meta.json), Workflow nexus (processa o depósito a cada envio)

### Community 83 - "useApp"
Cohesion: 0.13
Nodes (41): Home(), PublicShell(), queryClient, Shell(), DocumentPreview(), hasOriginalView(), IMAGE_EXTS, OriginalPane() (+33 more)

### Community 85 - "env"
Cohesion: 0.20
Nodes (10): GH_TOKEN, GIT_AUTHOR_EMAIL, GIT_AUTHOR_NAME, GIT_COMMITTER_EMAIL, GIT_COMMITTER_NAME, NEXUS_PUBLICO_TOKEN, NEXUS_R2_ACCESS_KEY_ID, NEXUS_R2_ENDPOINT (+2 more)

### Community 88 - "reclassificar"
Cohesion: 0.20
Nodes (10): reclassificar, on, push, workflow_dispatch, branches, paths, default, description (+2 more)

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
Nodes (11): current_version(), migrate(), _set_format_version(), _v1_visibility_inherits(), _v2_duplicate_of(), _v3_bundles(), _v4_bundle_lead_choice(), _v5_removed() (+3 more)

### Community 93 - "nexus.yaml do template"
Cohesion: 0.25
Nodes (7): app, ref, repository, classification, auto_file_threshold, format_version, owner

### Community 94 - "steps"
Cohesion: 0.33
Nodes (6): steps, id, if, name, run, uses

### Community 95 - "Configuração Vite"
Cohesion: 0.25
Nodes (7): @tailwindcss/vite@^4.3.3, vite@^8.3.1, @vitejs/plugin-react@^6.1.1, devWithoutCsp, @tailwindcss/vite, vite, @vitejs/plugin-react

### Community 97 - "screenshots.spec.ts"
Cohesion: 0.18
Nodes (5): @playwright/test@^1.63.0, snapshot, @playwright/test, fakeD1(), migrations

### Community 107 - "scaffold"
Cohesion: 0.28
Nodes (8): Fase 1 (concluída), Fase 2: enriquecimento, transcrição e banco de perguntas, Fase 3: pesquisa semântica, flashcards FSRS e simulados, Flashcard (estado FSRS), Pergunta (banco de perguntas), Simulado, Tentativa (o modo tutor conta as dicas), gerado/<sha256>/ (material gerado, fase 2)

### Community 109 - "conftest.py"
Cohesion: 0.10
Nodes (14): Check, _libreoffice_works(), run_checks(), _tesseract_langs(), _version(), data_root(), fixed_clock(), git_root() (+6 more)

### Community 121 - "store.py"
Cohesion: 0.10
Nodes (11): StorageSettings, _Dumper, _str_representer(), BundleRef, DocumentKind, Removal, Status, export_tree() (+3 more)

### Community 127 - "Contas no Worker do Cloudflare (D1)"
Cohesion: 0.33
Nodes (7): Contas no Worker do Cloudflare (D1), Níveis de conta (none, viewer, reader, contributor, organizer, editor), Originais no Cloudflare R2 (opcional), Ligar as contas (D1, GitHub App, segredos do Worker), Entrar com Google (OAuth), GitHub App do Worker (Knowledge Nexus contas), Só por convite (SIGNUP = invite)

## Knowledge Gaps
- **12 isolated node(s):** `nexus`, `UV_PROJECT_ENVIRONMENT`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)`, `Grafo do projecto (graphify)`, `Chave de deploy com escrita para o repositório de dados` (+7 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 844 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `normalize()` connect `normalize` to `Propostas de catálogo e texto`, `builder.py`, `Estantes, cursos e configuração`, `Reconciliação do pipeline`, `Projectos de código`, `write_extraction`, `bundles.py`, `classification`, `Testes da classificação`, `Reason`, `test_domain.py`?**
  _High betweenness centrality (0.070) - this node is a cross-community bridge._
- **Are the 69 inferred relationships involving `DataRepo` (e.g. with `Settings` and `Layout`) actually correct?**
  _`DataRepo` has 69 INFERRED edges - model-reasoned connections that need verification._
- **What connects `nexus`, `UV_PROJECT_ENVIRONMENT`, `Excepção: material marcado Público (nexus visibilidade, nexus publicar, publishing.public_repo)` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Testes do pipeline` be split into smaller, more focused modules?**
  _Cohesion score 0.10675990675990676 - nodes in this community are weakly interconnected._
- **Why does `normalize()` connect `Estantes, cursos e configuração` to `BundleEditor.tsx`, `normalize`, `classification`, `Índice e tipos da interface`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 38 inferred relationships involving `Pipeline` (e.g. with `DataRepo` and `BlobRef`) actually correct?**
  _`Pipeline` has 38 INFERRED edges - model-reasoned connections that need verification._
- **Should `LibraryPage.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07966101694915254 - nodes in this community are weakly interconnected._