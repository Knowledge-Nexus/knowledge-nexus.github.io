import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../data/context";
import { formatWhen } from "../../lib/labels";
import { queuedItems } from "../../lib/processing";

/** Sem progresso durante este tempo, com trabalho por fazer, avisa-se (o processamento pode
 * estar desligado: o `nexus servir` parado ou o computador desligado). */
export const STALLED_AFTER_MS = 20 * 60_000;

/** A hora actual, actualizada de `everyMs` em `everyMs` enquanto `active`. */
function useNow(active: boolean, everyMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(timer);
  }, [active, everyMs]);
  return now;
}

/** Estado discreto do processamento: um ponto de cor e uma frase curta. */
export function PipelineStatus(props: { compact?: boolean }) {
  const { t } = useTranslation();
  const { runs, activeRun, manifest, pending, processing, processingSince } = useApp();
  const now = useNow(processing, 30_000);
  const latest = runs[0];
  // Se os índices foram reconstruídos depois da falha (ex.: processamento local), já não há problema.
  const failed =
    latest?.conclusion === "failure" &&
    !(manifest && Date.parse(manifest.built_at) > Date.parse(latest.updated_at));
  const stalled =
    processing &&
    !activeRun &&
    processingSince !== null &&
    now - processingSince > STALLED_AFTER_MS;
  const queued = queuedItems(manifest?.deposit);
  let label: string;
  let dot = "bg-line-strong";
  let pulse = false;
  let hint: string | undefined;
  if (activeRun) {
    label = t(activeRun.status === "in_progress" ? "pipeline.in_progress" : "pipeline.queued");
    dot = "bg-pen";
    pulse = true;
  } else if (stalled) {
    label = t("pipeline.stalled");
    hint = t("pipeline.stalled_hint");
    dot = "bg-clay";
  } else if (processing) {
    label =
      queued > 0 ? t("pipeline.processing_items", { count: queued }) : t("pipeline.processing");
    dot = "bg-pen";
    pulse = true;
  } else if (pending) {
    label = t("pipeline.queued");
    dot = "bg-pen";
    pulse = true;
  } else if (failed) {
    label = t("pipeline.failure");
    dot = "bg-clay";
  } else if (manifest) {
    label = t("pipeline.indices", { when: formatWhen(manifest.built_at) });
    dot = "bg-sage";
  } else {
    label = t("pipeline.no_indices");
  }
  const run = activeRun ?? (failed ? latest : undefined);
  return (
    <p
      className="flex min-w-0 items-center gap-2 text-xs text-ink-soft"
      aria-live="polite"
      title={hint ? `${label}. ${hint}` : label}
      data-testid="pipeline-status"
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
