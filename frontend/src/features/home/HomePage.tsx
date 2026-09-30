import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IconArrowRight, IconCheckList, IconInbox } from "../../components/icons";
import { buttonClass, Card, Empty, ErrorBox, PageHeader, Spinner } from "../../components/ui";
import { useApp } from "../../data/context";
import { useLabels } from "../../lib/labels";
import { DocumentLink, UnitBook } from "../library/LibraryPage";

function greeting(): "morning" | "afternoon" | "evening" {
  const hour = new Date().getHours();
  if (hour < 13) return "morning";
  if (hour < 20) return "afternoon";
  return "evening";
}

function Stat(props: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-sheet px-3 py-3 sm:px-5 sm:py-4">
      <p className="font-serif text-2xl font-semibold text-ink sm:text-3xl">{props.value}</p>
      <p className="text-xs text-muted sm:text-sm">{props.label}</p>
    </div>
  );
}

/** Lista de primeiros passos, visível até estarem todos feitos. */
function FirstSteps(props: { catalog: boolean; documents: number; review: number }) {
  const { t } = useTranslation();
  const steps = [
    { label: t("home.step_catalog"), done: props.catalog, to: "/configuracao" },
    { label: t("home.step_deposit"), done: props.documents > 0, to: "/depositar" },
    { label: t("home.step_review"), done: props.documents > 0 && props.review === 0, to: "/rever" },
  ];
  if (steps.every((s) => s.done)) return null;
  return (
    <Card
      title={t("home.steps_title")}
      actions={
        <Link to="/ajuda" className="text-sm text-pen hover:underline">
          {t("home.how_link")}
        </Link>
      }
    >
      <ol className="space-y-2">
        {steps.map((step, index) => (
          <li key={step.label}>
            <Link
              to={step.to}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm hover:bg-paper"
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  step.done ? "bg-sage text-white" : "border border-gold text-pen"
                }`}
              >
                {step.done ? "✓" : index + 1}
              </span>
              <span className={step.done ? "text-muted line-through" : "text-ink"}>
                {step.label}
              </span>
              {step.done && <span className="text-xs text-sage">{t("home.step_done")}</span>}
            </Link>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { meta, login, indexLoading, indexError, readOnly, to } = useApp();
  const labels = useLabels(meta);
  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;

  const counts = meta?.counts(login) ?? { total: 0, review: 0, filed: 0 };
  const stats = meta?.unitStats(login) ?? new Map<string, { filed: number; total: number }>();
  const recent = meta?.recent(login) ?? [];
  const noCatalog = !meta || labels.units.length === 0;

  return (
    <div className="space-y-8">
      {readOnly ? (
        <PageHeader title={t("public.title")} subtitle={t("public.subtitle", { owner: login })} />
      ) : (
        <PageHeader title={t(`home.${greeting()}`)} subtitle={t("home.subtitle")} />
      )}

      {!readOnly && (
        <FirstSteps catalog={!noCatalog} documents={counts.total} review={counts.review} />
      )}

      <div className={`grid gap-2 sm:gap-3 ${readOnly ? "grid-cols-2" : "grid-cols-3"}`}>
        <Stat value={counts.total} label={t("home.documents")} />
        <Stat value={labels.units.length} label={t("home.units")} />
        {!readOnly && <Stat value={counts.review} label={t("home.to_review")} />}
      </div>

      {counts.review > 0 && !readOnly && (
        <Link
          to={to("/rever")}
          className="flex items-center gap-3 rounded-2xl border border-marker/60 bg-marker-soft px-5 py-4 text-sm text-ink transition hover:bg-marker/40"
        >
          <IconCheckList />
          <span className="flex-1">{t("home.review_cta", { count: counts.review })}</span>
          <span className="flex items-center gap-1 font-medium">
            {t("home.review_go")} <IconArrowRight size={16} />
          </span>
        </Link>
      )}

      {noCatalog && readOnly ? (
        <Empty>{t("public.unavailable")}</Empty>
      ) : noCatalog ? (
        <Empty
          action={
            <Link to="/configuracao" className={buttonClass("primary")}>
              {t("home.setup_cta")}
            </Link>
          }
        >
          {t("home.no_units")}
        </Empty>
      ) : (
        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold">
              {t(readOnly ? "home.units_shared" : "home.your_units")}
            </h2>
            <Link to={to("/biblioteca")} className="shrink-0 text-sm text-pen hover:underline">
              {t("home.all_library")}
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {labels.units.map((unit) => (
              <UnitBook key={unit.key} unit={unit} count={stats.get(unit.key)?.filed ?? 0} />
            ))}
          </div>
        </section>
      )}

      {recent.length > 0 || readOnly ? (
        recent.length > 0 && (
          <Card title={t("home.recent")}>
            <div className="divide-y divide-line">
              {recent.map((doc) => (
                <DocumentLink key={doc.id} doc={doc} showUnit />
              ))}
            </div>
          </Card>
        )
      ) : (
        <Empty
          action={
            <Link to="/depositar" className={buttonClass("primary")}>
              <IconInbox size={16} /> {t("home.deposit_cta")}
            </Link>
          }
        >
          {t("home.empty")}
        </Empty>
      )}
    </div>
  );
}
