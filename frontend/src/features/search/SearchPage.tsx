import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Badge, Card, Empty, ErrorBox, PageHeader, Spinner } from "../../components/ui";
import { useApp, useSearchIndex } from "../../data/context";
import { splitSnippet } from "../../data/sqlite/search";
import { useLabels } from "../../lib/labels";

export function SearchPage() {
  const { t } = useTranslation();
  const { meta, login } = useApp();
  const labels = useLabels(meta);
  const index = useSearchIndex();
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const unit = params.get("uc") ?? "";
  const type = params.get("tipo") ?? "";
  const year = params.get("ano") ?? "";

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const hits =
    index.data && query.trim()
      ? index.data.search(query, login, {
          unit: unit || undefined,
          document_type: type || undefined,
          academic_year: year || undefined,
        })
      : [];

  const select = "rounded-xl border border-line-strong px-2 py-1.5 text-sm";
  return (
    <div className="space-y-4">
      <PageHeader title={t("search.title")} />
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          className="min-w-64 flex-1 rounded-xl border border-line-strong px-3 py-2"
          placeholder={t("search.placeholder")}
          aria-label={t("search.placeholder")}
          value={query}
          onChange={(e) => set("q", e.target.value)}
          autoFocus
        />
        <select
          className={select}
          value={unit}
          onChange={(e) => set("uc", e.target.value)}
          aria-label={t("search.any_unit")}
        >
          <option value="">{t("search.any_unit")}</option>
          {labels.units.map((u) => (
            <option key={u.key} value={u.key}>
              {labels.unit(u.key)}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={type}
          onChange={(e) => set("tipo", e.target.value)}
          aria-label={t("search.any_type")}
        >
          <option value="">{t("search.any_type")}</option>
          {labels.vocab.document_types.map((v) => (
            <option key={v.slug} value={v.slug}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          className={select}
          value={year}
          onChange={(e) => set("ano", e.target.value)}
          aria-label={t("search.any_year")}
        >
          <option value="">{t("search.any_year")}</option>
          {(meta?.academicYears() ?? []).map((y) => (
            <option key={y}>{y}</option>
          ))}
        </select>
      </div>
      {index.isLoading && <Spinner label={t("search.loading_index")} />}
      {index.error ? <ErrorBox error={index.error} /> : null}
      {!meta && !index.isLoading && <Empty>{t("pipeline.no_indices")}</Empty>}
      {query.trim() && index.data && (
        <p className="text-sm text-muted">
          {hits.length ? t("search.results", { count: hits.length }) : t("search.none")}
        </p>
      )}
      <div className="space-y-2">
        {hits.map((hit) => (
          <Card key={`${hit.doc_id}-${hit.page}`}>
            <Link to={`/documento/${hit.doc_id}?pagina=${hit.page}`} className="block space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium underline">{hit.title}</span>
                <Badge>{t("search.page", { page: hit.page })}</Badge>
                {hit.unit && <Badge tone="info">{labels.unit(hit.unit)}</Badge>}
                {hit.document_type && (
                  <Badge>{labels.term("document_types", hit.document_type)}</Badge>
                )}
                {hit.academic_year && <Badge>{hit.academic_year}</Badge>}
              </div>
              <p className="text-sm text-ink-soft">
                {splitSnippet(hit.snippet).map((part, i) =>
                  part.mark ? (
                    // biome-ignore lint/suspicious/noArrayIndexKey: pedaços do excerto
                    <mark key={i} className="rounded bg-marker-soft px-0.5">
                      {part.text}
                    </mark>
                  ) : (
                    // biome-ignore lint/suspicious/noArrayIndexKey: pedaços do excerto
                    <span key={i}>{part.text}</span>
                  ),
                )}
              </p>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
