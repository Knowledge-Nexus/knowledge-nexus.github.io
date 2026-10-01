// Estantes da biblioteca: curso → ano → cadeiras. As cadeiras arrastam-se para os cursos:
// largar num curso junta-a a ele (sem a tirar de onde estava), largar num ano muda o ano
// dentro desse curso, e largar fora do curso de onde saiu tira-a desse curso. Cada mudança
// é um pedido de catálogo; até o índice ser reconstruído, a página mostra já o resultado.

import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ErrorBox, Notice } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, CourseRow, UnitRow } from "../../data/types";
import { type CourseColor, courseColors } from "../../lib/courseColors";
import { normalize, slugify } from "../../lib/normalize";
import { UnitBook } from "./LibraryPage";

const DRAG_TYPE = "application/x-nexus-unit";

interface Link {
  unit_key: string;
  curricular_year: number | null;
  semester: number | null;
}

interface Shelf {
  course: CourseRow;
  /** Curso proposto pelo material (ainda não existe): largar uma cadeira cria-o. */
  proposalId?: string;
  color: CourseColor;
}

type Drop = { course: string; year: number | null } | null;

const slugOf = (key: string) => key.split("/")[1] ?? key;

function bundleFor(
  institution: { slug: string; name: string },
  courses: { course: CourseRow; links: Link[] }[],
  accept: string[],
): CatalogBundle {
  return {
    format: "nexus-catalogo",
    version: 1,
    institutions: [
      {
        slug: institution.slug,
        name: institution.name,
        courses: courses.map(({ course, links }) => ({
          slug: course.slug,
          name: course.name,
          ...(course.degree ? { degree: course.degree } : {}),
          units: links.map((l) => ({
            unit: slugOf(l.unit_key),
            ...(l.curricular_year ? { curricular_year: l.curricular_year } : {}),
            ...(l.semester ? { semester: l.semester } : {}),
          })),
        })),
      },
    ],
    ...(accept.length ? { proposals: { accept } } : {}),
  };
}

export function Shelves(props: { units: UnitRow[] }) {
  const { t } = useTranslation();
  const { meta, login, source, notifyCommit, readOnly } = useApp();
  const [overrides, setOverrides] = useState<Record<string, Link[]>>({});
  const [created, setCreated] = useState<Record<string, CourseRow>>({});
  const [hover, setHover] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Um índice novo já traz as alterações: as previsões locais deixam de ser precisas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: só quando o índice muda
  useEffect(() => {
    setOverrides({});
    setCreated({});
  }, [meta]);

  // Largar fora de qualquer curso, em qualquer sítio da página, tira a cadeira do curso de
  // onde saiu. Os cursos param a propagação, por isso aqui só chega o que caiu fora deles.
  const outside = useRef<((event: globalThis.DragEvent) => void) | null>(null);
  useEffect(() => {
    if (readOnly) return;
    const over = (event: globalThis.DragEvent) => {
      if (event.dataTransfer?.types.includes(DRAG_TYPE)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }
    };
    const drop = (event: globalThis.DragEvent) => outside.current?.(event);
    window.addEventListener("dragover", over);
    window.addEventListener("drop", drop);
    return () => {
      window.removeEventListener("dragover", over);
      window.removeEventListener("drop", drop);
    };
  }, [readOnly]);

  const stats = useMemo(() => meta?.unitStats(login) ?? new Map(), [meta, login]);
  const unitMap = useMemo(() => new Map(props.units.map((u) => [u.key, u])), [props.units]);

  const shelves = useMemo<Shelf[]>(() => {
    if (!meta) return [];
    const courses: (CourseRow & { proposalId?: string })[] = [
      ...meta.courses(),
      ...Object.values(created),
    ];
    // Cursos propostos pelo material, para se poder largar lá uma cadeira e criá-los.
    const institutions = meta.institutions();
    if (!readOnly && institutions.length === 1) {
      const inst = institutions[0]!;
      const known = new Set(courses.map((c) => normalize(c.name)));
      for (const p of meta.proposals("open").filter((x) => x.kind === "course")) {
        if (known.has(normalize(p.name))) continue;
        const slug = slugify(p.name.replace(/^licenciatura em /i, ""), 40);
        courses.push({
          key: `${inst.slug}/${slug}`,
          institution: inst.slug,
          slug,
          name: p.name,
          degree: /^licenciatura/i.test(p.name) ? "licenciatura" : null,
          proposalId: p.id,
        });
      }
    }
    const colors = courseColors(courses);
    return courses.map((course) => ({
      course,
      ...(course.proposalId ? { proposalId: course.proposalId } : {}),
      color: colors.get(course.key)!,
    }));
  }, [meta, created, readOnly]);

  if (!meta) return null;
  const linksOf = (courseKey: string): Link[] =>
    overrides[courseKey] ??
    meta
      .courseUnits()
      .filter((l) => l.course_key === courseKey)
      .map((l) => ({
        unit_key: l.unit_key,
        curricular_year: l.curricular_year,
        semester: l.semester,
      }));
  const linked = new Set(shelves.flatMap((s) => linksOf(s.course.key).map((l) => l.unit_key)));
  const loose = props.units.filter((u) => !linked.has(u.key));

  async function commit(changes: { shelf: Shelf; links: Link[] }[]) {
    const first = changes[0];
    if (!first) return;
    const institution = meta!.institutions().find((i) => i.slug === first.shelf.course.institution);
    const accept = changes.flatMap((c) => (c.shelf.proposalId ? [c.shelf.proposalId] : []));
    setError(null);
    setSaved(false);
    const previous = overrides;
    setOverrides((all) => {
      const next = { ...all };
      for (const c of changes) next[c.shelf.course.key] = c.links;
      return next;
    });
    for (const c of changes) {
      if (c.shelf.proposalId) {
        const { proposalId: _, ...course } = c.shelf.course as CourseRow & { proposalId?: string };
        setCreated((all) => ({ ...all, [course.key]: course }));
      }
    }
    try {
      await source.catalogRequest(
        bundleFor(
          { slug: first.shelf.course.institution, name: institution?.name ?? "" },
          changes.map((c) => ({ course: c.shelf.course, links: c.links })),
          accept,
        ),
        `catálogo: cursos (${changes.map((c) => c.shelf.course.name).join(", ")})`,
      );
      notifyCommit();
      setSaved(true);
    } catch (err) {
      setOverrides(previous);
      setError(err);
    }
  }

  function read(event: {
    dataTransfer: DataTransfer | null;
  }): { unit: string; from: string | null } | null {
    try {
      return JSON.parse(event.dataTransfer?.getData(DRAG_TYPE) ?? "") as {
        unit: string;
        from: string | null;
      };
    } catch {
      return null;
    }
  }

  /** Largar num curso (ou num ano dele). */
  function dropOn(event: DragEvent, target: Drop) {
    event.preventDefault();
    event.stopPropagation();
    setHover(null);
    const data = read(event);
    if (!data || !target) return;
    const shelf = shelves.find((s) => s.course.key === target.course);
    const unit = unitMap.get(data.unit);
    if (!shelf || !unit) return;
    if (unit.institution !== shelf.course.institution) {
      setError(t("shelves.other_institution"));
      return;
    }
    const links = linksOf(shelf.course.key);
    const current = links.find((l) => l.unit_key === unit.key);
    const year = target.year ?? current?.curricular_year ?? null;
    if (current && current.curricular_year === year) return;
    const next = current
      ? links.map((l) => (l.unit_key === unit.key ? { ...l, curricular_year: year } : l))
      : [...links, { unit_key: unit.key, curricular_year: year, semester: null }];
    void commit([{ shelf, links: next }]);
  }

  /** Largar fora de qualquer curso: sai do curso de onde veio. */
  function dropOutside(event: globalThis.DragEvent) {
    if (!event.dataTransfer?.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    setHover(null);
    const data = read(event);
    if (!data?.from) return;
    const shelf = shelves.find((s) => s.course.key === data.from);
    if (!shelf) return;
    void commit([
      { shelf, links: linksOf(shelf.course.key).filter((l) => l.unit_key !== data.unit) },
    ]);
  }
  outside.current = dropOutside;

  const allow = (key: string) => (event: DragEvent) => {
    if (readOnly || !event.dataTransfer.types.includes(DRAG_TYPE)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    event.stopPropagation();
    if (hover !== key) setHover(key);
  };

  const book = (unit: UnitRow, from: string | null, subtitle: string) => (
    // biome-ignore lint/a11y/noStaticElementInteractions: a cadeira arrasta-se para os cursos
    <div
      key={`${from ?? "solta"}:${unit.key}`}
      draggable={!readOnly}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ unit: unit.key, from }));
        // "all": a cadeira é um link, e o browser propõe "link" como efeito por omissão.
        e.dataTransfer.effectAllowed = "all";
      }}
      onDragEnd={() => setHover(null)}
      className={readOnly ? "" : "cursor-grab active:cursor-grabbing"}
    >
      <UnitBook unit={unit} count={stats.get(unit.key)?.filed ?? 0} subtitle={subtitle} />
    </div>
  );

  return (
    <div className="space-y-10">
      {!readOnly && <p className="text-sm text-muted">{t("shelves.hint")}</p>}
      {error ? <ErrorBox error={error} /> : null}
      {saved && <Notice>{t("common.pending_sync")}</Notice>}
      {shelves.map((shelf) => {
        const key = shelf.course.key;
        const links = linksOf(key).filter((l) => unitMap.has(l.unit_key));
        const years = [...new Set(links.map((l) => l.curricular_year))].sort(
          (a, b) => (a ?? 99) - (b ?? 99),
        );
        const { color, secondary, label } = shelf.color;
        return (
          <section
            key={key}
            onDragOver={allow(key)}
            onDrop={(e) => dropOn(e, { course: key, year: null })}
            aria-label={shelf.course.name}
            className={`overflow-hidden rounded-3xl border bg-sheet/70 transition ${hover === key ? "border-gold shadow-[0_0_0_3px_var(--color-gold)]" : "border-line"}`}
          >
            <header
              className="flex flex-wrap items-center gap-3 px-5 py-3 text-white"
              style={{
                background: secondary
                  ? `linear-gradient(90deg, ${color} 0 85%, ${secondary} 85% 92%, ${color} 92%)`
                  : color,
              }}
              title={label}
            >
              <h2 className="font-serif text-xl font-semibold drop-shadow-sm">
                {shelf.course.name}
              </h2>
              {shelf.proposalId && (
                <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs">
                  {t("shelves.proposed")}
                </span>
              )}
              <span className="ml-auto text-xs opacity-90">
                {t("library.documents_units", { count: links.length })}
              </span>
            </header>
            <div className="space-y-5 p-5">
              {links.length === 0 && (
                <p className="rounded-xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
                  {t(readOnly ? "shelves.empty_readonly" : "shelves.empty")}
                </p>
              )}
              {years.map((year) => {
                const zoneKey = `${key}#${year ?? "sem-ano"}`;
                const inYear = links
                  .filter((l) => l.curricular_year === year)
                  .sort((a, b) => (a.semester ?? 9) - (b.semester ?? 9));
                return (
                  // biome-ignore lint/a11y/useSemanticElements: zona de largar, não um formulário
                  <div
                    key={zoneKey}
                    role="group"
                    aria-label={year ? t("library.year_group", { year }) : t("shelves.no_year")}
                    onDrop={(e) => dropOn(e, { course: key, year })}
                    onDragOver={allow(zoneKey)}
                    onDragLeave={() => setHover((h) => (h === zoneKey ? null : h))}
                    className={`rounded-2xl p-1 transition ${hover === zoneKey ? "ring-2 ring-gold ring-offset-4 ring-offset-paper" : ""}`}
                  >
                    <h3
                      className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"
                      style={{ color }}
                    >
                      {year ? t("library.year_group", { year }) : t("shelves.no_year")}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {inYear.map((l) =>
                        book(
                          unitMap.get(l.unit_key)!,
                          key,
                          l.semester ? t("library.semester", { semester: l.semester }) : "",
                        ),
                      )}
                    </div>
                  </div>
                );
              })}
              {!readOnly && links.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs text-muted">
                  <span>{t("shelves.year_targets")}</span>
                  {[1, 2, 3, 4, 5]
                    .filter((y) => !years.includes(y))
                    .map((y) => {
                      const zoneKey = `${key}#novo-${y}`;
                      return (
                        // biome-ignore lint/a11y/useSemanticElements: zona de largar, não um formulário
                        <span
                          key={zoneKey}
                          role="group"
                          aria-label={t("library.year_group", { year: y })}
                          onDragOver={allow(zoneKey)}
                          onDragLeave={() => setHover((h) => (h === zoneKey ? null : h))}
                          onDrop={(e) => dropOn(e, { course: key, year: y })}
                          className={`rounded-full border border-dashed px-3 py-1 ${hover === zoneKey ? "border-gold bg-marker-soft text-ink" : "border-line-strong"}`}
                        >
                          {t("library.year_group", { year: y })}
                        </span>
                      );
                    })}
                </div>
              )}
            </div>
          </section>
        );
      })}
      {loose.length > 0 && (
        <section aria-label={t("library.no_course")}>
          <h2 className="mb-3 font-serif text-xl font-semibold text-ink">
            {t("library.no_course")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loose.map((u) => book(u, null, ""))}
          </div>
        </section>
      )}
    </div>
  );
}
