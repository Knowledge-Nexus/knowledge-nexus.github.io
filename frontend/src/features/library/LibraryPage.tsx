import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Badge, Card, Empty, ErrorBox, Spinner } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow } from "../../data/types";
import { useLabels } from "../../lib/labels";

export function DocumentLink(props: { doc: DocumentRow }) {
  const { t } = useTranslation();
  const { doc } = props;
  return (
    <Link
      to={`/documento/${doc.id}`}
      className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
    >
      <span className="truncate text-sm">{doc.display_name}</span>
      <span className="flex shrink-0 gap-1">
        {doc.academic_year && <Badge>{doc.academic_year}</Badge>}
        {doc.needs_review && <Badge tone="warn">{t("nav.review")}</Badge>}
        {doc.pages_needing_transcription > 0 && <Badge tone="info">IA</Badge>}
      </span>
    </Link>
  );
}

export function LibraryPage() {
  const { t } = useTranslation();
  const { meta, login, indexLoading, indexError } = useApp();
  const labels = useLabels(meta);
  const [params, setParams] = useSearchParams();
  const selectedUnit = params.get("uc") ?? "";
  const year = params.get("ano") ?? "";

  const tree = useMemo(() => {
    if (!meta) return [];
    const docs = meta.documents({ owner: login, filedOnly: true });
    const counts = new Map<string, number>();
    for (const d of docs) counts.set(d.unit ?? "", (counts.get(d.unit ?? "") ?? 0) + 1);
    const links = meta.courseUnits();
    const courses = meta.courses().map((course) => ({
      key: course.key,
      name: course.name,
      units: links
        .filter((l) => l.course_key === course.key)
        .map((l) => ({
          key: l.unit_key,
          year: l.curricular_year,
          count: counts.get(l.unit_key) ?? 0,
        })),
    }));
    const linked = new Set(links.map((l) => l.unit_key));
    const loose = labels.units
      .filter((u) => !linked.has(u.key))
      .map((u) => ({ key: u.key, year: null, count: counts.get(u.key) ?? 0 }));
    if (loose.length) courses.push({ key: "", name: t("library.no_course"), units: loose });
    return courses;
  }, [meta, login, labels.units, t]);

  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;

  const docs = selectedUnit
    ? meta.documents({
        owner: login,
        unit: selectedUnit,
        filedOnly: true,
        academicYear: year || undefined,
      })
    : [];
  const byType = new Map<string, DocumentRow[]>();
  for (const doc of docs) {
    const key = doc.document_type ?? "outros";
    byType.set(key, [...(byType.get(key) ?? []), doc]);
  }
  const typeOrder = labels.vocab.document_types.map((v) => v.slug);
  const unfiled = meta.unfiled(login);

  const select = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    setParams(next);
  };

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
      <aside className="space-y-3">
        <h1 className="text-xl font-semibold">{t("library.title")}</h1>
        {tree.map((course) => (
          <div key={course.key || "loose"}>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {course.name}
            </h2>
            <ul className="space-y-0.5">
              {course.units.map((unit) => (
                <li key={unit.key}>
                  <button
                    type="button"
                    onClick={() => select({ uc: unit.key })}
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left text-sm ${unit.key === selectedUnit ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}
                  >
                    <span className="truncate">{labels.unit(unit.key)}</span>
                    <span className="text-xs opacity-70">{unit.count}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {unfiled.length > 0 && (
          <Link
            to="/rever"
            className="block rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
          >
            <strong>{t("library.unfiled")}</strong> ({unfiled.length})
            <span className="block text-xs">{t("library.unfiled_help")}</span>
          </Link>
        )}
      </aside>
      <section className="space-y-4">
        {!selectedUnit ? (
          <Empty>{tree.length ? t("library.choose_unit") : t("library.empty")}</Empty>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{labels.unit(selectedUnit)}</h2>
              <select
                aria-label={t("library.all_years")}
                className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
                value={year}
                onChange={(e) => select({ ano: e.target.value })}
              >
                <option value="">{t("library.all_years")}</option>
                {meta.academicYears().map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
            {docs.length === 0 && <Empty>{t("library.empty")}</Empty>}
            {[...byType.entries()]
              .sort(([a], [b]) => typeOrder.indexOf(a) - typeOrder.indexOf(b))
              .map(([type, list]) => (
                <Card
                  key={type}
                  title={`${labels.term("document_types", type)} · ${t("library.documents", { count: list.length })}`}
                >
                  <div className="divide-y divide-slate-100">
                    {list.map((doc) => (
                      <DocumentLink key={doc.id} doc={doc} />
                    ))}
                  </div>
                </Card>
              ))}
          </>
        )}
      </section>
    </div>
  );
}
