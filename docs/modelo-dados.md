# Modelo de dados

## Fase 1 (implementado)

| Entidade | Onde | Notas |
|---|---|---|
| Instituição | `catalogo/<inst>/instituicao.yaml` | slug, nome, sigla, aliases |
| Curso | `catalogo/<inst>/cursos/*.yaml` | grau; ligação às cadeiras com ano curricular e semestre (uma cadeira pode estar em vários cursos, também de outras instituições: `unit` é o slug da cadeira da mesma instituição ou a chave completa `<inst>/<slug>`) |
| Unidade curricular | `catalogo/<inst>/ucs/*.yaml` | código, sigla, aliases, palavras-chave, docentes, ECTS, tópicos hierárquicos |
| Edição da cadeira | dentro da cadeira (`editions`) | ano lectivo, docentes, método de avaliação, avaliações (tipo, época, número, data, peso, folha de consulta) |
| Vocabulários | `catalogo/vocabularios.yaml` | tipos de documento, papéis, origens de resolução, tipos de avaliação, épocas; com rótulos i18n e âmbito opcional por instituição |
| Utilizador | `utilizadores/<login>.yaml` | login GitHub, preferências (modo tutor), inscrições em cursos e em edições de cadeira, `sharing.units` e `sharing.types` (visibilidade escolhida por cadeira e por tipo de material) |
| Grupo | `grupos/<slug>.yaml` | membros e papéis (usado na fase 5) |
| Blob | `originais/` + `blob` no documento | SHA-256, tamanho, extensão, mime; único por repositório |
| Documento | `documentos/<uuid7>.yaml` | cópia lógica por utilizador: origens, `parent` (arquivo), `kind`, visibilidade, estado + histórico, classificação por campo, revisão, nome arrumado, notas, manifesto de projecto de código |
| Extracção | `texto/<sha>/meta.json` | por conteúdo: extractor e versão, páginas (método, confiança OCR, `needs_ai_transcription`, rótulo), simhash |
| Proposta de catálogo | `revisao/propostas/*.yaml` | tipo, estado, dados, evidências (documento, página, excerto) |
| Proveniência | `nexus.domain.provenance` | `SourceRef {sha256, page, document}` + `Generated {by, at, model, sources}` |

**Cópias:**
- O mesmo ficheiro (mesmo SHA-256) é guardado uma só vez.
- Ficheiros diferentes com exactamente o mesmo texto, página a página (ex.: o mesmo PDF
  guardado de novo), ficam ligados: o mais recente leva `duplicate_of` e não aparece na
  biblioteca, na pesquisa nem em "A rever". Qualquer diferença no texto mantém os dois
  (são versões diferentes). "Não são iguais" (`near_duplicates_dismissed`) desfaz a
  ligação. Os originais nunca se apagam.
- **Conjuntos** (`bundle: {id, name, method, lead}`): ficheiros que só fazem sentido
  juntos (enunciado + código + imagens). O motor propõe-nos a partir das pastas de projecto
  (`method: heuristic`) e o utilizador junta-os à mão (`method: user`). O principal (`lead`)
  é escolhido pelo pipeline; os outros herdam dele os campos de classificação que não são
  do utilizador e ficam arrumados como `<principal>/<nome original>`. "Separar" grava
  `bundle_dismissed: true` (formato 4). "Tornar principal" grava `bundle.lead_choice`, que
  manda sobre a escolha do motor (formato 5).

**Regras de partilha e visibilidade:**
- O conteúdo derivado (texto, e mais tarde resumos e perguntas) é calculado por blob e
  reutilizado por quem tem acesso a esse blob.
- Tudo o que é pessoal (classificação da cópia lógica, notas, progresso) fica por utilizador.
- Visibilidade (formato 2):
  - por cadeira, em `utilizadores/<login>.yaml` → `sharing.units: {<cadeira>: public}`;
  - por tipo de material dentro de uma cadeira, no mesmo ficheiro →
    `sharing.types: {"<cadeira>::<tipo>": public}` (mais específico do que a cadeira);
  - por documento, em `documentos/<id>.yaml` → `visibility` (sem campo = segue o tipo ou a
    cadeira);
  - ordem: documento → tipo na cadeira → cadeira → privado;
  - sem escolha nenhuma, é **privado**. A visibilidade efectiva vai para o índice
    (`visibility`, `visibility_inherited`);
  - valores: `private`, `public`; reservados para a fase 5 (contam como privados):
    `user:<login>`, `link`, `group:<slug>`, `unit_edition`;
  - só o utilizador escolhe visibilidades; o pipeline e a IA nunca as alteram.

## Fases seguintes (desenhado; criado quando a fase chegar)

Todos os registos gerados têm `generated` (proveniência) e ligam a `SourceRef`.

**Conteúdo por blob (partilhável):**
- **Pergunta:** `gerado/<sha>/perguntas/*.yaml`, com número, enunciado em
  Markdown+LaTeX, página, cotação, tópicos (cadeira) e ligação à resolução (sha + página)
  quando existir. É a base do banco de perguntas e da análise de frequência por tópico.
- **Resumo, glossário, conceitos, fichas de revisão e formulários:**
  `gerado/<sha>/…` (Markdown com citações).

**Dados pessoais (por utilizador):**

`estudo/<login>/…` no repositório de dados, escritos em lote para evitar um commit por acção:
- **Flashcard:** frente, verso, fonte e estado FSRS (estabilidade, dificuldade, datas),
  com o registo de revisões agregado por sessão.
- **Simulado:** perguntas escolhidas (ponderadas pela frequência dos tópicos), duração e
  critérios.
- **Tentativa:** respostas, passos de raciocínio, verificações por passo e dicas usadas
  (o modo tutor conta quantas dicas foram pedidas).
- **Preparação por tópico:** derivada das tentativas e dos flashcards.

**Calendário:**
- Avaliações da edição da cadeira (data, peso) e prazos de trabalhos.
- Plano de estudo: sessões por tópico até à data de cada prova.

**Trabalhos:**
- **Trabalho:** enunciado (documento), requisitos (checklist extraída), membros, tarefas
  (responsável, prazo, estado), reuniões, decisões e checklist de entrega.
- A colaboração real entre utilizadores é feita num repositório de grupo, na fase 5.

**Fase 5 (servidor):**
- O esquema relacional de partida é `backend/nexus/index/schema.py`, com baseline
  Alembic `0001`.
- Os ficheiros YAML importam-se directamente, porque os identificadores (UUIDv7, chaves
  `inst/uc`, SHA-256) são estáveis.
