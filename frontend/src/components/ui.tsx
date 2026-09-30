// Componentes pequenos e reutilizáveis.

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FieldValue, Reason } from "../data/types";

export function Card(props: { title?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      {(props.title || props.actions) && (
        <header className="mb-3 flex items-center justify-between gap-3">
          {props.title && <h2 className="text-base font-semibold text-slate-800">{props.title}</h2>}
          {props.actions}
        </header>
      )}
      {props.children}
    </section>
  );
}

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-slate-900 text-white hover:bg-slate-700",
    secondary: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
    danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  }[props.variant ?? "primary"];
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {props.children}
    </button>
  );
}

export function Spinner(props: { label?: string }) {
  const { t } = useTranslation();
  return (
    <p className="flex items-center gap-2 text-sm text-slate-500" role="status">
      <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
      {props.label ?? t("common.loading")}
    </p>
  );
}

export function ErrorBox(props: { error: unknown }) {
  const { t } = useTranslation();
  const message = props.error instanceof Error ? props.error.message : String(props.error);
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      {t("common.error", { message })}
    </p>
  );
}

export function Badge(props: { children: ReactNode; tone?: "neutral" | "warn" | "ok" | "info" }) {
  const tone = {
    neutral: "bg-slate-100 text-slate-700",
    warn: "bg-amber-100 text-amber-900",
    ok: "bg-emerald-100 text-emerald-800",
    info: "bg-sky-100 text-sky-800",
  }[props.tone ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {props.children}
    </span>
  );
}

export function methodKind(method: string): "user" | "ai" | "heuristic" {
  if (method === "user") return "user";
  if (method.startsWith("ai:")) return "ai";
  return "heuristic";
}

export function ConfidenceBadge(props: { field?: FieldValue | null }) {
  const { t } = useTranslation();
  const field = props.field;
  if (!field) return null;
  const kind = methodKind(field.method);
  if (kind === "user") return <Badge tone="ok">{t("common.method.user")}</Badge>;
  const pct = Math.round(field.confidence * 100);
  const tone = pct >= 70 ? "info" : "warn";
  return (
    <Badge tone={tone}>
      {kind === "ai" ? `${t("common.method.ai")} · ` : ""}
      {t("common.confidence", { value: pct })}
    </Badge>
  );
}

export function ReasonText(props: { reason: Reason }) {
  const { t } = useTranslation();
  const { reason } = props;
  const params: Record<string, unknown> = { ...reason.params };
  if (Array.isArray(params.keywords)) params.keywords = (params.keywords as string[]).join(", ");
  if (typeof params.field === "string") params.field = t(`fields.${params.field}`);
  if (typeof params.confidence === "number")
    params.confidence = `${Math.round(params.confidence * 100)}%`;
  params.source = reason.source ? t(`reasons:source.${reason.source}`) : "";
  return <>{t(`reasons:${reason.code}`, { ...params, defaultValue: reason.code })}</>;
}

export function ReasonList(props: { reasons?: Reason[] }) {
  if (!props.reasons?.length) return null;
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600">
      {props.reasons.map((reason, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: razões não têm id próprio
        <li key={index}>
          <ReasonText reason={reason} />
        </li>
      ))}
    </ul>
  );
}

export function Empty(props: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
      {props.children}
    </p>
  );
}
