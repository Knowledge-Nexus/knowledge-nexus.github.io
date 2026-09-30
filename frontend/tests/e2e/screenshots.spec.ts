// Capturas de ecrã para documentação (só corre com NEXUS_SCREENSHOTS=<pasta>).
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "@playwright/test";
import { FakeGitHub } from "../../src/data/github/fake";

const out = process.env.NEXUS_SCREENSHOTS;
test.skip(!out, "defina NEXUS_SCREENSHOTS para gerar capturas");

const snapshot = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../../test-fixtures/e2e/repo.json"), "utf-8"),
) as { main: Record<string, string>; indices: Record<string, string> };
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
  await page.goto("/");
  await page.screenshot({ path: `${out}/1-ligacao.png` });
  await page.getByLabel("Repositório de dados (dono/nome)").fill("aluna/estudo-dados");
  await page.getByLabel("Token de acesso (fine-grained)").fill(fake.token);
  await page.getByRole("button", { name: "Ligar" }).click();
  await page.getByRole("button", { name: /Análise Matemática I/ }).click();
  await page.getByText("2023-2024_exame-recurso-enunciado.pdf").waitFor();
  await page.screenshot({ path: `${out}/2-biblioteca.png` });
  await page.getByText("2023-2024_exame-recurso-enunciado.pdf").click();
  await page.locator("canvas").waitFor();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/3-documento.png` });
  await page.getByRole("link", { name: /A rever/ }).click();
  await page.getByText(/UC em falta/).waitFor();
  await page.screenshot({ path: `${out}/4-a-rever.png`, fullPage: true });
  await page.getByRole("link", { name: "Pesquisa" }).click();
  await page.getByLabel("Pesquisar no texto integral…").fill("limite sucessao");
  await page.locator("mark").first().waitFor();
  await page.screenshot({ path: `${out}/5-pesquisa.png` });
  await page.getByRole("link", { name: "Depositar" }).click();
  await page.screenshot({ path: `${out}/6-depositar.png` });
});
