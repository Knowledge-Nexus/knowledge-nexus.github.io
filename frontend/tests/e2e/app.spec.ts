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
) as { owner: string; main: Record<string, string>; indices: Record<string, string> };

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

  // Biblioteca → UC → exame arrumado
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

  // A rever: proposta de UC em falta e correcção de um documento
  await page.getByRole("link", { name: /A rever/ }).click();
  await expect(page.getByText(/UC em falta: Teoria dos Grafos Imaginários/)).toBeVisible();
  await page.getByRole("button", { name: "grafos_ficha2.pdf" }).click();
  await page.getByLabel("UC").selectOption("ufe/fg");
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
