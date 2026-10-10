// Criar e remover cursos na biblioteca. Cada acção é um pedido de catálogo que o motor
// aplica. Remover pede o nome do curso escrito à mão, para não se apagar um por engano; as
// cadeiras e os documentos ficam (só deixam de estar nesse curso).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SuggestInput } from "../../components/SuggestInput";
import { Button, Card, ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, CourseRow } from "../../data/types";
import { normalize, slugify } from "../../lib/normalize";
import { courseSuggestions, courseTitle, DEGREES, degreeOf } from "../../lib/reference";

const input = "rounded-lg border border-line-strong bg-sheet px-2 py-1 text-sm";

export function CourseCreator(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit } = useApp();
  const institutions = meta?.institutions() ?? [];
  const [institution, setInstitution] = useState(institutions[0]?.slug ?? "");
  const [degree, setDegree] = useState(DEGREES[0]?.slug ?? "licenciatura");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!meta) return null;

  if (institutions.length === 0) {
    return (
      <Card title={t("course_create.title")}>
        <p className="text-sm text-ink-soft">{t("course_create.no_institution")}</p>
      </Card>
    );
  }

  // "Mestrado em X" escrito no nome conta como o grau; o nome fica sem ele.
  const title = courseTitle(name.trim());
  const chosenDegree = degreeOf(name.trim()) ?? degree;
  const existing = meta.courses().filter((c) => c.institution === institution);
  const taken = existing.some(
    (c) => normalize(courseTitle(c.name)) === normalize(title) && (c.degree ?? "") === chosenDegree,
  );
  const valid = Boolean(institution && title && !taken);

  async function save() {
    const inst = institutions.find((i) => i.slug === institution);
    const used = new Set(existing.map((c) => c.slug));
    let slug = slugify(title, 40);
    if (used.has(slug)) slug = `${slug}-${chosenDegree}`;
    while (used.has(slug)) slug = `${slug}-2`;
    const proposal = meta!
      .proposals("open")
      .find((p) => p.kind === "course" && normalize(courseTitle(p.name)) === normalize(title));
    const bundle: CatalogBundle = {
      format: "nexus-catalogo",
      version: 1,
      institutions: [
        {
          slug: institution,
          name: inst?.name ?? institution,
          courses: [{ slug, name: title, degree: chosenDegree, units: [] }],
        },
      ],
      ...(proposal ? { proposals: { accept: [proposal.id] } } : {}),
    };
    setBusy(true);
    setError(null);
    try {
      await source.catalogRequest(bundle, `catálogo: novo curso ${institution}/${slug}`);
      notifyCommit();
      props.onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t("course_create.title")}>
      <div className="space-y-3 text-sm">
        <p className="text-ink-soft">{t("course_create.help")}</p>
        <div className="flex flex-wrap items-center gap-3">
          <label>
            {t("course_create.institution")}{" "}
            <select
              className={input}
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
            >
              {institutions.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.acronym ?? i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("course_create.degree")}{" "}
            <select className={input} value={degree} onChange={(e) => setDegree(e.target.value)}>
              {DEGREES.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("course_create.name")}{" "}
            <SuggestInput
              className={`${input} w-80 max-w-full`}
              value={name}
              suggestions={courseSuggestions(meta, degree)}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
        {taken && <p className="text-clay">{t("course_create.taken")}</p>}
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || !valid} onClick={() => void save()}>
            {t("course_create.save")}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={props.onDone}>
            {t("unit_edit.cancel")}
          </Button>
        </div>
        {error ? <ErrorBox error={error} /> : null}
        {busy && <Notice>{t("common.saving")}</Notice>}
      </div>
    </Card>
  );
}

/** O que foi escrito é o nome do curso (sem ligar a maiúsculas nem a espaços a mais). */
export function sameCourseName(typed: string, name: string): boolean {
  const clean = (value: string) => value.trim().replace(/\s+/g, " ").toLocaleLowerCase("pt");
  return clean(typed) !== "" && clean(typed) === clean(name);
}

/** Confirmação para remover um curso: só avança com o nome do curso escrito. */
export function CourseRemover(props: {
  course: CourseRow;
  institution: string;
  onCancel: () => void;
  onRemoved: () => void;
}) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const title = courseTitle(props.course.name);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await source.catalogRequest(
        { format: "nexus-catalogo", version: 1, courses_remove: [{ course: props.course.key }] },
        `catálogo: remover curso ${props.course.key}`,
      );
      notifyCommit();
      props.onRemoved();
    } catch (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div
      role="alertdialog"
      aria-label={t("course_remove.title")}
      className="space-y-3 border-b border-line bg-clay-soft/40 px-5 py-4 text-sm"
    >
      <p className="font-medium text-ink">
        {t("course_remove.warning", { name: title, institution: props.institution })}
      </p>
      <label className="block space-y-1">
        <span className="block text-ink-soft">{t("course_remove.type_name", { name: title })}</span>
        <input
          className={`${input} w-80 max-w-full`}
          aria-label={t("course_remove.type_label")}
          value={typed}
          autoComplete="off"
          onChange={(e) => setTyped(e.target.value)}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="danger"
          disabled={busy || !sameCourseName(typed, title)}
          onClick={() => void remove()}
        >
          {t("course_remove.confirm")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={props.onCancel}>
          {t("unit_edit.cancel")}
        </Button>
      </div>
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}
