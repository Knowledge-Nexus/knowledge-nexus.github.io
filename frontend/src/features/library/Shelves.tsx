// Estantes da biblioteca: curso → ano → cadeiras. As cadeiras arrastam-se para os cursos:
// largar num curso junta-a a ele (sem a tirar de onde estava), largar num ano muda o ano
// dentro desse curso, e largar fora do curso de onde saiu tira-a desse curso. Cada mudança
// é um pedido de catálogo; até o índice ser reconstruído, a página mostra já o resultado.

import { type DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router";
import { ErrorBox, Notice, unitColor } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, CourseRow, UnitRow } from "../../data/types";
import { type CourseColor, courseColors } from "../../lib/courseColors";
import { normalize, slugify } from "../../lib/normalize";
import { courseTitle, degreeOf } from "../../lib/reference";
import { CourseRemover } from "./CourseManager";
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
  const [removing, setRemoving] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Um índice novo já traz as alterações: as previsões locais deixam de ser precisas.
  // biome-ignore lint/correctness/useExhaustiveDependencies: só quando o índice muda
  useEffect(() => {
    setOverrides({});
    setCreated({});
    setRemoved(new Set());
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
    ].filter((c) => !removed.has(c.key));
    // Cursos propostos pelo material, para se poder largar lá uma cadeira e criá-los.
    const institutions = meta.institutions();
    if (!readOnly && institutions.length === 1) {
      const inst = institutions[0]!;
      // "Licenciatura em Engenharia Informática" é o mesmo curso que "Engenharia Informática".
      const known = new Set(courses.map((c) => normalize(courseTitle(c.name))));
      for (const p of meta.proposals("open").filter((x) => x.kind === "course")) {
        const name = courseTitle(p.name);
        if (known.has(normalize(name))) continue;
        known.add(normalize(name));
        const slug = slugify(name, 40);
        courses.push({
          key: `${inst.slug}/${slug}`,
          institution: inst.slug,
          slug,
          name,
          degree: degreeOf(p.name),
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
  }, [meta, created, removed, readOnly]);

  if (!meta) return null;
  const institutions = meta.institutions();
  // Com mais de uma instituição, cada curso diz de qual é (pode haver nomes iguais).
  const institutionOf = (slug: string) => {
    const inst = institutions.find((i) => i.slug === slug);
    return inst?.acronym ?? inst?.name ?? slug;
  };
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
      <UnitBook unit={unit} count={stats.get(unit.key)?.filed ?? 0} subtitle={subtitle} compact />
    </div>
  );

  const looseList = loose.length > 0 && (
    <aside
      aria-label={t("library.no_course")}
      className="rounded-2xl border border-line bg-sheet/80 p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto"
    >
      <h2 className="font-serif text-lg font-semibold text-ink">{t("library.no_course")}</h2>
      {!readOnly && <p className="mb-2 text-xs text-muted">{t("shelves.loose_hint")}</p>}
      <ul className="space-y-1.5">
        {loose.map((u) => (
          <li key={u.key}>
            <LooseUnit
              unit={u}
              count={stats.get(u.key)?.filed ?? 0}
              draggable={!readOnly}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ unit: u.key, from: null }));
                e.dataTransfer.effectAllowed = "all";
              }}
            />
          </li>
        ))}
      </ul>
    </aside>
  );

  return (
    <div
      className={`grid items-start gap-6 ${loose.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_17rem]" : ""}`}
    >
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
          const { color, label } = shelf.color;
          return (
            <section
              key={key}
              onDragOver={allow(key)}
              onDrop={(e) => dropOn(e, { course: key, year: null })}
              aria-label={courseTitle(shelf.course.name)}
              className={`overflow-hidden rounded-3xl border bg-sheet/70 transition ${hover === key ? "border-gold shadow-[0_0_0_3px_var(--color-gold)]" : "border-line"}`}
            >
              <header
                className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3"
                title={label}
              >
                <h2 className="font-serif text-xl font-semibold" style={{ color }}>
                  {courseTitle(shelf.course.name)}
                </h2>
                {institutions.length > 1 && (
                  <span className="text-xs font-semibold tracking-wider text-muted uppercase">
                    {institutionOf(shelf.course.institution)}
                  </span>
                )}
                {shelf.proposalId && (
                  <span className="rounded-full bg-marker-soft px-2 py-0.5 text-xs text-ink-soft">
                    {t("shelves.proposed")}
                  </span>
                )}
                <span className="ml-auto text-xs text-muted">
                  {t("library.documents_units", { count: links.length })}
                </span>
                {!readOnly && !shelf.proposalId && removing !== key && (
                  <button
                    type="button"
                    className="text-xs text-clay hover:underline"
                    onClick={() => setRemoving(key)}
                  >
                    {t("course_remove.open")}
                  </button>
                )}
              </header>
              {removing === key && (
                <CourseRemover
                  course={shelf.course}
                  institution={institutionOf(shelf.course.institution)}
                  onCancel={() => setRemoving(null)}
                  onRemoved={() => {
                    setRemoving(null);
                    setRemoved((all) => new Set([...all, key]));
                    setSaved(true);
                  }}
                />
              )}
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
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(12rem,1fr))] gap-3">
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
      </div>
      {looseList}
    </div>
  );
}

/** Uma cadeira sem curso, em formato compacto (para arrastar para um curso). */
function LooseUnit(props: {
  unit: UnitRow;
  count: number;
  draggable: boolean;
  onDragStart: (event: DragEvent) => void;
}) {
  const { t } = useTranslation();
  const { to } = useApp();
  const { unit } = props;
  return (
    <RouterLink
      to={to(`/biblioteca?uc=${encodeURIComponent(unit.key)}`)}
      draggable={props.draggable}
      onDragStart={props.onDragStart}
      className={`flex items-stretch overflow-hidden rounded-xl border border-line bg-sheet text-sm transition hover:border-gold ${props.draggable ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <span className="w-1.5 shrink-0" style={{ backgroundColor: unitColor(unit.key) }} />
      <span className="min-w-0 flex-1 px-2.5 py-1.5">
        <span
          className="block text-[11px] font-semibold tracking-wider uppercase"
          style={{ color: unitColor(unit.key) }}
        >
          {unit.acronym ?? unit.code ?? unit.slug}
        </span>
        <span className="block truncate font-medium text-ink" title={unit.name}>
          {unit.name}
        </span>
        <span className="block text-[11px] text-muted">
          {t("library.documents", { count: props.count })}
        </span>
      </span>
    </RouterLink>
  );
}
