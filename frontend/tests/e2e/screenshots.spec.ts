// Capturas de ecrã para documentação (só corre com NEXUS_SCREENSHOTS=<pasta>).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "@playwright/test";
import { FakeGitHub } from "../../src/data/github/fake";

const out = process.env.NEXUS_SCREENSHOTS;
test.skip(!out, "defina NEXUS_SCREENSHOTS para gerar capturas");

const snapshot = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../test-fixtures/e2e/repo.json"), "utf-8"),
) as {
  main: Record<string, string>;
  indices: Record<string, string>;
  publico: Record<string, string>;
};
const decode = (files: Record<string, string>) =>
  Object.fromEntries(Object.entries(files).map(([p, b]) => [p, Buffer.from(b, "base64")]));

test("capturas", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  const fake = new FakeGitHub();
  fake.addRepo("aluna/estudo-dados", decode(snapshot.main), { indices: decode(snapshot.indices) });
  await page.route("https://api.github.com/**", async (route) => {
    const r = route.request();
    const res = await fake.fetch(r.url(), {
      method: r.method(),
      headers: r.headers(),
      ...(r.postData() ? { body: r.postData()! } : {}),
    });
    await route.fulfill({
      status: res.status,
      headers: { "access-control-allow-origin": "*" },
      body: Buffer.from(await res.arrayBuffer()),
    });
  });
  const publicFiles = decode(snapshot.publico);
  await page.route("**/estudo-publico/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/estudo-publico\//, "");
    const body = publicFiles[path];
    await route.fulfill(body ? { status: 200, body } : { status: 404, body: "" });
  });
  await page.goto("/");
  await page.screenshot({ path: `${out}/1-ligacao.png` });
  await page.getByLabel("Repositório de dados (dono/nome)").fill("aluna/estudo-dados");
  await page.getByLabel("Token de acesso (fine-grained)").fill(fake.token);
  await page.getByRole("button", { name: "Ligar" }).click();
  await page.getByRole("heading", { name: /Bom dia|Boa tarde|Boa noite/ }).waitFor();
  await page.screenshot({ path: `${out}/2-inicio.png`, fullPage: true });
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await page.getByRole("heading", { name: "Biblioteca" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/2b-biblioteca.png`, fullPage: true });
  await page
    .getByRole("link", { name: /Análise Matemática I/ })
    .first()
    .click();
  await page.getByText("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").waitFor();
  await page.screenshot({ path: `${out}/2c-uc.png`, fullPage: true });
  await page.getByRole("button", { name: "Pública" }).waitFor();
  await page.screenshot({ path: `${out}/2c-uc.png`, fullPage: true });
  await page.getByText("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/3-documento.png` });
  await page.getByRole("link", { name: /A rever/ }).click();
  await page.getByText(/Cadeira em falta/).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/4-a-rever.png`, fullPage: true });
  const boxes = page.locator("ul input[type=checkbox]");
  await boxes.nth(0).check();
  await boxes.nth(1).check();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/4b-a-rever-grupo.png`, fullPage: true });
  await boxes.nth(1).uncheck();
  await page.getByRole("link", { name: "Pesquisa" }).click();
  await page.getByLabel("Procura em todo o teu material…").fill("limite sucessao");
  await page.locator("mark").first().waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/5-pesquisa.png` });
  await page.getByRole("link", { name: "Depositar" }).click();
  await page.getByRole("heading", { name: "Depositar material" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/6-depositar.png` });
  await page
    .getByRole("link", { name: /Como funciona/ })
    .first()
    .click();
  await page.getByRole("heading", { name: "Como funciona" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/9-ajuda.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Início" }).first().click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/7-movel.png`, fullPage: true });
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto("/#/publico");
  await page.getByRole("heading", { name: "Material partilhado" }).waitFor();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/8-publico.png`, fullPage: true });
});
