// Criar uma cadeira à mão: grava um pedido de catálogo que o motor aplica.
// Opcionalmente já a coloca num curso (e ano), mantendo as outras cadeiras desse curso.

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle } from "../../data/types";
import { unitRef } from "../../lib/courseLinks";
import { slugify } from "../../lib/normalize";

const input = "rounded-lg border border-line-strong bg-sheet px-2 py-1 text-sm";

export function UnitCreator(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit } = useApp();
  const institutions = meta?.institutions() ?? [];
  const [institution, setInstitution] = useState(institutions[0]?.slug ?? "");
  const [name, setName] = useState("");
  const [acronym, setAcronym] = useState("");
  const [course, setCourse] = useState("");
  const [year, setYear] = useState("");
  const [semester, setSemester] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (!meta) return null;

  // Qualquer curso, também de outra instituição (os desta primeiro).
  const courses = [...meta.courses()].sort(
    (a, b) => Number(b.institution === institution) - Number(a.institution === institution),
  );
  const courseName = (c: (typeof courses)[number]) => {
    if (c.institution === institution) return c.name;
    const inst = institutions.find((i) => i.slug === c.institution);
    return `${c.name} (${inst?.acronym ?? inst?.name ?? c.institution})`;
  };
  const slug = slugify(name, 30);
  const taken = meta.units().some((u) => u.institution === institution && u.slug === slug);
  const valid = Boolean(institution && name.trim() && slug && !taken);

  async function save() {
    const inst = institutions.find((i) => i.slug === institution);
    const chosen = courses.find((c) => c.key === course);
    setBusy(true);
    setError(null);
    try {
      const existing = chosen
        ? meta!
            .courseUnits()
            .filter((l) => l.course_key === chosen.key)
            .map((l) => ({
              unit: unitRef(chosen.institution, l.unit_key),
              ...(l.curricular_year ? { curricular_year: l.curricular_year } : {}),
              ...(l.semester ? { semester: l.semester } : {}),
            }))
        : [];
      const course = chosen
        ? {
            slug: chosen.slug,
            name: chosen.name,
            ...(chosen.degree ? { degree: chosen.degree } : {}),
            units: [
              ...existing,
              {
                unit: unitRef(chosen.institution, `${institution}/${slug}`),
                ...(year ? { curricular_year: Number(year) } : {}),
                ...(semester ? { semester: Number(semester) } : {}),
              },
            ],
          }
        : null;
      const sameInstitution = !chosen || chosen.institution === institution;
      const courseInst = chosen ? institutions.find((i) => i.slug === chosen.institution) : null;
      const bundle: CatalogBundle = {
        format: "nexus-catalogo",
        version: 1,
        institutions: [
          {
            slug: institution,
            name: inst?.name ?? institution,
            units: [
              {
                slug,
                name: name.trim(),
                ...(acronym.trim() ? { acronym: acronym.trim() } : {}),
              },
            ],
            ...(course && sameInstitution ? { courses: [course] } : {}),
          },
          // O curso escolhido é de outra instituição: vai na entrada dela.
          ...(course && chosen && !sameInstitution
            ? [
                {
                  slug: chosen.institution,
                  name: courseInst?.name ?? chosen.institution,
                  courses: [course],
                },
              ]
            : []),
        ],
      };
      await source.catalogRequest(bundle, `catálogo: nova cadeira ${institution}/${slug}`);
      notifyCommit();
      props.onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (institutions.length === 0) {
    return (
      <Card title={t("unit_create.title")}>
        <p className="text-sm text-ink-soft">{t("unit_create.no_institution")}</p>
      </Card>
    );
  }

  return (
    <Card title={t("unit_create.title")}>
      <div className="space-y-3 text-sm">
        <p className="text-ink-soft">{t("unit_create.help")}</p>
        <div className="flex flex-wrap gap-3">
          <label>
            {t("unit_create.institution")}{" "}
            <select
              className={input}
              value={institution}
              onChange={(e) => {
                setInstitution(e.target.value);
                setCourse("");
              }}
            >
              {institutions.map((i) => (
                <option key={i.slug} value={i.slug}>
                  {i.acronym ?? i.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("unit_edit.name")}{" "}
            <input
              className={`${input} w-80 max-w-full`}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            {t("unit_edit.acronym")}{" "}
            <input
              className={`${input} w-24`}
              value={acronym}
              onChange={(e) => setAcronym(e.target.value)}
            />
          </label>
        </div>
        {courses.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <label>
              {t("unit_create.course")}{" "}
              <select className={input} value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="">{t("unit_create.no_course")}</option>
                {courses.map((c) => (
                  <option key={c.key} value={c.key}>
                    {courseName(c)}
                  </option>
                ))}
              </select>
            </label>
            {course && (
              <>
                <label>
                  {t("unit_create.year")}{" "}
                  <select className={input} value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">-</option>
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  {t("unit_create.semester")}{" "}
                  <select
                    className={input}
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                  >
                    <option value="">-</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </label>
              </>
            )}
          </div>
        )}
        {taken && <p className="text-clay">{t("unit_create.taken")}</p>}
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || !valid} onClick={() => void save()}>
            {t("unit_create.save")}
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
