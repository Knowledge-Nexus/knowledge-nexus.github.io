// E2E: a interface publicada (build + preview, com a CSP real) contra um GitHub simulado
// que serve um repositório de dados FICTÍCIO processado pelo motor Python.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, type Locator, type Page, test } from "@playwright/test";
import YAML from "yaml";
import { FakeGitHub } from "../../src/data/github/fake";

const REPO = "aluna/estudo-dados";
const snapshot = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../test-fixtures/e2e/repo.json"), "utf-8"),
) as {
  owner: string;
  main: Record<string, string>;
  indices: Record<string, string>;
  publico: Record<string, string>;
};

const decode = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([p, b64]) => [p, Buffer.from(b64, "base64")]));

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "*",
  "access-control-allow-methods": "GET, POST, PATCH, PUT, OPTIONS",
  "access-control-expose-headers": "*",
};

// O Worker (originais no R2 e contas) é o verdadeiro, com uma D1 em memória (node:sqlite) e o
// GitHub simulado por trás: as contas testam-se de ponta a ponta, sem rede.
const WORKER_URL = "https://nexus-ficheiros.nightmareftw.workers.dev";
const workerFile = (path: string) =>
  pathToFileURL(resolve(import.meta.dirname, "../../../worker", path)).href;
type WorkerHandle = (
  request: Request,
  env: Record<string, unknown>,
  fetchImpl: (url: string, init?: RequestInit) => Promise<Response>,
) => Promise<Response>;
const workerEnvs = new WeakMap<FakeGitHub, Record<string, unknown>>();

async function workerEnv(fake: FakeGitHub) {
  const existing = workerEnvs.get(fake);
  if (existing) return existing;
  const { fakeD1 } = await import(workerFile("test/d1.mjs"));
  const { resetGitHubCache } = await import(workerFile("src/github.js"));
  resetGitHubCache();
  const env = {
    DB: fakeD1(),
    DATA_REPOS: REPO,
    ALLOWED_ORIGINS: "http://localhost:4173",
    GITHUB_TOKEN: fake.token,
    BUCKET: {
      head: async () => null,
      get: async () => null,
      put: async () => {},
      list: async () => ({ objects: [], truncated: false }),
    },
  };
  workerEnvs.set(fake, env);
  return env;
}

async function routeWorker(page: Page, fake: FakeGitHub) {
  const { handle } = (await import(workerFile("src/index.js"))) as { handle: WorkerHandle };
  const env = await workerEnv(fake);
  await page.route(`${WORKER_URL}/**`, async (route) => {
    const request = route.request();
    const body = request.postDataBuffer();
    const response = await handle(
      new Request(request.url(), {
        method: request.method(),
        headers: request.headers(),
        ...(body && !["GET", "HEAD"].includes(request.method())
          ? { body: new Uint8Array(body) }
          : {}),
      }),
      env,
      (url, init) => fake.fetch(String(url), init),
    );
    await route.fulfill({
      status: response.status,
      headers: Object.fromEntries(response.headers),
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

async function withFakeGitHub(page: Page, options: { private?: boolean } = {}) {
  const fake = new FakeGitHub();
  fake.addRepo(REPO, decode(snapshot.main), {
    private: options.private ?? true,
    indices: decode(snapshot.indices),
  });
  await routeGitHub(page, fake);
  return fake;
}

/** O GitHub simulado e o Worker para uma página (outra pessoa, noutro browser). */
async function routeGitHub(page: Page, fake: FakeGitHub) {
  await routeWorker(page, fake);
  await page.route("https://api.github.com/**", async (route) => {
    const request = route.request();
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    const body = request.postData();
    const response = await fake.fetch(request.url(), {
      method: request.method(),
      headers: request.headers(),
      ...(body ? { body } : {}),
    });
    await route.fulfill({
      status: response.status,
      headers: {
        ...CORS,
        "content-type": response.headers.get("content-type") ?? "application/octet-stream",
      },
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

async function login(page: Page, fake: FakeGitHub, options: { refused?: boolean } = {}) {
  await page.goto("/#/entrar");
  await page.getByLabel("Repositório de dados (dono/nome)").fill(REPO);
  await page.getByLabel("Token de acesso (fine-grained)").fill(fake.token);
  await page.getByRole("button", { name: "Ligar" }).click();
  if (options.refused) return;
  // Espera a sessão abrir: sem ela, «Biblioteca» no menu leva à biblioteca pública, e numa
  // máquina lenta (CI) o clique seguinte ainda acontecia no ecrã de entrada.
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible({
    timeout: 20_000,
  });
}

test("recusa um repositório de dados público", async ({ page }) => {
  const fake = await withFakeGitHub(page, { private: false });
  await login(page, fake, { refused: true });
  await expect(page.getByRole("alert")).toContainText("PÚBLICO");
});

test("biblioteca, documento, pesquisa e revisão", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Content Security Policy/i.test(msg.text()))
      errors.push(msg.text());
  });
  const fake = await withFakeGitHub(page);
  await login(page, fake);

  // Biblioteca → cadeira → exame arrumado
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await expect(page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf")).toBeVisible();
  await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
  await expect(page).toHaveURL(/#\/documento\//);

  // Documento: classificação explicada + PDF renderizado pelo pdf.js
  await expect(page.getByText("Enunciados de avaliação").first()).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(() =>
      page.locator("canvas").evaluate((canvas) => {
        if (!(canvas instanceof HTMLCanvasElement)) return false;
        const context = canvas.getContext("2d");
        if (!context) return false;
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        return pixels.some((value, index) => index % 4 !== 3 && value < 245);
      }),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Rodar para a direita" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.getByRole("button", { name: "Texto" }).click();
  await expect(page.getByText(/Calcule o limite da sucessão/)).toBeVisible();

  // Pesquisa sem acentos e com a grafia AO90 encontra o texto pré-AO
  await page.getByRole("link", { name: "Pesquisa" }).click();
  await page.getByLabel("Procura em todo o teu material…").fill("sucessao");
  await expect(page.getByText(/resultado\(s\)/)).toBeVisible();
  await expect(page.locator("mark").first()).toBeVisible();
  await page.getByLabel("Procura em todo o teu material…").fill("ano letivo");
  await expect(page.locator("mark").first()).toBeVisible();

  // A rever: proposta de cadeira em falta e correcção de um documento
  await page.getByRole("link", { name: /A rever/ }).click();
  await expect(page.getByText(/Cadeira em falta: Teoria dos Grafos Imaginários/)).toBeVisible();
  await page.getByRole("button", { name: "grafos_ficha2.pdf" }).click();
  await page.getByLabel("Cadeira", { exact: true }).selectOption("ufe/fg");
  await page.getByLabel("Tipo").selectOption("fichas-exercicios");
  await page.getByRole("button", { name: "Confirmar e arrumar" }).click();
  await expect(page.getByText("Correcção enviada.")).toBeVisible();

  const repo = fake.repos.get(REPO)!;
  const commit = repo.commits.at(-1)!;
  expect(commit.message).toContain("revisão");
  const path = commit.paths[0]!;
  const record = YAML.parse(fake.text(REPO, path)!);
  expect(record.classification.unit).toMatchObject({ value: "ufe/fg", method: "user" });
  expect(record.review.status).toBe("resolved");
  expect(errors).toEqual([]);
});

test("depositar ficheiros cria um único commit no depósito", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await page
    .getByRole("navigation", { name: "principal" })
    .getByRole("link", { name: "Depositar" })
    .click();
  await expect(page.getByTestId("pick-files")).toBeAttached({ timeout: 30_000 });
  await page.getByTestId("pick-files").setInputFiles([
    { name: "resumo_fg.txt", mimeType: "text/plain", buffer: Buffer.from("Física Geral: energia") },
    { name: "Thumbs.db", mimeType: "application/octet-stream", buffer: Buffer.from("x") },
  ]);
  await expect(page.getByText("lixo do sistema (ignorado)")).toBeVisible();
  await page.getByRole("button", { name: "Enviar 1 ficheiro(s)" }).click();
  await expect(page.getByText(/Enviado\./)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths).toHaveLength(1);
  expect(commit.paths[0]).toMatch(/^deposito\/aluna\/\d{8}T\d{6}Z-[a-z0-9]{4}\/resumo_fg\.txt$/);
});

test("escolher a visibilidade de uma cadeira e de um documento", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Física Geral/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Pública" }).click();
  await expect(page.getByText(/Vais tornar isto público/)).toBeVisible();
  await page.getByRole("button", { name: "Tornar público" }).click();
  await expect(page.getByText(/A página pública é actualizada/)).toBeVisible();
  const user = YAML.parse(fake.text(REPO, "utilizadores/aluna.yaml")!);
  expect(user.sharing.units).toEqual({ "ufe/am1": "public", "ufe/fg": "public" });
  expect(user.preferences.tutor_mode).toBe(true);

  // Documento de uma cadeira pública (AM1): excepção "só eu"
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page.getByTitle("2023-2024_exame-recurso-resolucao.pdf").click();
  const select = page.getByRole("combobox", { name: "Visibilidade", exact: true });
  await expect(select).toHaveValue("inherit");
  for (const future of ["users", "link"])
    await expect(select.locator(`option[value="${future}"]`)).toHaveAttribute("disabled", "");
  await select.selectOption("private");
  await expect(page.getByText(/A página pública é actualizada/)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  const record = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(record.visibility).toBe("private");
});

test("visitante vê só o material público, sem token", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const files = decode(snapshot.publico);
  let apiCalls = 0;
  await page.route("https://api.github.com/**", (route) => {
    apiCalls += 1;
    return route.abort();
  });
  await page.route("**/estudo-publico/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/estudo-publico\//, "");
    const body = files[path];
    if (!body) return route.fulfill({ status: 404, body: "" });
    await route.fulfill({ status: 200, body });
  });
  // Sem o Worker das contas: só «Tenho um código» e «Administrador» no canto.
  await page.route(`${WORKER_URL}/**`, (route) => route.abort());
  // Sem sessão, a entrada é a página de apresentação, com o material público à vista.
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /O teu material de estudo/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Administrador" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Tenho um código" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Criar conta" })).toHaveCount(0);
  await page.getByRole("link", { name: "Ver o material público" }).click();
  await expect(page).toHaveURL(/#\/publico$/);
  await expect(page.getByRole("heading", { name: "Material partilhado" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar", exact: true }).first()).toBeVisible();
  await expect(page.getByText("Página pública").first()).toBeVisible();
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Análise Matemática I/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Álgebra Linear/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Análise Matemática I/ }).click();
  // O banco de perguntas também é público (o enunciado é público), sem botões para verificar.
  await page.getByRole("tab", { name: "Perguntas (3)" }).click();
  await expect(page.getByText(/^1\. Enuncie o teorema de Bolzano/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar" })).toHaveCount(0);
  await page.getByRole("tab", { name: "Material" }).click();
  await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("link", { name: "Corrigir classificação" })).toHaveCount(0);
  await expect(page.getByText("Notas pessoais")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Editar:/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mudar o nome" })).toHaveCount(0);
  // Quem visita também lê e marca, mas as marcas ficam só no seu browser.
  await page.getByRole("button", { name: "Ler", exact: true }).click();
  const reader = page.getByRole("dialog", { name: "Modo de leitura" });
  await expect(reader.locator("[data-page='1'] canvas")).toBeVisible();
  await reader.getByRole("button", { name: /^Caneta/ }).click();
  const sheet = (await reader.locator("[data-page='1']").boundingBox())!;
  await page.mouse.move(sheet.x + sheet.width * 0.3, sheet.y + sheet.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(sheet.x + sheet.width * 0.5, sheet.y + sheet.height * 0.55, { steps: 6 });
  await page.mouse.up();
  await reader.getByRole("button", { name: /Sair do modo de leitura/ }).click();
  await expect(reader).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(localStorage).some((key) => key.startsWith("nexus.marcas.publico.")),
      ),
    )
    .toBe(true);
  await page.getByRole("link", { name: "Pesquisa" }).click();
  await page.getByLabel("Procura em todo o material partilhado…").fill("sucessao");
  await expect(page.locator("mark").first()).toBeVisible();
  await page.getByLabel("Procura em todo o material partilhado…").fill("matrizes");
  await expect(page.getByText(/0 resultado\(s\)|Sem resultados/)).toBeVisible();
  expect(apiCalls).toBe(0);
  expect(errors).toEqual([]);
});

test("banco de perguntas: tal e qual do enunciado, ver no original e verificar", async ({
  page,
}) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  const exam = Object.entries(snapshot.main)
    .filter(([p]) => p.startsWith("documentos/"))
    .map(([, b64]) => YAML.parse(Buffer.from(b64, "base64").toString("utf-8")))
    .find((d) => d.sources?.[0]?.path.endsWith("Exame_Normal_2023-24.pdf"));
  const path = `gerado/${exam.blob.sha256}/perguntas.yaml`;
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  // O material fica como estava; o separador das perguntas aparece porque há perguntas.
  await expect(page.getByRole("tab", { name: "Material" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.getByRole("tab", { name: "Perguntas (3)" }).click();
  await expect(page).toHaveURL(/ver=perguntas/);
  const first = page.getByRole("listitem", { name: "Pergunta 1" });
  await expect(
    first.getByText("1. Enuncie o teorema de Bolzano e explique o seu significado geométrico."),
  ).toBeVisible();
  // Sem etiqueta de IA: o texto é o do ficheiro, e cada pergunta leva à página do original.
  await expect(first.getByText("Do enunciado")).toBeVisible();
  await expect(page.getByText(/Gerado por IA/)).toHaveCount(0);
  await expect(first.getByRole("link", { name: "Ver no original (p. 1)" })).toHaveAttribute(
    "href",
    new RegExp(`/documento/${exam.id}\\?pagina=1$`),
  );

  // Confirmar a 1 e rejeitar a 3: um commit cada, no ficheiro das perguntas.
  await first.getByRole("button", { name: "Confirmar" }).click();
  await expect(first.getByText("Verificada")).toBeVisible();
  expect(YAML.parse(fake.text(REPO, path)!).questions[0].review).toMatchObject({
    status: "confirmed",
    by: "aluna",
  });
  const third = page.getByRole("listitem", { name: "Pergunta 3" });
  await third.getByRole("button", { name: "Rejeitar" }).click();
  await expect(third.getByText("Rejeitada: não se mostra")).toBeVisible();
  expect(YAML.parse(fake.text(REPO, path)!).questions[2].review.status).toBe("rejected");
  expect(fake.repos.get(REPO)!.commits.at(-1)!.message).toContain("perguntas: rejeitar a 3");
  await third.getByRole("button", { name: "Repor" }).click();
  await expect.poll(() => YAML.parse(fake.text(REPO, path)!).questions[2].review).toBeUndefined();
  // As que faltam (a 2 e a 3) confirmam-se de uma vez, num só commit.
  const commits = fake.repos.get(REPO)!.commits.length;
  await page.getByRole("button", { name: "Confirmar todas (2)" }).click();
  await expect(third.getByText("Verificada")).toBeVisible();
  await expect(
    page.getByRole("listitem", { name: "Pergunta 2" }).getByText("Verificada"),
  ).toBeVisible();
  expect(fake.repos.get(REPO)!.commits.length).toBe(commits + 1);
  expect(fake.repos.get(REPO)!.commits.at(-1)!.message).toContain(
    "perguntas: confirmar 2 perguntas",
  );
  const reviews = YAML.parse(fake.text(REPO, path)!).questions.map(
    (q: { review?: { status: string } }) => q.review?.status,
  );
  expect(reviews).toEqual(["confirmed", "confirmed", "confirmed"]);

  // Da página do enunciado chega-se às perguntas dele; em «A rever», as que faltam verificar.
  await page.goto(`/#/documento/${exam.id}`);
  await page.getByRole("link", { name: /3 perguntas deste enunciado/ }).click();
  await expect(page.getByRole("tab", { name: "Perguntas (3)" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page
    .getByRole("navigation", { name: "principal" })
    .getByRole("link", { name: /A rever/ })
    .click();
  await page.getByText("Perguntas por verificar (3)").click();
  await expect(page.getByText("3 por verificar")).toBeVisible();
});

test("criar de uma vez as cadeiras propostas", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await page
    .getByRole("link", { name: /A rever/ })
    .first()
    .click();
  await expect(page.getByText(/Cadeira em falta: Teoria dos Grafos Imaginários/)).toBeVisible();
  await expect(
    page.getByText(/Criar Universidade Fictícia de Exemplo com as cadeiras/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Criar tudo" }).click();
  await expect(page.getByText(/Pedido enviado/)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths[0]).toMatch(/^catalogo\/_importar\//);
  const request = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(request.institutions[0].slug).toBe("ufe");
  expect(request.institutions[0].units[0].name).toBe("Teoria dos Grafos Imaginários");
  expect(request.proposals.accept).toContain("unit-teoria-dos-grafos-imaginarios");
});

test("confirmar vários documentos de uma vez em «A rever»", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await page
    .getByRole("link", { name: /A rever/ })
    .first()
    .click();
  // O conjunto «Projecteis» aparece como um item (o código segue o enunciado).
  await expect(page.locator("ul input[type=checkbox]")).toHaveCount(3);
  await page.getByRole("checkbox", { name: "grafos_ficha2.pdf" }).check();
  await page.getByRole("checkbox", { name: "trabalho-p1" }).check();
  await expect(page.getByText("Confirmar 2 documentos de uma vez")).toBeVisible();
  // A sugestão de cada um vê-se numa tabela, sem abrir os documentos um a um.
  const table = page.getByRole("table", { name: "Sugestão de cada documento" });
  await expect(table.getByRole("row")).toHaveCount(3);
  await expect(table.getByRole("rowheader", { name: "grafos_ficha2.pdf" })).toBeVisible();
  await expect(page.getByText(/^Sugestões:/)).toHaveCount(6);
  await page.getByLabel("Cadeira", { exact: true }).selectOption("ufe/fg");
  await expect(table.getByText("Física Geral (FG)")).toHaveCount(2);
  await expect(page.getByText(/^Sugestões:/)).toHaveCount(5);
  await page.getByRole("button", { name: "Confirmar 2 documentos" }).click();
  await expect(page.getByText(/2 documentos confirmados/)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths).toHaveLength(2);
  for (const path of commit.paths) {
    const record = YAML.parse(fake.text(REPO, path)!);
    expect(record.classification.unit).toMatchObject({ value: "ufe/fg", method: "user" });
    expect(record.review.status).toBe("resolved");
  }
});

test("caixote do lixo em «A rever»: remover, desfazer e repor", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page
    .getByRole("link", { name: /A rever/ })
    .first()
    .click();
  const items = page.locator("ul input[type=checkbox]");
  await expect(items).toHaveCount(3);
  await page.getByRole("button", { name: "grafos_ficha2.pdf" }).click();
  await page.getByRole("button", { name: "Remover este ficheiro" }).click();
  const dialog = page.getByRole("alertdialog", { name: "Remover da biblioteca" });
  await expect(dialog).toContainText("Remover «grafos_ficha2.pdf»?");
  await expect(dialog).toContainText("O original continua guardado");
  await dialog.getByRole("button", { name: "Remover" }).click();
  // Sai logo da lista (antes de o índice ser reconstruído) e passa ao seguinte.
  await expect(page.getByText(/Removeste grafos_ficha2\.pdf/)).toBeVisible();
  await expect(items).toHaveCount(2);
  // O número no menu também desconta logo.
  const badge = page.getByRole("navigation", { name: "principal" }).getByRole("link", {
    name: /A rever/,
  });
  await expect(badge).toContainText("3");
  const removal = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(removal.paths).toHaveLength(1);
  const path = removal.paths[0]!;
  expect(path).toMatch(/^documentos\//);
  expect(YAML.parse(fake.text(REPO, path)!).removed).toMatchObject({ by: "aluna" });

  // Desfazer: o campo sai e o ficheiro volta à lista.
  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(items).toHaveCount(3);
  expect(YAML.parse(fake.text(REPO, path)!)).not.toHaveProperty("removed");

  // Um conjunto sai inteiro: o enunciado e o código que o segue.
  await page.getByRole("button", { name: /Trabalho_pratico_1/ }).click();
  await page.getByRole("button", { name: "Remover este ficheiro" }).click();
  await expect(dialog).toContainText("Saem também 1 ficheiro(s)");
  await dialog.getByRole("button", { name: "Remover" }).click();
  await expect(items).toHaveCount(2);
  expect(fake.repos.get(REPO)!.commits.at(-1)!.paths).toHaveLength(2);

  // «Removidos»: o que já tinha ido para o lixo; repõe-se na página do documento.
  await page.getByText("Removidos (1)").click();
  await page.getByRole("link", { name: "rascunho_velho.pdf" }).click();
  await expect(page.getByText(/Removeste este ficheiro/)).toBeVisible();
  await expect(page.getByText("Removido", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Repor" }).click();
  await expect(page.getByText(/Reposto\./)).toBeVisible();
  const restore = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(restore.message).toMatch(/^repor: rascunho_velho\.pdf/);
  expect(YAML.parse(fake.text(REPO, restore.paths[0]!)!)).not.toHaveProperty("removed");
});

test("remover um ficheiro na página dele, com confirmação, e repô-lo", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  const doc = Object.entries(snapshot.main)
    .filter(([p]) => p.startsWith("documentos/"))
    .map(([, b64]) => YAML.parse(Buffer.from(b64, "base64").toString("utf-8")))
    .find((d) => d.blob.ext === "pdf" && !d.removed && !d.duplicate_of && d.filed_name);
  await page.goto(`/#/documento/${doc.id}`);
  const commits = fake.repos.get(REPO)!.commits.length;
  await page.getByRole("button", { name: "Remover", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Remover este ficheiro?" });
  await expect(dialog).toContainText("O original continua guardado");
  // Cancelar não muda nada.
  await dialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(dialog).toBeHidden();
  expect(fake.repos.get(REPO)!.commits.length).toBe(commits);

  await page.getByRole("button", { name: "Remover", exact: true }).click();
  await dialog.getByRole("button", { name: "Remover" }).click();
  await expect(page.getByText(/Removeste este ficheiro/)).toBeVisible();
  await expect(page.getByText("Removido", { exact: true })).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  const path = commit.paths.find((p) => p.includes(doc.id))!;
  expect(YAML.parse(fake.text(REPO, path)!).removed).toMatchObject({ by: "aluna" });

  // Na cadeira já não aparece; «Repor» na página dele trá-lo de volta.
  await page.getByRole("link", { name: "Biblioteca", exact: true }).first().click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await expect(page.getByRole("heading", { name: /Análise Matemática I/ }).first()).toBeVisible();
  await expect(page.locator(`a[href$="/documento/${doc.id}"]`)).toHaveCount(0);
  await page.goto(`/#/documento/${doc.id}`);
  await page.getByRole("button", { name: "Repor" }).click();
  await expect(page.getByRole("button", { name: "Remover", exact: true })).toBeVisible();
  expect(YAML.parse(fake.text(REPO, path)!)).not.toHaveProperty("removed");
});

test("tipo de material público, selecção e descarga em zip", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /Descarregar tudo/ })).toBeVisible();

  // Um tipo de material inteiro fica público, com confirmação.
  page.once("dialog", (dialog) => void dialog.accept());
  const typeSelect = page.getByRole("combobox", { name: "Visibilidade deste tipo de material" });
  await typeSelect.first().selectOption("public");
  await expect
    .poll(
      () =>
        Object.keys(YAML.parse(fake.text(REPO, "utilizadores/aluna.yaml")!).sharing?.types ?? {})
          .length,
    )
    .toBe(1);
  const types = YAML.parse(fake.text(REPO, "utilizadores/aluna.yaml")!).sharing.types;
  expect(Object.keys(types)[0]).toMatch(/^ufe\/am1::/);
  expect(Object.values(types)).toEqual(["public"]);

  // Selecção de documentos e descarga num zip.
  await page
    .getByRole("checkbox", { name: /^Seleccionar todos/ })
    .first()
    .check();
  await expect(page.getByText(/seleccionado\(s\)/)).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Descarregar", exact: true }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/\.zip$/);
});

test("editar os cursos de uma cadeira", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Editar cursos" }).click();
  // Sai do curso actual e entra num curso novo (com sugestões ao escrever).
  await page.getByRole("checkbox", { name: /Engenharia Informática/ }).uncheck();
  await page.getByRole("button", { name: "Acrescentar curso" }).click();
  await page.getByLabel("Nome do curso").fill("Licenciatura em Matemática");
  await page.getByLabel("Ano", { exact: true }).last().selectOption("1");
  await page.getByLabel("Semestre", { exact: true }).last().selectOption("2");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByText(/biblioteca é actualizada/)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths[0]).toMatch(/^catalogo\/_importar\//);
  const bundle = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  const [institution] = bundle.institutions;
  expect(institution.units).toBeUndefined();
  const lei = institution.courses.find((c: { slug: string }) => c.slug === "lei");
  const units = lei.units.map((u: { unit: string }) => u.unit);
  expect(units).not.toContain("am1");
  expect(units).toEqual(expect.arrayContaining(["alga", "p1", "fg", "bd"]));
  const novo = institution.courses.find(
    (c: { name: string }) => c.name === "Matemática", // sem o grau no nome
  );
  expect(novo.units).toEqual([{ unit: "am1", curricular_year: 1, semester: 2 }]);
});

test("conjuntos: o código segue o enunciado e juntar ficheiros à mão", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await page
    .getByRole("link", { name: /A rever/ })
    .first()
    .click();
  await expect(page.getByText("+ 1 do conjunto «Projecteis»")).toBeVisible();
  await page.getByRole("button", { name: /Trabalho_pratico_1_2023-24\.pdf/ }).click();
  await expect(page.getByText(/Este é o principal do conjunto «Projecteis»/)).toBeVisible();
  // Os ficheiros do conjunto estão à vista; acrescenta-se um, retira-se outro.
  await expect(page.getByText("Ficheiros do conjunto (2)")).toBeVisible();
  await expect(page.getByRole("link", { name: "projectil.py" })).toBeVisible();
  await page.getByLabel("Acrescentar um ficheiro ao conjunto").fill("grafos");
  await page.getByRole("button", { name: "Acrescentar", exact: true }).click();
  await expect(page.getByText("Ficheiros do conjunto (3)")).toBeVisible();
  await page
    .getByRole("listitem")
    .filter({ hasText: "projectil.py" })
    .getByRole("button", {
      name: "Retirar",
    })
    .click();
  await page
    .getByRole("listitem")
    .filter({ hasText: "grafos_ficha2.pdf" })
    .getByRole("button", { name: "Tornar principal" })
    .click();
  await page.getByRole("button", { name: "Guardar conjunto" }).click();
  await expect(page.getByText(/biblioteca é actualizada/)).toBeVisible();
  const edit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(edit.paths).toHaveLength(3);
  const records = edit.paths.map((p) => YAML.parse(fake.text(REPO, p)!));
  const kept = records.filter((r) => r.bundle);
  expect(kept).toHaveLength(2);
  expect(kept.every((r) => r.bundle.method === "user" && r.bundle.name === "Projecteis")).toBe(
    true,
  );
  const grafos = kept.find((r) => r.sources[0].path === "grafos_ficha2.pdf");
  expect(kept.every((r) => r.bundle.lead_choice === grafos.id)).toBe(true);
  const out = records.find((r) => !r.bundle);
  expect(out.bundle_dismissed).toBe(true);
  expect(out.sources[0].path).toBe("FG/Projecteis/projectil.py");

  // Juntar dois ficheiros num conjunto (com nome).
  await page.getByRole("checkbox", { name: "grafos_ficha2.pdf" }).check();
  await page.getByRole("checkbox", { name: "trabalho-p1" }).check();
  page.once("dialog", (dialog) => void dialog.accept("Trabalho de grafos"));
  await page.getByRole("button", { name: "Juntar num conjunto" }).click();
  await expect(page.getByText(/Conjunto criado/)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths).toHaveLength(2);
  const bundles = commit.paths.map((p) => YAML.parse(fake.text(REPO, p)!).bundle);
  expect(bundles[0]).toMatchObject({ name: "Trabalho de grafos", method: "user" });
  expect(bundles[1].id).toBe(bundles[0].id);
});

/** Arrastar e largar com eventos HTML5 (o mesmo DataTransfer em todos os passos): o
 * arrastar com o rato do Playwright é instável quando a página tem de deslocar. */
async function dragAndDrop(page: Page, source: Locator, target: Locator) {
  const data = await page.evaluateHandle(() => new DataTransfer());
  await source.dispatchEvent("dragstart", { dataTransfer: data });
  await target.dispatchEvent("dragenter", { dataTransfer: data });
  await target.dispatchEvent("dragover", { dataTransfer: data });
  await target.dispatchEvent("drop", { dataTransfer: data });
  // A cadeira pode já ter mudado de sítio (e o elemento de origem ter desaparecido).
  await source.dispatchEvent("dragend", { dataTransfer: data }, { timeout: 1000 }).catch(() => {});
}

test("arrastar cadeiras entre cursos e anos", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  const lei = page.getByRole("region", { name: "Engenharia Informática" });
  await expect(lei.getByRole("group", { name: "1.º ano" })).toBeVisible({ timeout: 20_000 });
  await expect(lei.getByRole("group", { name: "2.º ano" })).toBeVisible();

  // Arrastar AM1 para o 3.º ano (dentro do mesmo curso).
  const am1 = lei.getByRole("link", { name: /Análise Matemática I/ });
  await dragAndDrop(page, am1, lei.getByRole("group", { name: "3.º ano" }));
  await expect(page.getByText(/biblioteca é actualizada/)).toBeVisible();
  let bundle = YAML.parse(fake.text(REPO, fake.repos.get(REPO)!.commits.at(-1)!.paths[0]!)!);
  let units = bundle.institutions[0].courses[0].units;
  expect(units.find((u: { unit: string }) => u.unit === "am1")).toMatchObject({
    curricular_year: 3,
  });
  await expect(
    lei.getByRole("group", { name: "3.º ano" }).getByText("Análise Matemática I"),
  ).toBeVisible();

  // Arrastar BD para fora do curso: sai do curso e vai para "Sem curso".
  await dragAndDrop(
    page,
    lei.getByRole("link", { name: /Bases de Dados/ }),
    page.getByRole("heading", { name: "Biblioteca" }),
  );
  await expect(
    page.getByRole("complementary", { name: "Sem curso" }).getByText("Bases de Dados"),
  ).toBeVisible();
  bundle = YAML.parse(fake.text(REPO, fake.repos.get(REPO)!.commits.at(-1)!.paths[0]!)!);
  units = bundle.institutions[0].courses[0].units.map((u: { unit: string }) => u.unit);
  expect(units).not.toContain("bd");
  expect(units).toContain("am1");
});

test("depositar: as cópias são detectadas logo e não são enviadas", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  await page
    .getByRole("navigation", { name: "principal" })
    .getByRole("link", { name: "Depositar" })
    .click();
  // Um ficheiro que já está na biblioteca (o mesmo conteúdo, com outro nome). Um que foi para
  // o caixote do lixo não conta: enviá-lo outra vez é a maneira de o repor.
  const removed = Object.entries(snapshot.main)
    .filter(([p]) => p.startsWith("documentos/"))
    .map(([, b64]) => YAML.parse(Buffer.from(b64, "base64").toString("utf-8")))
    .filter((record) => record.removed)
    .map((record) => String(record.blob.sha256));
  expect(removed).toHaveLength(1);
  const original = Object.keys(snapshot.main).find(
    (p) => p.startsWith("originais/") && !removed.some((sha) => p.includes(sha)),
  )!;
  const existing = Buffer.from(snapshot.main[original]!, "base64");
  const texto = Buffer.from("Física Geral: energia cinética e potencial");
  await page.getByTestId("pick-files").setInputFiles([
    { name: "resumo.txt", mimeType: "text/plain", buffer: texto },
    { name: "resumo (1).txt", mimeType: "text/plain", buffer: texto },
    { name: "outro-nome.bin", mimeType: "application/octet-stream", buffer: existing },
  ]);
  await expect(page.getByText("2 cópia(s) não vão ser enviadas.")).toBeVisible();
  await expect(page.getByText("igual a resumo.txt")).toBeVisible();
  await expect(page.getByText("já na biblioteca (não enviada)")).toBeVisible();
  await page.getByRole("button", { name: "Enviar 1 ficheiro(s)" }).click();
  await expect(page.getByText(/Enviado\./)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths).toHaveLength(1);
  expect(commit.paths[0]).toMatch(/\/resumo\.txt$/);
});

test("arrastar um documento para outro tipo", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  const groups = page.getByRole("group").filter({ has: page.getByRole("checkbox") });
  await expect(groups.nth(1)).toBeVisible({ timeout: 20_000 });
  const target = groups.nth(1);
  const label = (await target.getAttribute("aria-label")) ?? "";
  const doc = groups.first().locator("[draggable=true]").first();
  await dragAndDrop(page, doc, target);
  await expect(page.getByText(`Tipo alterado para «${label}»`, { exact: false })).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  const record = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(record.classification.document_type.method).toBe("user");
});

test("editar e remover uma cadeira", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Editar cadeira" }).click();
  await page.getByLabel("Sigla", { exact: true }).fill("AM I");
  await page.getByLabel("Acrescentar nomes alternativos").fill("Análise I, Cálculo I");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText(/actualiza|sincroniz/i).first()).toBeVisible();
  let commit = fake.repos.get(REPO)!.commits.at(-1)!;
  let request = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(request.institutions[0].units[0]).toMatchObject({
    slug: "am1",
    acronym: "AM I",
    aliases: ["Análise I", "Cálculo I"],
  });

  await page.getByRole("button", { name: "Editar cadeira" }).click();
  await page.getByLabel("Os documentos dela passam para:").selectOption({ index: 1 });
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: "Remover cadeira" }).click();
  await expect(page.getByRole("button", { name: "Remover cadeira" })).toBeHidden();
  commit = fake.repos.get(REPO)!.commits.at(-1)!;
  request = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(request.units_remove[0].unit).toBe("ufe/am1");
  expect(request.units_remove[0].merge_into).toBeTruthy();
});

test("criar e remover um curso (com o nome escrito para confirmar)", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  const lei = page.getByRole("region", { name: "Engenharia Informática" });
  await expect(lei).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Novo curso" }).click();
  await page.getByRole("combobox", { name: /^Grau/ }).selectOption("mestrado");
  await page.getByLabel("Nome do curso").fill("Ciência de Dados");
  await page.getByRole("button", { name: "Criar curso" }).click();
  await expect(page.getByRole("button", { name: "Criar curso" })).toBeHidden();
  let commit = fake.repos.get(REPO)!.commits.at(-1)!;
  let request = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(request.institutions[0].courses[0]).toMatchObject({
    name: "Ciência de Dados",
    degree: "mestrado",
    units: [],
  });

  await lei.getByRole("button", { name: "Remover curso" }).click();
  const confirm = lei.getByRole("alertdialog", { name: "Remover curso" });
  const remove = confirm.getByRole("button", { name: "Remover curso" });
  await expect(remove).toBeDisabled();
  await confirm.getByLabel("Nome do curso, para confirmar").fill("Engenharia");
  await expect(remove).toBeDisabled();
  await confirm.getByLabel("Nome do curso, para confirmar").fill("engenharia informática");
  await remove.click();
  await expect(lei).toBeHidden();
  commit = fake.repos.get(REPO)!.commits.at(-1)!;
  request = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(request.courses_remove).toEqual([{ course: "ufe/lei" }]);
  // As cadeiras ficam: passam para «Sem curso».
  await expect(
    page.getByRole("complementary", { name: "Sem curso" }).getByText("Bases de Dados"),
  ).toBeVisible();
});

test("modo de leitura: as marcas são só de quem as faz e o original fica igual", async ({
  page,
}) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
  await page.getByRole("button", { name: "Ler", exact: true }).click();
  const reader = page.getByRole("dialog", { name: "Modo de leitura" });
  await expect(reader.locator("[data-page='1'] canvas")).toBeVisible();
  const marks = reader.locator("[data-page] svg path");

  await reader.getByRole("button", { name: /^Marcador/ }).click();
  const sheet = (await reader.locator("[data-page='1']").boundingBox())!;
  await page.mouse.move(sheet.x + sheet.width * 0.2, sheet.y + sheet.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(sheet.x + sheet.width * 0.7, sheet.y + sheet.height * 0.21, { steps: 10 });
  await page.mouse.up();
  await expect(marks).toHaveCount(1);

  // «Ver o original» esconde as marcas (e desliga as ferramentas); desfazer e refazer.
  await reader.getByRole("button", { name: /Ver o original/ }).click();
  await expect(marks).toHaveCount(0);
  await expect(reader.getByText("Original, sem as tuas marcas")).toBeVisible();
  await reader.getByRole("button", { name: /Ver com as tuas marcas/ }).click();
  await reader.getByRole("button", { name: /Desfazer/ }).click();
  await expect(marks).toHaveCount(0);
  await reader.getByRole("button", { name: /Refazer/ }).click();
  await expect(marks).toHaveCount(1);

  // Sair grava: um commit só com o ficheiro das marcas desta pessoa.
  await page.keyboard.press("Escape");
  await expect(reader).toBeHidden();
  await expect
    .poll(() => fake.repos.get(REPO)!.commits.at(-1)?.message ?? "")
    .toContain("marcas de leitura");
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.paths).toEqual([expect.stringMatching(/^anotacoes\/aluna\/[0-9a-f-]+\.json$/)]);
  const file = JSON.parse(fake.text(REPO, commit.paths[0]!)!);
  expect(file.pages["1"]).toHaveLength(1);
  expect(file.pages["1"][0]).toMatchObject({ kind: "highlight", color: "yellow" });
  await expect(page.getByText("1 marca numa página.")).toBeVisible();

  // Lápis na página do documento: o número da prova e o nome.
  await page.getByRole("button", { name: "Editar: Número" }).click();
  const number = page.getByRole("form", { name: "Editar: Número" });
  await number.getByRole("spinbutton").fill("2");
  await number.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("a actualizar")).toBeVisible();
  let record = YAML.parse(fake.text(REPO, fake.repos.get(REPO)!.commits.at(-1)!.paths[0]!)!);
  expect(record.classification.assessment_number).toMatchObject({ value: 2, method: "user" });

  await page.getByRole("button", { name: "Mudar o nome" }).click();
  const title = page.getByRole("form", { name: "Mudar o nome" });
  await title.getByLabel("Nome", { exact: true }).fill("Exame de recurso de AM1");
  await title.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { name: "Exame de recurso de AM1" })).toBeVisible();
  record = YAML.parse(fake.text(REPO, fake.repos.get(REPO)!.commits.at(-1)!.paths[0]!)!);
  expect(record.classification.title).toMatchObject({
    value: "Exame de recurso de AM1",
    method: "user",
  });
});

test("lápis na biblioteca: o nome de um curso e de uma cadeira", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  const lei = page.getByRole("region", { name: "Engenharia Informática" });
  await expect(lei).toBeVisible({ timeout: 20_000 });
  await lei
    .getByRole("button", { name: /Mudar o nome ou o grau de «Engenharia Informática»/ })
    .click();
  const form = lei.getByRole("form", { name: "Mudar o curso" });
  await form.getByLabel("Nome do curso").fill("Engenharia Informática e de Computadores");
  await form.getByRole("button", { name: "Guardar" }).click();
  await expect(form).toBeHidden();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  const request = YAML.parse(fake.text(REPO, commit.paths[0]!)!);
  // Sem `units`: as cadeiras do curso ficam como estão.
  expect(request.institutions[0].courses).toHaveLength(1);
  expect(request.institutions[0].courses[0]).toMatchObject({
    slug: "lei",
    name: "Engenharia Informática e de Computadores",
  });
  expect(request.institutions[0].courses[0]).not.toHaveProperty("units");

  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: /Mudar o nome, a sigla ou os nomes alternativos/ })
    .click();
  await expect(page.getByRole("button", { name: "Remover cadeira" })).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).first().click();

  // Cada ficheiro tem o seu lápis: o nome muda ali mesmo, sem abrir o documento.
  await page
    .getByRole("button", { name: /^Mudar o nome de «/ })
    .first()
    .click();
  const rename = page.getByRole("form", { name: /^Mudar o nome de «/ });
  await rename.getByLabel(/^Novo nome de /).fill("Exame de recurso (versão final)");
  await rename.getByRole("button", { name: "Guardar" }).click();
  await expect(rename).toBeHidden();
  await expect(page.getByText("Exame de recurso (versão final)")).toBeVisible();
  const renamed = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(renamed.paths).toHaveLength(1);
  expect(YAML.parse(fake.text(REPO, renamed.paths[0]!)!).classification.title).toMatchObject({
    value: "Exame de recurso (versão final)",
    method: "user",
  });
});

test.describe("PDF num ecrã de alta densidade", () => {
  test.use({ deviceScaleFactor: 2 });

  test("a página cabe inteira no canvas (a densidade não é aplicada duas vezes)", async ({
    page,
  }) => {
    const fake = await withFakeGitHub(page);
    await login(page, fake);
    await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
    await page
      .getByRole("link", { name: /Análise Matemática I/ })
      .first()
      .click();
    await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
    await expect(page.locator("canvas")).toBeVisible();
    // Fracção da largura do canvas até onde vai o texto: ~0,67 quando a página cabe toda;
    // com a densidade aplicada duas vezes, o texto passava a borda (1,0) e era cortado.
    const right = () =>
      page.locator("canvas").evaluate((element) => {
        const canvas = element as HTMLCanvasElement;
        const pixels = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height);
        if (!pixels) return 0;
        let max = 0;
        for (let i = 0; i < pixels.data.length; i += 4) {
          if ((pixels.data[i] ?? 255) < 200) max = Math.max(max, (i / 4) % canvas.width);
        }
        return max / canvas.width;
      });
    await expect.poll(right).toBeGreaterThan(0.3);
    expect(await right()).toBeLessThan(0.85);
  });
});

test("contas: níveis de acesso, convite e suspensão", async ({ page, browser }) => {
  const fake = await withFakeGitHub(page);
  const env = await workerEnv(fake);
  // Uma pessoa cria conta: fica à espera, a ver o material público.
  await page.goto("/");
  await page.getByRole("button", { name: "Criar conta" }).click();
  const signUp = page.getByRole("dialog", { name: "Criar conta" });
  await signUp.getByLabel("Nome").fill("Rita");
  await signUp.getByLabel("Email").fill("rita@exemplo.pt");
  await signUp.getByLabel("Palavra-passe").fill("segredo-longo");
  await signUp.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Olá, Rita: a tua conta está criada.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver o material público" })).toBeVisible();

  // Só o dono vê a lista das contas. Dá à Rita o nível mais baixo (Observador), com a
  // descrição de cada nível à vista, e cria um convite de Organizador para a Joana.
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await routeGitHub(owner, fake);
  await login(owner, fake);
  await owner.getByRole("link", { name: "Definições" }).first().click();
  await expect(owner.getByText("Os níveis de acesso")).toBeVisible();
  await expect(owner.getByText(/Não descarrega: os botões de descarga não aparecem/)).toBeVisible();
  const rita = owner.getByRole("listitem", { name: "Rita" });
  await expect(rita.getByRole("combobox", { name: "Nível a dar a Rita" })).toHaveValue("viewer");
  await rita.getByRole("button", { name: "Dar acesso" }).click();
  await expect(owner.getByRole("combobox", { name: "Nível de Rita" })).toHaveValue("viewer");
  await owner.getByRole("combobox", { name: "Nível", exact: true }).selectOption("organizer");
  await owner.getByLabel("Para quem (opcional)").fill("Joana");
  await owner.getByRole("button", { name: "Criar convite" }).click();
  const link = await owner.getByLabel("Ligação do convite").inputValue();
  expect(link).toMatch(/#\/convite\/KNC-/);

  // A Rita (Observador) entra: vê a biblioteca e os documentos, sem descarregar, com o nome
  // dela por cima das páginas; não deposita nem revê.
  const pdf = Object.entries(snapshot.main)
    .filter(([p]) => p.startsWith("documentos/"))
    .map(([, b64]) => YAML.parse(Buffer.from(b64, "base64").toString("utf-8")))
    .find((d) => d.blob.ext === "pdf" && !d.removed && !d.duplicate_of && d.filed_name);
  await page.reload();
  await expect(page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  const nav = page.getByRole("navigation", { name: "principal" });
  await expect(nav.getByRole("link", { name: "Depositar" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: /A rever/ })).toHaveCount(0);
  await expect(page.getByText("Rita · estudo-dados")).toBeVisible();
  await expect(page.getByText("Observador", { exact: true })).toBeVisible();
  await page.goto(`/#/documento/${pdf.id}`);
  await expect(page.locator("canvas").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Descarregar original" })).toHaveCount(0);
  await expect(page.locator('[style*="image/svg+xml"]').first()).toBeAttached();
  await nav.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: /Descarregar tudo/ })).toHaveCount(0);

  // O dono muda-a para Leitor: passa a descarregar (a sessão recarrega sozinha com o nível).
  await owner.getByRole("combobox", { name: "Nível de Rita" }).selectOption("reader");
  await expect(owner.getByRole("combobox", { name: "Nível de Rita" })).toHaveValue("reader");
  await page.goto(`/#/documento/${pdf.id}`);
  await page.reload();
  await expect(page.getByRole("button", { name: "Descarregar original" })).toBeVisible();
  await expect(page.locator('[style*="image/svg+xml"]')).toHaveCount(0);

  // A Joana abre o convite, cria conta e entra logo como Organizadora.
  const joanaContext = await browser.newContext();
  const joana = await joanaContext.newPage();
  await routeGitHub(joana, fake);
  await joana.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  const invited = joana.getByRole("dialog", { name: "Criar conta" });
  await expect(invited.getByText("Este convite dá-te o nível: Organizador")).toBeVisible();
  await invited.getByLabel("Nome").fill("Joana");
  await invited.getByLabel("Email").fill("joana@exemplo.pt");
  await invited.getByLabel("Palavra-passe").fill("outro-segredo");
  await invited.getByRole("button", { name: "Criar conta" }).click();
  await expect(joana.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();
  // O que faz vai por um commit com o nome dela (escrito pelo Worker, não pela interface).
  await joana
    .getByRole("navigation", { name: "principal" })
    .getByRole("link", { name: /A rever/ })
    .click();
  await joana.getByRole("button", { name: "grafos_ficha2.pdf" }).click();
  await joana.getByRole("button", { name: "Remover este ficheiro" }).click();
  await joana.getByRole("alertdialog").getByRole("button", { name: "Remover" }).click();
  await expect(joana.getByText(/Removeste grafos_ficha2\.pdf/)).toBeVisible();
  const commit = fake.repos.get(REPO)!.commits.at(-1)!;
  expect(commit.message).toContain("Feito por: Joana (conta joana@exemplo.pt)");
  expect(commit.branch).toBe("main");
  // Arruma, mas não escolhe o que é público.
  await joana.goto(`/#/documento/${pdf.id}`);
  await expect(joana.getByRole("button", { name: "Descarregar original" })).toBeVisible();
  await expect(joana.getByRole("heading", { name: "Visibilidade", exact: true })).toHaveCount(0);

  // Suspensa pelo dono, a Rita deixa de ver a biblioteca (o Worker recusa logo).
  await owner.reload();
  await owner
    .getByRole("listitem", { name: "Rita" })
    .getByRole("button", { name: "Suspender" })
    .click();
  await expect(
    owner.getByRole("listitem", { name: "Rita" }).getByText("suspensa", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText(/suspendeu o teu acesso/)).toBeVisible();
  const db = env.DB as { raw: { prepare: (sql: string) => { get: () => unknown } } };
  expect(db.raw.prepare("SELECT count(*) AS n FROM users").get()).toEqual({ n: 2 });
  await ownerContext.close();
  await joanaContext.close();
});

test("Gestor: gere as contas até Editor, sem os códigos de acesso", async ({ page, browser }) => {
  const fake = await withFakeGitHub(page);
  await workerEnv(fake);
  // O Rui cria conta e fica à espera.
  await page.goto("/");
  await page.getByRole("button", { name: "Criar conta" }).click();
  const signUp = page.getByRole("dialog", { name: "Criar conta" });
  await signUp.getByLabel("Nome").fill("Rui");
  await signUp.getByLabel("Email").fill("rui@exemplo.pt");
  await signUp.getByLabel("Palavra-passe").fill("segredo-longo");
  await signUp.getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByText("Olá, Rui: a tua conta está criada.")).toBeVisible();

  // O dono convida a Marta como Gestora.
  const ownerContext = await browser.newContext();
  const owner = await ownerContext.newPage();
  await routeGitHub(owner, fake);
  await login(owner, fake);
  await owner.getByRole("link", { name: "Definições" }).first().click();
  await expect(owner.getByText(/ainda gere as contas/).first()).toBeVisible();
  await owner.getByRole("combobox", { name: "Nível", exact: true }).selectOption("manager");
  await owner.getByRole("button", { name: "Criar convite" }).click();
  const link = await owner.getByLabel("Ligação do convite").inputValue();

  const martaContext = await browser.newContext();
  const marta = await martaContext.newPage();
  await routeGitHub(marta, fake);
  await marta.goto(link.replace(/^https?:\/\/[^/]+/, ""));
  const invited = marta.getByRole("dialog", { name: "Criar conta" });
  await expect(invited.getByText("Este convite dá-te o nível: Gestor")).toBeVisible();
  await invited.getByLabel("Nome").fill("Marta");
  await invited.getByLabel("Email").fill("marta@exemplo.pt");
  await invited.getByLabel("Palavra-passe").fill("outro-segredo");
  await invited.getByRole("button", { name: "Criar conta" }).click();
  await expect(marta.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ })).toBeVisible();

  // Nas Definições, a Marta vê as contas: dá acesso ao Rui, mas o nível Gestor não é opção,
  // a conta dela fica com o dono e os códigos de acesso não aparecem.
  await marta.getByRole("link", { name: "Definições" }).first().click();
  await expect(marta.getByText(/Como Gestor, dás acesso a quem pede/)).toBeVisible();
  const rui = marta.getByRole("listitem", { name: "Rui" });
  const give = rui.getByRole("combobox", { name: "Nível a dar a Rui" });
  await expect(give.locator("option")).toHaveText([
    "Observador",
    "Leitor",
    "Colaborador",
    "Organizador",
    "Editor",
  ]);
  await give.selectOption("editor");
  await rui.getByRole("button", { name: "Dar acesso" }).click();
  await expect(marta.getByRole("combobox", { name: "Nível de Rui" })).toHaveValue("editor");
  await expect(
    marta.getByRole("listitem", { name: "Marta" }).getByText(/só o dono do material muda/),
  ).toBeVisible();
  await expect(marta.getByRole("combobox", { name: "Nível de Marta" })).toHaveCount(0);
  await expect(marta.getByRole("heading", { name: "Acessos que deste" })).toHaveCount(0);
  await ownerContext.close();
  await martaContext.close();
});

test("acesso temporário: o dono cria um código e outra pessoa entra com ele", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Definições" }).first().click();
  await page.getByLabel("Nome de quem recebe o acesso").fill("Ana");
  await expect(page.getByRole("link", { name: /Criar o token no GitHub/ })).toHaveAttribute(
    "href",
    /expires_in=7.*contents=write/,
  );
  await page.getByLabel("Cola aqui o token criado").fill(fake.token);
  await page.getByRole("button", { name: "Gerar o código" }).click();
  const code = await page.getByLabel("Código de acesso").inputValue();
  expect(code.startsWith("KN1-")).toBe(true);

  // Outra pessoa (sem sessão) entra com o código.
  await page.getByRole("button", { name: "Terminar sessão" }).first().click();
  await page.goto("/#/?entrar=codigo");
  await page.getByRole("dialog").getByLabel("Código de acesso").fill(code);
  await page.getByRole("button", { name: "Entrar com o código" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Acesso temporário de Ana" }),
  ).toBeVisible();

  // O que grava fica com o nome dela.
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Editar cadeira" }).click();
  await page.getByLabel("Sigla", { exact: true }).fill("AM I");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect
    .poll(() => fake.repos.get(REPO)!.commits.at(-1)?.message ?? "")
    .toContain("Feito por: Ana (acesso temporário)");
});

test("os códigos de acesso vêem-se em qualquer browser onde o dono entre", async ({
  page,
  browser,
}) => {
  const fake = await withFakeGitHub(page);
  fake.readOnlyTokens.add("token-da-ana");
  await login(page, fake);
  await page.getByRole("link", { name: "Definições" }).first().click();
  await page.getByRole("radio", { name: /Só ver e descarregar/ }).check();
  await page.getByLabel("Nome de quem recebe o acesso").fill("Ana");
  await page.getByLabel("Cola aqui o token criado").fill("token-da-ana");
  await page.getByRole("button", { name: "Gerar o código" }).click();
  const code = await page.getByLabel("Código de acesso").inputValue();
  await expect(page.getByText(/Os códigos ficam guardados no servidor das contas/)).toBeVisible();

  // Noutro browser (sem nada guardado), o dono vê o mesmo código.
  const other = await (await browser.newContext()).newPage();
  await routeGitHub(other, fake);
  await login(other, fake);
  await other.getByRole("link", { name: "Definições" }).first().click();
  const row = other.getByRole("listitem", { name: "Ana" });
  await row.getByRole("button", { name: "Ver código" }).click();
  await expect(row.getByLabel("Código de Ana")).toHaveValue(code);
  // Na base de dados das contas está cifrado; no repositório, nunca.
  const env = await workerEnv(fake);
  const db = env.DB as {
    raw: { prepare: (sql: string) => { get: () => { code: string; n: number }; run: () => void } };
  };
  expect(db.raw.prepare("SELECT code FROM access_codes").get().code).not.toContain("KN1-");
  expect(fake.text(REPO, "acessos.yaml")).not.toContain(code);

  // Um código feito antes (só no browser onde foi criado) sobe quando o dono abre as
  // Definições nesse browser.
  db.raw.prepare("DELETE FROM access_codes").run();
  await page.reload();
  await expect(page.getByText(/Os códigos ficam guardados no servidor das contas/)).toBeVisible();
  await expect.poll(() => db.raw.prepare("SELECT count(*) AS n FROM access_codes").get().n).toBe(1);
});

test("código «só ver e descarregar»: vê e descarrega tudo, não muda nada", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  fake.readOnlyTokens.add("token-so-leitura");
  await login(page, fake);
  await page.getByRole("link", { name: "Definições" }).first().click();
  await page.getByRole("radio", { name: /Só ver e descarregar/ }).check();
  await page.getByLabel("Nome de quem recebe o acesso").fill("Rui");
  const tokenLink = page.getByRole("link", { name: /Criar o token no GitHub/ });
  await expect(tokenLink).toHaveAttribute("href", /contents=read/);
  await expect(tokenLink).not.toHaveAttribute("href", /contents=write|actions=/);
  // Um token que pode escrever é recusado: o «só ver» tem de vir do próprio GitHub.
  await page.getByLabel("Cola aqui o token criado").fill(fake.token);
  await page.getByRole("button", { name: "Gerar o código" }).click();
  await expect(page.getByText(/Esse token pode alterar o repositório/)).toBeVisible();
  await page.getByLabel("Cola aqui o token criado").fill("token-so-leitura");
  await page.getByRole("button", { name: "Gerar o código" }).click();
  const code = await page.getByLabel("Código de acesso").inputValue();
  expect(code.startsWith("KN1-")).toBe(true);
  const registry = YAML.parse(fake.text(REPO, "acessos.yaml")!);
  expect(registry.accesses[0]).toMatchObject({ name: "Rui", scope: "read" });

  // Rui entra com o código: vê tudo, nada para mudar.
  await page.getByRole("button", { name: "Terminar sessão" }).first().click();
  await page.goto("/#/?entrar=codigo");
  await page.getByRole("dialog").getByLabel("Código de acesso").fill(code);
  await page.getByRole("button", { name: "Entrar com o código" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Acesso só para ver e descarregar de Rui" }),
  ).toBeVisible();
  const commits = fake.repos.get(REPO)!.commits.length;
  const nav = page.getByRole("navigation", { name: "principal", exact: true });
  await expect(nav.getByRole("link", { name: "Depositar" })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: /A rever/ })).toHaveCount(0);
  await nav.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page.getByRole("button", { name: "Novo curso" })).toHaveCount(0);
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Editar cadeira" })).toHaveCount(0);
  await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("button", { name: /^Editar:/ })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mudar o nome" })).toHaveCount(0);
  await expect(page.getByText("Notas pessoais")).toHaveCount(0);
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descarregar original" }).click();
  expect((await download).suggestedFilename()).toBe("Exame_Recurso_2023-24.pdf");

  // As marcas ficam só no browser dele; as páginas de mudar o material não abrem.
  await page.getByRole("button", { name: "Ler", exact: true }).click();
  const reader = page.getByRole("dialog", { name: "Modo de leitura" });
  await expect(reader.locator("[data-page='1'] canvas")).toBeVisible();
  await reader.getByRole("button", { name: /^Caneta/ }).click();
  const sheet = (await reader.locator("[data-page='1']").boundingBox())!;
  await page.mouse.move(sheet.x + sheet.width * 0.3, sheet.y + sheet.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(sheet.x + sheet.width * 0.5, sheet.y + sheet.height * 0.55, { steps: 6 });
  await page.mouse.up();
  await reader.getByRole("button", { name: /Sair do modo de leitura/ }).click();
  await expect
    .poll(() =>
      page.evaluate(() => Object.keys(localStorage).some((k) => k.includes("convidados/rui"))),
    )
    .toBe(true);
  await page.goto("/#/depositar");
  await expect(page).toHaveURL(/#\/biblioteca/);
  expect(fake.repos.get(REPO)!.commits.length).toBe(commits);
});

test("gerir os acessos: suspender, reactivar e terminar um código", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: "Definições" }).first().click();
  await page.getByLabel("Nome de quem recebe o acesso").fill("Ana");
  // Um código novo também pode ser permanente: o token pedido ao GitHub não tem prazo.
  await page
    .getByRole("combobox", { name: "Durante" })
    .selectOption({ label: "Sem prazo (permanente)" });
  await expect(page.getByRole("link", { name: /Criar o token no GitHub/ })).toHaveAttribute(
    "href",
    /expires_in=none/,
  );
  await page.getByRole("combobox", { name: "Durante" }).selectOption({ label: "7 dias" });
  await page.getByLabel("Cola aqui o token criado").fill(fake.token);
  await page.getByRole("button", { name: "Gerar o código" }).click();
  const code = await page.getByLabel("Código de acesso").inputValue();

  // Fica na lista, com o código guardado neste browser; o registo não leva o token.
  const row = page.getByRole("listitem", { name: "Ana" });
  await expect(row.getByText("activo")).toBeVisible();
  await row.getByRole("button", { name: "Ver código" }).click();
  await expect(row.getByLabel("Código de Ana")).toHaveValue(code);
  const registry = () => fake.text(REPO, "acessos.yaml") ?? "";
  expect(registry()).toContain("name: Ana");
  expect(registry()).not.toContain(fake.token);

  // Mudar o nome: no registo e no código guardado (o mesmo token, o código antigo serve).
  await row.getByRole("button", { name: "Mudar o nome de «Ana»" }).click();
  await row.getByLabel("Nome de quem recebeu o código").fill("Ana Sofia");
  await row.getByRole("button", { name: "Guardar" }).click();
  await expect(row.getByText("Ana Sofia", { exact: true })).toBeVisible();
  expect(YAML.parse(registry()).accesses[0].name).toBe("Ana Sofia");
  const renamed = await row.getByLabel("Código de Ana Sofia").inputValue();
  expect(renamed).not.toBe(code);

  await row.getByRole("button", { name: "+7 dias" }).click();
  // Sem prazo: o token (simulado) também não tem fim, por isso fica permanente.
  await row.getByRole("button", { name: "Tornar permanente" }).click();
  await expect(row.getByText("permanente", { exact: true })).toBeVisible();
  await expect(row.getByRole("button", { name: "+7 dias" })).toHaveCount(0);
  expect(YAML.parse(registry()).accesses[0].until).toBeNull();
  await row.getByRole("button", { name: "Suspender" }).click();
  await expect(row.getByText("suspenso")).toBeVisible();
  expect(registry()).toContain("status: paused");

  // Com o acesso suspenso, o código não entra.
  await page.getByRole("button", { name: "Terminar sessão" }).first().click();
  await page.goto("/#/?entrar=codigo");
  await page.getByRole("dialog").getByLabel("Código de acesso").fill(code);
  await page.getByRole("button", { name: "Entrar com o código" }).click();
  await expect(page.getByText(/O teu acesso foi suspenso/)).toBeVisible();

  // Reactivado, entra outra vez.
  await login(page, fake);
  await page.getByRole("link", { name: "Definições" }).first().click();
  await page
    .getByRole("listitem", { name: "Ana" })
    .getByRole("button", { name: "Reactivar" })
    .click();
  await expect(page.getByRole("listitem", { name: "Ana" }).getByText("activo")).toBeVisible();
  await page.getByRole("button", { name: "Terminar sessão" }).first().click();
  await page.goto("/#/?entrar=codigo");
  await page.getByRole("dialog").getByLabel("Código de acesso").fill(code);
  await page.getByRole("button", { name: "Entrar com o código" }).click();
  // Entrou com o código antigo, mas vê o nome novo.
  await expect(
    page.getByRole("status").filter({ hasText: "Acesso temporário de Ana Sofia" }),
  ).toBeVisible();

  // Terminado pelo dono, quem está dentro sai na verificação seguinte (aqui, ao recarregar).
  const main = fake.repos.get(REPO)!.branches.main!;
  main["acessos.yaml"] = Buffer.from(registry().replace("status: active", "status: revoked"));
  await page.reload();
  await expect(page.getByText(/O teu acesso terminou/)).toBeVisible();
});
