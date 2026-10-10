// Cursos de uma cadeira: ver e editar a que curso(s) pertence, com ano e semestre.
// A alteração é um pedido de catálogo (catalogo/_importar/): o motor funde-o no próximo
// processamento. Cada curso alterado vai com a lista completa das suas cadeiras.

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SuggestInput } from "../../components/SuggestInput";
import { Badge, Button, ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, CourseRow, UnitRow } from "../../data/types";
import { unitRef } from "../../lib/courseLinks";
import { normalize, slugify } from "../../lib/normalize";
import { courseSuggestions, courseTitle, DEGREES } from "../../lib/reference";

interface Link {
  on: boolean;
  year: string;
  semester: string;
}

interface NewCourse {
  name: string;
  degree: string;
  year: string;
  semester: string;
}

export function courseLabel(
  t: (key: string, options?: Record<string, unknown>) => string,
  year: number | null,
  semester: number | null,
): string {
  return [
    year ? t("library.year_group", { year }) : null,
    semester ? t("library.semester", { semester }) : null,
  ]
    .filter(Boolean)
    .join(", ");
}

export function UnitCourses(props: { unit: UnitRow }) {
  const { t } = useTranslation();
  const { meta, source, notifyCommit, readOnly } = useApp();
  const { unit } = props;
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!meta) return null;
  // Os cursos de todas as instituições (uma cadeira pode estar em cursos de outras); os da
  // instituição da cadeira primeiro.
  const courses = [...meta.courses()].sort(
    (a, b) =>
      Number(b.institution === unit.institution) - Number(a.institution === unit.institution),
  );
  const institutions = meta.institutions();
  const label = (course: CourseRow) => {
    if (course.institution === unit.institution) return courseTitle(course.name);
    const inst = institutions.find((i) => i.slug === course.institution);
    return `${courseTitle(course.name)} (${inst?.acronym ?? inst?.name ?? course.institution})`;
  };
  const links = meta.courseUnits().filter((l) => l.unit_key === unit.key);
  const byKey = new Map(courses.map((c) => [c.key, c]));
  const current = links
    .filter((l) => byKey.has(l.course_key))
    .map((l) => ({ link: l, course: byKey.get(l.course_key)! }));

  return (
    <div className="text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted">{t("courses.label")}</span>
        {current.length === 0 && <span className="text-muted italic">{t("courses.none")}</span>}
        {current.map(({ link, course }) => {
          const detail = courseLabel(t, link.curricular_year, link.semester);
          return (
            <Badge key={course.key} tone="info">
              {label(course)}
              {detail ? ` · ${detail}` : ""}
            </Badge>
          );
        })}
        {!readOnly && !editing && (
          <button
            type="button"
            className="text-pen underline-offset-2 hover:underline"
            onClick={() => {
              setEditing(true);
              setSaved(false);
            }}
          >
            {t("courses.edit")}
          </button>
        )}
      </div>
      {saved && !editing && (
        <div className="mt-2">
          <Notice>{t("common.pending_sync")}</Notice>
        </div>
      )}
      {editing && (
        <CoursesEditor
          unit={unit}
          courses={courses}
          label={label}
          onCancel={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setSaved(true);
            notifyCommit();
          }}
          save={(bundle, message) => source.catalogRequest(bundle, message)}
        />
      )}
    </div>
  );
}

function CoursesEditor(props: {
  unit: UnitRow;
  courses: CourseRow[];
  label: (course: CourseRow) => string;
  onCancel: () => void;
  onSaved: () => void;
  save: (bundle: CatalogBundle, message: string) => Promise<string>;
}) {
  const { t } = useTranslation();
  const { meta } = useApp();
  const { unit, courses } = props;
  const allLinks = meta?.courseUnits() ?? [];
  const initial = useMemo(() => {
    const out: Record<string, Link> = {};
    for (const course of courses) {
      const link = allLinks.find((l) => l.course_key === course.key && l.unit_key === unit.key);
      out[course.key] = {
        on: Boolean(link),
        year: link?.curricular_year ? String(link.curricular_year) : "",
        semester: link?.semester ? String(link.semester) : "",
      };
    }
    return out;
  }, [courses, allLinks, unit.key]);
  const [state, setState] = useState<Record<string, Link>>(initial);
  const [added, setAdded] = useState<NewCourse[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const institution = meta?.institutions().find((i) => i.slug === unit.institution);
  const proposals = (meta?.proposals() ?? []).filter((p) => p.kind === "course");

  const patch = (key: string, value: Partial<Link>) =>
    setState((s) => ({ ...s, [key]: { ...(s[key] as Link), ...value } }));
  const patchNew = (index: number, value: Partial<NewCourse>) =>
    setAdded((all) => all.map((c, i) => (i === index ? { ...c, ...value } : c)));

  const numberOrUndefined = (v: string) => (v ? Number(v) : undefined);
  const linkOf = (ref: string, l: { year: string; semester: string }) => ({
    unit: ref,
    ...(l.year ? { curricular_year: numberOrUndefined(l.year) } : {}),
    ...(l.semester ? { semester: numberOrUndefined(l.semester) } : {}),
  });

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const changed = courses.filter((c) => {
        const a = initial[c.key];
        const b = state[c.key];
        return (
          a && b && (a.on !== b.on || (b.on && (a.year !== b.year || a.semester !== b.semester)))
        );
      });
      type BundleCourse = NonNullable<
        NonNullable<CatalogBundle["institutions"]>[number]["courses"]
      >[number];
      // Cada curso vai na entrada da instituição dele.
      const byInstitution = new Map<string, BundleCourse[]>();
      const put = (institutionSlug: string, course: BundleCourse) =>
        byInstitution.set(institutionSlug, [...(byInstitution.get(institutionSlug) ?? []), course]);
      for (const course of changed) {
        const others = allLinks
          .filter((l) => l.course_key === course.key && l.unit_key !== unit.key)
          .map((l) => ({
            unit: unitRef(course.institution, l.unit_key),
            ...(l.curricular_year ? { curricular_year: l.curricular_year } : {}),
            ...(l.semester ? { semester: l.semester } : {}),
          }));
        const mine = state[course.key] as Link;
        put(course.institution, {
          slug: course.slug,
          name: course.name,
          ...(course.degree ? { degree: course.degree } : {}),
          units: mine.on
            ? [...others, linkOf(unitRef(course.institution, unit.key), mine)]
            : others,
        });
      }
      const own = unitRef(unit.institution, unit.key);
      const used = new Set(
        courses.filter((c) => c.institution === unit.institution).map((c) => c.slug),
      );
      const accept: string[] = [];
      for (const course of added.filter((c) => c.name.trim())) {
        const title = courseTitle(course.name.trim());
        let slug = slugify(title, 40);
        while (used.has(slug)) slug = `${slug}-2`;
        used.add(slug);
        const proposal = proposals.find((p) => normalize(courseTitle(p.name)) === normalize(title));
        if (proposal) accept.push(proposal.id);
        put(unit.institution, {
          slug,
          name: title,
          ...(course.degree ? { degree: course.degree } : {}),
          units: [linkOf(own, course)],
        });
      }
      if (byInstitution.size === 0) return props.onCancel();
      const all = meta?.institutions() ?? [];
      const bundle: CatalogBundle = {
        format: "nexus-catalogo",
        version: 1,
        institutions: [...byInstitution].map(([slug, list]) => ({
          slug,
          name: all.find((i) => i.slug === slug)?.name ?? slug,
          courses: list,
        })),
        ...(accept.length ? { proposals: { accept } } : {}),
      };
      await props.save(bundle, `catálogo: cursos de ${unit.acronym ?? unit.name}`);
      props.onSaved();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const field = "rounded-lg border border-line-strong bg-sheet px-2 py-1 text-sm";
  const yearSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <select
      aria-label={label}
      className={field}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{t("courses.year_any")}</option>
      {[1, 2, 3, 4, 5, 6].map((y) => (
        <option key={y} value={y}>
          {t("library.year_group", { year: y })}
        </option>
      ))}
    </select>
  );
  const semesterSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <select
      aria-label={label}
      className={field}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{t("courses.semester_any")}</option>
      {[1, 2].map((s) => (
        <option key={s} value={s}>
          {t("library.semester", { semester: s })}
        </option>
      ))}
    </select>
  );

  return (
    <div className="mt-3 space-y-3 rounded-xl border border-line bg-paper p-3">
      <p className="text-xs text-muted">
        {t("courses.help", { institution: institution?.name ?? unit.institution })}
      </p>
      {courses.length === 0 && <p className="text-xs text-muted">{t("courses.no_courses")}</p>}
      <ul className="space-y-2">
        {courses.map((course) => {
          const link = state[course.key] as Link;
          return (
            <li key={course.key} className="flex flex-wrap items-center gap-2">
              <label className="flex min-w-0 flex-1 items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[var(--color-pen)]"
                  checked={link.on}
                  onChange={(e) => patch(course.key, { on: e.target.checked })}
                />
                <span className="truncate">{props.label(course)}</span>
              </label>
              {link.on && (
                <>
                  {yearSelect(
                    link.year,
                    (year) => patch(course.key, { year }),
                    t("setup.unit_year"),
                  )}
                  {semesterSelect(
                    link.semester,
                    (semester) => patch(course.key, { semester }),
                    t("setup.unit_semester"),
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {added.map((course, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: linhas novas ainda sem identificador
        <div key={index} className="flex flex-wrap items-center gap-2">
          <select
            aria-label={t("setup.degree")}
            className={field}
            value={course.degree}
            onChange={(e) => patchNew(index, { degree: e.target.value })}
          >
            {DEGREES.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
          <SuggestInput
            aria-label={t("courses.new_name")}
            placeholder={t("courses.new_name")}
            className={`${field} min-w-56 flex-1`}
            value={course.name}
            suggestions={courseSuggestions(meta, course.degree)}
            onChange={(e) => patchNew(index, { name: e.target.value })}
          />
          {yearSelect(course.year, (year) => patchNew(index, { year }), t("setup.unit_year"))}
          {semesterSelect(
            course.semester,
            (semester) => patchNew(index, { semester }),
            t("setup.unit_semester"),
          )}
          <button
            type="button"
            className="text-xs text-clay"
            onClick={() => setAdded((all) => all.filter((_, i) => i !== index))}
          >
            {t("setup.remove")}
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() =>
            setAdded((all) => [
              ...all,
              { name: "", degree: "licenciatura", year: "", semester: "" },
            ])
          }
        >
          {t("courses.add")}
        </Button>
        <span className="flex-1" />
        <Button variant="secondary" onClick={props.onCancel} disabled={busy}>
          {t("common.cancel")}
        </Button>
        <Button onClick={() => void submit()} disabled={busy}>
          {busy ? t("common.saving") : t("common.save")}
        </Button>
      </div>
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}
