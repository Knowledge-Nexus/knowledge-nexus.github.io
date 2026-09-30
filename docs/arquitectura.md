# Arquitectura

## Visão geral ("só GitHub")

```
Browser ─ https://knowledge-nexus.github.io (SPA React, código público, CSP estrita, noindex)
  │  token fine-grained (só o repositório de dados; guardado apenas neste browser)
  ├─ lê  ramo `indices` → meta.db + pesquisa.db → SQLite WASM em memória (cache IndexedDB)
  ├─ lê  originais/ e texto/ → pdf.js na página citada; Markdown + KaTeX
  └─ escreve commits (Git Data API): deposito/, documentos/, utilizadores/, catalogo/_importar/
                       │ push
                       ▼
Repositório PRIVADO de dados ── .github/workflows/nexus.yml ──► pipeline.yml (este repositório)
                       ▲                                          │ nexus processar
                       └──────────── commit + push ───────────────┘ + ramo indices reescrito
Claude Code (web ou WSL2) sobre o repositório de dados: skills → CLI `nexus` → commit
`nexus vigiar <pasta>` (WSL2): pasta local → API do GitHub → deposito/
```

Porque é assim:
- **O GitHub Pages não tem servidor e é público.** Só pode servir o código da interface.
  Os dados e o processamento vivem num repositório privado e no respectivo Actions.
- **Não há base de dados central.** O estado está em ficheiros YAML e Markdown no
  repositório de dados: legíveis, com diffs e fáceis de fundir. O SQLite é derivado e
  publica-se num ramo órfão de um só commit (`indices`), reescrito a cada execução, para
  não inchar o histórico.
- **O "worker" é o GitHub Actions**, com `concurrency` para uma execução de cada vez.
  O pipeline é um ciclo de reconciliação idempotente: calcula o que falta a partir do
  estado. Por isso, uma execução interrompida ou repetida não estraga nada.

## Fluxos

### Depósito
1. O browser calcula o SHA-256 de cada ficheiro e ignora lixo de sistema (Thumbs.db,
   .DS_Store) e pastas geradas (node_modules, .git…).
2. Se o conteúdo já existir, envia só uma referência `*.ref.yaml`.
3. Cada lote é um único commit em `deposito/<login>/<lote>/<caminho original>`.
4. Esse push dispara o workflow do repositório de dados.

### Pipeline (`nexus processar`)

**Etapas:**
1. **Pedidos de catálogo:** aplica `catalogo/_importar/*.yaml` (vindos da interface).
2. **Recepção:** para cada item do depósito (ficheiro, projecto de código ou referência):
   - calcula o SHA-256 e deduplica: com o mesmo dono e o mesmo conteúdo, só acrescenta
     uma origem; com outro dono, cria uma cópia lógica nova;
   - **desempacota** zip/tar/7z/rar com limites de segurança. Os projectos de código
     ficam como uma unidade, num zip determinístico com manifesto;
   - **extrai** o texto por conteúdo, com cache, e grava-o em `texto/<sha>/`;
   - só no fim, e se tudo correu bem, move o original para `originais/`. Se falhar, vai
     para `deposito/<login>/_erros/` com um `.log`. Se faltar uma ferramenta, fica no
     depósito para a próxima execução.
3. **Reconciliação:** para cada documento:
   - volta a extrair se o extractor mudou de versão;
   - classifica, sem sobrepor campos do utilizador nem da IA;
   - decide entre arrumar (nome normalizado) e abrir revisão (com motivos e alternativas);
   - regista propostas de catálogo.

**Publicação:** commit e push. Se o remoto tiver avançado, repete a partir do remoto,
sem nunca perder ficheiros locais. No fim reconstrói os índices e reescreve o ramo
`indices`.

### Revisão
1. A interface grava um patch no `documentos/<id>.yaml`: os campos escolhidos ficam com
   `method: user` e a revisão fica `resolved`.
2. O próximo processamento arruma o documento e marca-o como `reviewed`.
3. As propostas de cadeira são aceites através de um pedido de catálogo. O motor cria a cadeira e
   reclassifica o que estava à espera dela.

### Pesquisa
- O FTS5 (`unicode61 remove_diacritics 2`) indexa duas colunas: o texto original e a
  versão normalizada (sem acentos, com as grafias pré-AO e AO90 unificadas).
- A consulta é construída da mesma forma em Python (`index/search.py`) e em TypeScript
  (`data/sqlite/search.ts`). O teste de contrato garante que ambos dão resultados iguais.
- Cada resultado aponta para o documento e a página, e o PDF abre nessa página.

## Classificação (heurística, explicável)

- **Sinais:** cada um tem um peso configurável.
  - nome do ficheiro;
  - pastas do lote;
  - arquivo de origem;
  - cabeçalho da 1.ª página;
  - texto das primeiras páginas;
  - metadados do PDF.
- **Cadeira:** código, sigla, nome, aliases, palavras-chave e docentes do catálogo. Primeiro
  entre as inscrições do utilizador (com bónus) e só depois no catálogo todo.
- **Tipo de documento:** famílias de tipos com as mesmas palavras-chave. Dentro da
  família, o papel (enunciado ou resolução) decide o tipo. O formato (ex.: .pptx → slides)
  e a condição de projecto de código também contam como indícios.
- **Ano lectivo:** padrões como "2023/24" ou "Ano Lectivo 2023-2024", ou então datas. O
  ano começa em Setembro (configurável).
- **Confiança:** `melhor / (melhor + segundo + prior)`. Um sinal forte e isolado dá
  confiança alta; dois candidatos próximos ou um sinal fraco dão confiança baixa.
- **Obrigatórios para arrumar:** cadeira e tipo; nas avaliações, também o ano e o tipo de
  avaliação. Tudo configurável em `nexus.yaml`.
- **Casos ambíguos:** vão para "A rever". A skill `/rever-classificacoes` (Claude Code)
  propõe classificações com justificação, e quem confirma é o utilizador.

## Segurança e privacidade

- **Site público, mas só com código.** Tem `robots noindex`, e a CSP limita
  `connect-src` a `api.github.com`, sem scripts de terceiros.
- **Token:** fine-grained e limitado ao repositório de dados. Fica em `sessionStorage`,
  ou em `localStorage` se o utilizador pedir "lembrar".
- **Recusa de repositórios públicos:** a interface, o `nexus vigiar` e o workflow.
- **Material público (opcional, por escolha do dono):** o que tiver visibilidade `public`
  (por cadeira ou por documento) é copiado por `nexus publicar` para um repositório
  **público à parte** (`publishing.public_repo`, ex.: `estudo-publico`) servido pelo Pages
  em `/<nome>/`; a interface lê-o em `#/publico` sem token (mesma origem, `connect-src
  'self'`). Esse repositório tem um só commit, reescrito a cada publicação: o que volta a
  ser privado sai de lá sem ficar no histórico. Não leva notas, caminhos de origem,
  histórico, revisões, propostas nem justificações. O `nexus publicar` recusa publicar no
  repositório de dados ou no da aplicação, e só faz push se o conteúdo mudou.
- **Neste repositório:** a guarda de binários impede commits de documentos.
- **No workflow do repositório de dados:** uma guarda falha se algum commit alterar ou
  apagar ficheiros em `originais/`.

## Limites conhecidos

- **Tamanho:** o GitHub recomenda repositórios abaixo de 1–5 GB e aceita no máximo
  100 MB por ficheiro (a interface limita a 95 MB). Não há LFS, porque o browser não
  consegue enviar para o LFS.
  - Mitigações: vários repositórios de dados (por ano lectivo), ou originais em S3 na fase 5.
- **Tempo e custo:** cada envio demora 1–3 minutos a ser processado, e os repositórios
  privados têm uma quota de minutos de Actions. O LibreOffice só é instalado quando há
  documentos Office no lote.
- **Privacidade dentro do repositório:** entre utilizadores do mesmo repositório,
  "privado" não se garante (quem lê o repositório lê tudo). Na fase 5 a solução passa por
  repositórios por grupo ou por um backend.
- **Crescimento do índice:** o browser descarrega os índices inteiros. Quando crescerem,
  reparte-se `pesquisa.db` por cadeira ou por ano lectivo.
