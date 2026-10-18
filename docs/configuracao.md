# Configuração (utilizador)

## 1. Publicar a interface (uma vez)

No repositório `Knowledge-Nexus/knowledge-nexus.github.io`, vai a **Settings → Pages →
Build and deployment** e escolhe **Source: GitHub Actions**. O workflow `pages` publica a
interface a cada alteração em `main`.

## 2. Criar o repositório de dados (privado)

1. Cria um repositório **privado** e vazio, por exemplo `Knowledge-Nexus/estudo-dados`.
   Não actives o Pages nesse repositório.
2. Em **Settings → Branches**, protege o ramo `main` contra *force push* e contra a
   remoção. Não exijas pull requests: o pipeline faz push directamente.
3. Cria um **token fine-grained** em https://github.com/settings/personal-access-tokens/new:
   - **Repository access:** *Only select repositories* → o repositório de dados.
   - **Permissions:**
     - Contents: leitura e escrita;
     - Actions: leitura;
     - Workflows: leitura e escrita (só é preciso para criar a estrutura; depois podes
       gerar um token sem esta permissão);
     - Metadata: leitura.
   - **Expiration:** 90 dias, por exemplo. A interface avisa quando o token está a expirar.
4. Abre https://knowledge-nexus.github.io, indica `dono/nome` e o token, e escolhe
   **Criar estrutura**. Em alternativa, com o Claude Code ou em WSL2:
   `uv run nexus scaffold <clone> --dono <login>`, e depois commit e push.
5. Configura o catálogo de uma de três formas:
   - importa um YAML (vê `config/catalogo/exemplo.yaml`);
   - preenche a instituição, o curso e as cadeiras;
   - ou escolhe "inferir do material".

## 3. Página pública (opcional)

Só é preciso se quiseres tornar algum material público. Por defeito tudo é privado.

1. Cria um repositório **público** e vazio chamado `estudo-publico` (ex.:
   `Knowledge-Nexus/estudo-publico`). Não ponhas lá nada à mão: é reescrito a cada
   publicação.
2. Nesse repositório, em **Settings → Pages**, escolhe **Deploy from a branch**, ramo
   `main`, pasta `/ (root)`. Fica em `https://<dono>.github.io/estudo-publico/`.
3. Cria um **token fine-grained só para `estudo-publico`**, com Contents: leitura e escrita.
4. No repositório de **dados**, em **Settings → Secrets and variables → Actions**, cria o
   segredo `NEXUS_PUBLICO_TOKEN` com esse token.
5. No `nexus.yaml` do repositório de dados:
   ```yaml
   publishing:
     public_repo: Knowledge-Nexus/estudo-publico
   ```
6. Escolhe o que é público, na **Biblioteca**:
   - em cada cadeira ("Visibilidade da cadeira");
   - em cada tipo de material dentro da cadeira (ex.: só as fichas), no cartão do tipo;
   - em documentos escolhidos: marca-os e usa "Tornar públicos" ou "Tornar privados";
   - em cada documento, na página dele (excepções).

   Também dá com o Claude Code: `nexus visibilidade cadeira <inst>/<cadeira> publico` ou
   `nexus visibilidade tipo <inst>/<cadeira> <tipo> publico`.

A página pública é `https://knowledge-nexus.github.io/#/publico`. Não aparece nos motores
de pesquisa (`noindex`), mas qualquer pessoa com a ligação a vê.

## 4. Depositar

- **Interface:** arrasta ficheiros ou pastas para **Depositar**.
- **GitHub:** larga ficheiros em `deposito/<login>/` pela interface web do GitHub (máximo
  25 MB por ficheiro) ou com git.
- **Pasta local vigiada (WSL2):**
  ```bash
  export NEXUS_TOKEN=…            # token fine-grained do repositório de dados
  uv run nexus vigiar ~/Deposito --repositorio Knowledge-Nexus/estudo-dados
  ```
  - Mantém a pasta dentro do WSL (ex.: `~/Deposito`) para a detecção ser imediata. Em
    `/mnt/c/...` também funciona, mas usa polling.
  - Os ficheiros saem da pasta só depois de processados: vão para `_enviados/` ou,
    se falharem, para `_erros/`.

## 4.1 Onde corre o processamento (Actions ou o teu computador)

Num repositório privado, o GitHub Actions tem uma quota mensal de minutos (2000 no plano
gratuito de uma organização). O OCR de um depósito grande gasta horas, por isso a quota
esgota-se depressa; quando acaba, as execuções falham logo ao arrancar ("The job was not
started because recent account payments have failed or your spending limit needs to be
increased").

- **No teu computador (recomendado para depósitos grandes):** `nexus servir` vigia o
  repositório de dados e processa cada envio da interface (no Windows, `vigiar-deposito.bat`).
  Os commits que ele envia levam `[skip ci]`, por isso não põem o Actions a repetir o trabalho.
  Quando há alterações da interface, espera que fiquem uns 20 segundos sem mudanças (arrastar
  várias cadeiras seguidas são vários commits) e processa-as de uma vez. Se mesmo assim o
  repositório mudar durante o processamento, junta as alterações e processa de novo; nada se
  perde. A cada 10 minutos vê se há uma versão nova da aplicação; se houver, o `.bat` actualiza-a e
  volta a arrancar sozinho (se usas uma cópia do `.bat` fora da pasta `~/nexus`, copia-o de
  novo).
- **Desligar o Actions:** cria a variável `NEXUS_PROCESSAMENTO` com o valor `local` em
  *Settings → Secrets and variables → Actions → Variables* do repositório de dados. O
  workflow passa a aparecer como "skipped" e não gasta minutos. Apaga a variável para voltar
  ao Actions (o `.github/workflows/nexus.yml` tem de ter a linha
  `if: vars.NEXUS_PROCESSAMENTO != 'local'`; actualiza-o com `nexus scaffold … --actualizar`).
- **No Actions:** uma correcção feita na interface (sem nada no depósito) não instala o OCR
  nem reconstrói os índices duas vezes, por isso custa pouco; o que gasta é o OCR.

## 4.2 Originais no Cloudflare R2

Com `storage.backend: r2` no `nexus.yaml` (e `storage.r2_bucket`, `storage.max_gb`), os
originais novos vão para o R2 em vez de `originais/`. O motor lê as credenciais do ambiente:

- `NEXUS_R2_ENDPOINT`, `NEXUS_R2_ACCESS_KEY_ID`, `NEXUS_R2_SECRET_ACCESS_KEY`.
- **Onde estão:** no painel da Cloudflare, *R2 → Manage R2 API Tokens → Create API token*
  (permissão *Object Read & Write*, só para o bucket). A página mostra o *Access Key ID*, o
  *Secret Access Key* (só uma vez) e o endpoint `https://<id da conta>.r2.cloudflarestorage.com`.
- **No teu computador (WSL), para o `vigiar-deposito.bat`:** acrescenta ao fim do
  `~/.bashrc` (abre com `nano ~/.bashrc`):

  ```bash
  export NEXUS_R2_ENDPOINT="https://<id da conta>.r2.cloudflarestorage.com"
  export NEXUS_R2_ACCESS_KEY_ID="<access key id>"
  export NEXUS_R2_SECRET_ACCESS_KEY="<secret access key>"
  ```

  Guarda, fecha a janela do `.bat` e abre-a de novo. Para confirmar, num terminal novo do
  Ubuntu: `env | grep NEXUS_R2` mostra as três. Sem elas, o `nexus servir` avisa ao arrancar.
- **Sem as credenciais**, os ficheiros novos ficam à espera no depósito (não vão para
  `_erros/`) e são processados quando elas existirem; o que versões anteriores mandaram para
  `_erros/` por esse motivo volta sozinho ao depósito.
- **No Actions:** cria-as como segredos do repositório de dados (*Settings → Secrets and
  variables → Actions → Secrets*); o workflow passa-as ao motor (`secrets: inherit`).
- Uma execução que não toca nos originais (ex.: uma correcção) corre sem elas.

## 4.3 Dar acesso temporário a outra pessoa

Para alguém te ajudar a organizar (cadeiras, cursos, instituições, «A rever»…) sem conta
própria no GitHub:

1. **Definições → Dar acesso temporário a outra pessoa:** escreve o nome e o prazo.
2. **Criar o token no GitHub:** a página abre já preenchida (nome, prazo e permissões). Em
   *Repository access* escolhe *Only select repositories* e o repositório de dados; depois
   *Generate token* e copia-o.
3. **Cola o token e gera o código** (`KN1-…`). Envia-o só a essa pessoa, por um canal privado.
4. A pessoa abre o site, vai a **Entrar → Recebeste um código de acesso?** e cola-o.

- Quem tem o código faz tudo o que tu fazes no site (ver, depositar, organizar), até ao fim
  do prazo. Cada alteração fica no histórico com «Feito por: <nome> (acesso temporário)».
- Para acabar antes do prazo, apaga o token em *GitHub → Settings → Developer settings →
  Personal access tokens*.
- Para uma ajuda duradoura, é melhor convidar a pessoa como colaboradora do repositório de
  dados (com a conta dela): as alterações ficam com o nome dela e retiras o acesso quando
  quiseres.

**Gerir os códigos** (Definições → «Acessos que deste», só para ti): para cada código vês o
estado, o prazo e o fim do token, e podes:

- **ver o código** outra vez (no browser onde o criaste);
- **dar mais tempo** (+1 dia, +7 dias) ou **mudar o prazo**: nunca para lá do fim do token;
  para ir além, **renova com um token novo** (gera um código novo para enviares);
- **suspender** e **reactivar**: quem tem o código sai em até 2 minutos e não volta a entrar
  enquanto estiver suspenso;
- **terminar**: deixa de entrar pela interface. Para cortar o acesso de vez, apaga também o
  token no GitHub (a interface leva-te à lista dos teus tokens);
- **juntar à lista** um código que deste antes de esta secção existir.

O registo fica em `acessos.yaml` no repositório de dados, sem os tokens (só uma impressão
SHA-256). Estes controlos valem para quem usa a interface: o token em si continua a funcionar
no GitHub até expirar ou ser apagado, porque o GitHub não deixa mudar o prazo de um token nem
apagá-lo por programa.

## 5. Claude Code sobre o repositório de dados

- Abre uma sessão do Claude Code (web ou WSL2) com o repositório de dados. O hook
  SessionStart instala o motor e as ferramentas.
- Skills disponíveis:
  - `/processar-deposito`: processa localmente (útil quando o Actions está sem minutos);
  - `/rever-classificacoes`: propõe classificações para a fila "A rever";
  - `/inferir-catalogo`: propõe a instituição, o curso e as cadeiras.

## 6. Uso local para desenvolvimento (Windows 11 + WSL2 / Ubuntu)

```bash
sudo apt install tesseract-ocr tesseract-ocr-por tesseract-ocr-eng pandoc p7zip-full \
  libreoffice-writer-nogui libreoffice-impress-nogui libreoffice-calc-nogui
curl -LsSf https://astral.sh/uv/install.sh | sh
corepack enable pnpm
./iniciar            # interface em http://localhost:5173
./iniciar verificar  # lint, tipos e testes
```
