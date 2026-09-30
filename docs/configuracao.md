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
   - preenche a instituição, o curso e as UCs;
   - ou escolhe "inferir do material".

## 3. Depositar

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

## 4. Claude Code sobre o repositório de dados

- Abre uma sessão do Claude Code (web ou WSL2) com o repositório de dados. O hook
  SessionStart instala o motor e as ferramentas.
- Skills disponíveis:
  - `/processar-deposito`: processa localmente (útil quando o Actions está sem minutos);
  - `/rever-classificacoes`: propõe classificações para a fila "A rever";
  - `/inferir-catalogo`: propõe a instituição, o curso e as UCs.

## 5. Uso local para desenvolvimento (Windows 11 + WSL2 / Ubuntu)

```bash
sudo apt install tesseract-ocr tesseract-ocr-por tesseract-ocr-eng pandoc p7zip-full \
  libreoffice-writer-nogui libreoffice-impress-nogui libreoffice-calc-nogui
curl -LsSf https://astral.sh/uv/install.sh | sh
corepack enable pnpm
./iniciar            # interface em http://localhost:5173
./iniciar verificar  # lint, tipos e testes
```
