import { useTranslation } from "react-i18next";
import { Badge } from "../../components/ui";
import { useApp } from "../../data/context";
import { formatWhen } from "../../lib/labels";

export function PipelineStatus() {
  const { t } = useTranslation();
  const { runs, activeRun, manifest, pending } = useApp();
  const latest = runs[0];
  let label: string;
  let tone: "neutral" | "warn" | "ok" | "info" = "neutral";
  if (activeRun) {
    label = t(activeRun.status === "in_progress" ? "pipeline.in_progress" : "pipeline.queued");
    tone = "info";
  } else if (pending) {
    label = t("common.pending_sync");
    tone = "info";
  } else if (latest?.conclusion === "failure") {
    label = t("pipeline.failure");
    tone = "warn";
  } else if (manifest) {
    label = t("pipeline.indices", { when: formatWhen(manifest.built_at) });
    tone = "ok";
  } else {
    label = t("pipeline.no_indices");
  }
  const run = activeRun ?? latest;
  return (
    <div className="flex items-center gap-2 text-xs" aria-live="polite">
      <Badge tone={tone}>{label}</Badge>
      {run && (
        <a
          className="text-slate-500 underline"
          href={run.html_url}
          target="_blank"
          rel="noreferrer"
        >
          {t("pipeline.open_run")}
        </a>
      )}
    </div>
  );
}
