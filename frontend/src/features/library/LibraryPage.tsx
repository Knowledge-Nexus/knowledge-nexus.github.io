import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { FileGlyph, IconArrowRight } from "../../components/icons";
import { Badge, Card, Empty, ErrorBox, PageHeader, Spinner, unitColor } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow, UnitRow } from "../../data/types";
import { useLabels } from "../../lib/labels";

export function DocumentLink(props: { doc: DocumentRow; showUnit?: boolean }) {
  const { t } = useTranslation();
  const { meta } = useApp();
  const labels = useLabels(meta);
  const { doc } = props;
  return (
    <Link
      to={`/documento/${doc.id}`}
      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-paper"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-paper text-ink-soft group-hover:bg-sheet">
        <FileGlyph ext={doc.ext} kind={doc.kind} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{doc.display_name}</span>
        {props.showUnit && (
          <span className="block truncate text-xs text-muted">
            {doc.unit ? labels.unit(doc.unit) : t("library.no_unit")}
            {doc.document_type ? ` · ${labels.term("document_types", doc.document_type)}` : ""}
          </span>
        )}
      </span>
      <span className="flex shrink-0 gap-1">
        {doc.academic_year && <Badge>{doc.academic_year}</Badge>}
        {doc.needs_review && <Badge tone="warn">{t("nav.review")}</Badge>}
      </span>
    </Link>
  );
}

/** Uma UC apresentada como um livro: lombada de cor, sigla e nome. */
export function UnitBook(props: { unit: UnitRow; count: number; subtitle?: string }) {
  const { t } = useTranslation();
  const { unit } = props;
  const color = unitColor(unit.key);
  return (
    <Link
      to={`/biblioteca?uc=${encodeURIComponent(unit.key)}`}
      className="group relative flex overflow-hidden rounded-2xl border border-line bg-sheet transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(29,39,51,0.45)]"
    >
      <span className="w-3 shrink-0" style={{ backgroundColor: color }} />
      <span className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-4">
        <span className="text-xs font-semibold tracking-wider uppercase" style={{ color }}>
          {unit.acronym ?? unit.code ?? unit.slug}
        </span>
        <span className="font-serif text-lg leading-snug font-semibold text-ink">{unit.name}</span>
        <span className="mt-1 text-xs text-muted">
          {props.subtitle ? `${props.subtitle} · ` : ""}
          {t("library.documents", { count: props.count })}
        </span>
      </span>
      <span className="self-center pr-4 text-line-strong transition group-hover:text-pen">
        <IconArrowRight />
      </span>
    </Link>
  );
}

function UnitDetail(props: { unitKey: string }) {
  const { t } = useTranslation();
  const { meta, login } = useApp();
  const labels = useLabels(meta);
  const [params, setParams] = useSearchParams();
  const year = params.get("ano") ?? "";
  if (!meta) return null;
  const unit = labels.units.find((u) => u.key === props.unitKey);
  const docs = meta.documents({
    owner: login,
    unit: props.unitKey,
    filedOnly: true,
    academicYear: year || undefined,
  });
  const byType = new Map<string, DocumentRow[]>();
  for (const doc of docs) {
    const key = doc.document_type ?? "outros";
    byType.set(key, [...(byType.get(key) ?? []), doc]);
  }
  const typeOrder = labels.vocab.document_types.map((v) => v.slug);
  const color = unitColor(props.unitKey);

  return (
    <div className="space-y-6">
      <Link to="/biblioteca" className="text-sm text-pen hover:underline">
        ← {t("library.back")}
      </Link>
      <div className="flex overflow-hidden rounded-2xl border border-line bg-sheet">
        <span className="w-4 shrink-0" style={{ backgroundColor: color }} />
        <div className="flex flex-1 flex-wrap items-end justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color }}>
              {unit?.acronym ?? unit?.code ?? ""}
            </p>
            <h1 className="font-serif text-3xl font-semibold text-ink">
              {unit?.name ?? props.unitKey}
            </h1>
            {unit?.lecturers.length ? (
              <p className="mt-1 text-sm text-muted">{unit.lecturers.join(", ")}</p>
            ) : null}
          </div>
          <select
            aria-label={t("library.all_years")}
            className="rounded-full border border-line-strong bg-sheet px-3 py-1.5 text-sm"
            value={year}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              if (e.target.value) next.set("ano", e.target.value);
              else next.delete("ano");
              setParams(next);
            }}
          >
            <option value="">{t("library.all_years")}</option>
            {meta.academicYears().map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
      {docs.length === 0 && <Empty>{t("library.empty")}</Empty>}
      <div className="grid gap-4 lg:grid-cols-2">
        {[...byType.entries()]
          .sort(([a], [b]) => typeOrder.indexOf(a) - typeOrder.indexOf(b))
          .map(([type, list]) => (
            <Card
              key={type}
              title={labels.term("document_types", type)}
              actions={<span className="text-xs text-muted">{list.length}</span>}
            >
              <div className="divide-y divide-line">
                {list.map((doc) => (
                  <DocumentLink key={doc.id} doc={doc} />
                ))}
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}

export function LibraryPage() {
  const { t } = useTranslation();
  const { meta, login, indexLoading, indexError } = useApp();
  const labels = useLabels(meta);
  const [params] = useSearchParams();
  const selectedUnit = params.get("uc") ?? "";

  const shelves = useMemo(() => {
    if (!meta) return [];
    const stats = meta.unitStats(login);
    const links = meta.courseUnits();
    const unitMap = new Map(labels.units.map((u) => [u.key, u]));
    const shelves = meta.courses().map((course) => ({
      key: course.key,
      name: course.name,
      books: links
        .filter((l) => l.course_key === course.key && unitMap.has(l.unit_key))
        .map((l) => ({
          unit: unitMap.get(l.unit_key)!,
          count: stats.get(l.unit_key)?.filed ?? 0,
          subtitle: [
            l.curricular_year ? t("library.year_group", { year: l.curricular_year }) : null,
            l.semester ? t("library.semester", { semester: l.semester }) : null,
          ]
            .filter(Boolean)
            .join(", "),
        })),
    }));
    const linked = new Set(links.map((l) => l.unit_key));
    const loose = labels.units
      .filter((u) => !linked.has(u.key))
      .map((u) => ({ unit: u, count: stats.get(u.key)?.filed ?? 0, subtitle: "" }));
    if (loose.length) shelves.push({ key: "", name: t("library.no_course"), books: loose });
    return shelves;
  }, [meta, login, labels.units, t]);

  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;
  if (selectedUnit) return <UnitDetail unitKey={selectedUnit} />;

  const unfiled = meta.unfiled(login);
  return (
    <div className="space-y-8">
      <PageHeader title={t("library.title")} />
      {unfiled.length > 0 && (
        <Link
          to="/rever"
          className="block rounded-2xl border border-marker/60 bg-marker-soft px-5 py-4 text-sm text-ink"
        >
          <strong>{t("library.unfiled")}</strong> ({unfiled.length}) — {t("library.unfiled_help")}
        </Link>
      )}
      {shelves.length === 0 && <Empty>{t("library.empty")}</Empty>}
      {shelves.map((shelf) => (
        <section key={shelf.key || "loose"}>
          <h2 className="mb-3 font-serif text-xl font-semibold text-ink">{shelf.name}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shelf.books.map((book) => (
              <UnitBook
                key={book.unit.key}
                unit={book.unit}
                count={book.count}
                subtitle={book.subtitle}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
