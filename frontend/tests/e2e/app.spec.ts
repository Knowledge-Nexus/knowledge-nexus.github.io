// E2E: a interface publicada (build + preview, com a CSP real) contra um GitHub simulado
// que serve um repositório de dados FICTÍCIO processado pelo motor Python.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, type Page, test } from "@playwright/test";
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

async function withFakeGitHub(page: Page, options: { private?: boolean } = {}) {
  const fake = new FakeGitHub();
  fake.addRepo(REPO, decode(snapshot.main), {
    private: options.private ?? true,
    indices: decode(snapshot.indices),
  });
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
  return fake;
}

async function login(page: Page, fake: FakeGitHub) {
  await page.goto("/");
  await page.getByLabel("Repositório de dados (dono/nome)").fill(REPO);
  await page.getByLabel("Token de acesso (fine-grained)").fill(fake.token);
  await page.getByRole("button", { name: "Ligar" }).click();
}

test("recusa um repositório de dados público", async ({ page }) => {
  const fake = await withFakeGitHub(page, { private: false });
  await login(page, fake);
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
  await expect(page.getByText("2023-2024_exame-recurso-enunciado.pdf")).toBeVisible();
  await page.getByText("2023-2024_exame-recurso-enunciado.pdf").click();

  // Documento: classificação explicada + PDF renderizado pelo pdf.js
  await expect(page.getByText("Enunciados de avaliação")).toBeVisible();
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
  await page.getByLabel("Cadeira").selectOption("ufe/fg");
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
  await page.getByRole("link", { name: "Depositar" }).click();
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
  await page.getByText("2023-2024_exame-recurso-resolucao.pdf").click();
  const select = page.getByRole("combobox", { name: "Visibilidade" });
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
  await page.goto("/");
  await page.getByRole("link", { name: "Ver o material público" }).click();
  await expect(page.getByRole("heading", { name: "Material partilhado" })).toBeVisible();
  await expect(page.getByText("Página pública").first()).toBeVisible();
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Análise Matemática I/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Álgebra Linear/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Análise Matemática I/ }).click();
  await page.getByText("2023-2024_exame-recurso-enunciado.pdf").click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("link", { name: "Corrigir classificação" })).toHaveCount(0);
  await expect(page.getByText("Notas pessoais")).toHaveCount(0);
  await page.getByRole("link", { name: "Pesquisa" }).click();
  await page.getByLabel("Procura em todo o material partilhado…").fill("sucessao");
  await expect(page.locator("mark").first()).toBeVisible();
  await page.getByLabel("Procura em todo o material partilhado…").fill("matrizes");
  await expect(page.getByText(/0 resultado\(s\)|Sem resultados/)).toBeVisible();
  expect(apiCalls).toBe(0);
  expect(errors).toEqual([]);
});

test("criar de uma vez as cadeiras propostas", async ({ page }) => {
  const fake = await withFakeGitHub(page);
  await login(page, fake);
  await page.getByRole("link", { name: /A rever/ }).click();
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
