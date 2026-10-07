# Repositório de dados (privado)

Criado por `nexus scaffold <pasta> --dono <login>` ou pelo assistente da interface.
Formato versionado por `format_version` em `nexus.yaml` (migrações: `nexus migrar`).

```
nexus.yaml                           definições (sobrepõem config/predefinicoes.yaml)
CLAUDE.md, .claude/                  regras e skills para o Claude Code
.github/workflows/nexus.yml          chama o pipeline reutilizável da aplicação
catalogo/vocabularios.yaml           tipos de documento, papéis, origens, avaliações, épocas
catalogo/<inst>/instituicao.yaml
catalogo/<inst>/cursos/<curso>.yaml  curso + cadeiras (ano curricular, semestre)
catalogo/<inst>/ucs/<uc>.yaml        cadeira: código, sigla, aliases, palavras-chave, docentes,
                                     tópicos, edições (ano lectivo, método, avaliações)
catalogo/_importar/*.yaml            pedidos da interface (aplicados e apagados pelo motor)
utilizadores/<login>.yaml            perfil, preferências (modo tutor), inscrições
grupos/<grupo>.yaml                  (fase 5)
deposito/<login>/<lote>/…            entrada; _erros/<lote>/… + .log
originais/<aa>/<sha256>.<ext>        imutáveis
documentos/<uuid7>.yaml              cópia lógica por utilizador
texto/<sha256>/                      documento.md, paginas/0001.md…, meta.json, render.pdf
revisao/propostas/<id>.yaml          cadeira/curso/instituição propostos, com evidência
gerado/<sha256>/…                    (fase 2) material gerado, sempre com proveniência
ramo indices                         manifest.json, meta.db, pesquisa.db.gz (derivados)
```

## Exemplos

`documentos/<id>.yaml` (resumido):

```yaml
id: 01a0effb-7de0-7267-b012-873ec5d758f0
owner: aluna
kind: file                     # file | archive | code_project
blob: {sha256: 2fdb…, size: 1834, ext: pdf, mime: application/pdf}
sources:
  - {via: upload, path: AM1/Exame_Recurso_2023-24.pdf, batch: 20251001T100000Z-abcd}
visibility: private            # private | group:<slug> | unit_edition
status: filed                  # received → extracted → classified → filed → enriched → reviewed
classification:
  unit:
    value: ufe/am1
    confidence: 0.893
    method: heuristic          # heuristic | user | ai:<agente>
    reasons:
      - {code: unit.name, params: {value: Análise Matemática I}, source: header, weight: 3.0}
    alternatives: []
  document_type: {value: enunciados-avaliacao, confidence: 0.804, …}
  academic_year: {value: 2023-2024, …}
  assessment_type: {value: exame, …}
  exam_season: {value: recurso, …}
  role: {value: statement, …}
classifier_version: 1
review: null                   # ou {status: open, reasons: [...], opened_at: …}
filed_name: 2023-2024_exame-recurso-enunciado.pdf
notes: ""
near_duplicates_dismissed: []
```

`deposito/<login>/<lote>/<nome>.ref.yaml` (conteúdo já existente):

```yaml
sha256: 2fdb509932681fda6e9235c766ab56a593dd3dd49ea45bb5a52e2733bc40ee13
path: AM1/exame.pdf
```

Ficheiros com mais de 10 MB enviados pela interface ou pelo `nexus vigiar` chegam em
partes, porque a API do GitHub recusa blobs grandes. O motor junta-as, confirma o tamanho
e o SHA-256, e só então recebe o ficheiro; se faltarem partes, espera pela próxima execução.

```
deposito/<login>/<lote>/AM1/slides.pdf.nexus-part-0001   (10 MB)
deposito/<login>/<lote>/AM1/slides.pdf.nexus-part-0002   (resto)
deposito/<login>/<lote>/AM1/slides.pdf.nexus-parts.yaml
```

```yaml
path: AM1/slides.pdf
size: 15728640
sha256: 9c1f…
parts: 2
```

`catalogo/_importar/<data>.yaml` (pedido da interface):

```yaml
format: nexus-catalogo
version: 1
institutions:
  - slug: ufe
    name: Universidade Fictícia de Exemplo
    units: [{slug: tgi, name: Teoria dos Grafos Imaginários}]
proposals: {accept: [unit-teoria-dos-grafos-imaginarios]}
```

## Índices (`meta.db`, `pesquisa.db.gz`)

- **`meta.db`** tem as tabelas `meta`, `institutions`, `courses`, `units`, `course_units`,
  `unit_editions`, `topics`, `vocab_terms`, `users`, `documents`, `near_duplicates`,
  `proposals` e `extractions`. O esquema está em `backend/nexus/index/schema.py`.
- **`pesquisa.db.gz`** contém a base SQLite comprimida com gzip. Depois de a descarregar,
  a interface descomprime-a no browser; a base tem a tabela FTS5 `pages_fts`, o texto
  indexado (`text`, `norm`) e colunas não indexadas para filtros e visibilidade. A
  compressão mantém o ficheiro abaixo do limite de 100 MB por blob do GitHub.
- **`manifest.json`** guarda `built_from` (o commit de `main`), `built_at` e o SHA-256 de
  cada ficheiro. É com ele que a interface decide se precisa de descarregar de novo.
