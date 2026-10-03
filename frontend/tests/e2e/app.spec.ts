// E2E: a interface publicada (build + preview, com a CSP real) contra um GitHub simulado
// que serve um repositório de dados FICTÍCIO processado pelo motor Python.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  await page.goto("/#/entrar");
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
  await expect(page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf")).toBeVisible();
  await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();

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
  // Sem sessão, a entrada é a biblioteca pública.
  await page.goto("/");
  await expect(page).toHaveURL(/#\/publico$/);
  await expect(page.getByRole("heading", { name: "Material partilhado" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar", exact: true }).first()).toBeVisible();
  await expect(page.getByText("Página pública").first()).toBeVisible();
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Análise Matemática I/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Álgebra Linear/ })).toHaveCount(0);
  await page.getByRole("link", { name: /Análise Matemática I/ }).click();
  await page.getByTitle("2023-2024_exame-recurso-2024-02-05-enunciado.pdf").click();
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
  await page.getByLabel("Cadeira", { exact: true }).selectOption("ufe/fg");
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
  // Um ficheiro que já está na biblioteca (o mesmo conteúdo, com outro nome).
  const original = Object.keys(snapshot.main).find((p) => p.startsWith("originais/"))!;
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
