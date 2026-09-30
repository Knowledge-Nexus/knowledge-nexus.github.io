import { useTranslation } from "react-i18next";
import { useApp } from "../../data/context";
import { formatWhen } from "../../lib/labels";

/** Estado discreto do processamento: um ponto de cor e uma frase curta. */
export function PipelineStatus(props: { compact?: boolean }) {
  const { t } = useTranslation();
  const { runs, activeRun, manifest, pending } = useApp();
  const latest = runs[0];
  let label: string;
  let dot = "bg-line-strong";
  let pulse = false;
  if (activeRun) {
    label = t(activeRun.status === "in_progress" ? "pipeline.in_progress" : "pipeline.queued");
    dot = "bg-pen";
    pulse = true;
  } else if (pending) {
    label = t("pipeline.queued");
    dot = "bg-pen";
    pulse = true;
  } else if (latest?.conclusion === "failure") {
    label = t("pipeline.failure");
    dot = "bg-clay";
  } else if (manifest) {
    label = t("pipeline.indices", { when: formatWhen(manifest.built_at) });
    dot = "bg-sage";
  } else {
    label = t("pipeline.no_indices");
  }
  const run = activeRun ?? (latest?.conclusion === "failure" ? latest : undefined);
  return (
    <p
      className="flex min-w-0 items-center gap-2 text-xs text-ink-soft"
      aria-live="polite"
      title={label}
    >
      <span className={`h-2 w-2 shrink-0 rounded-full ${dot} ${pulse ? "animate-pulse" : ""}`} />
      <span className={props.compact ? "sr-only" : "truncate"}>{label}</span>
      {run && (
        <a
          className="shrink-0 text-muted underline"
          href={run.html_url}
          target="_blank"
          rel="noreferrer"
        >
          {t("pipeline.open_run")}
        </a>
      )}
    </p>
  );
}
