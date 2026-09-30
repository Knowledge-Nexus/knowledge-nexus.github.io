// Componentes pequenos e reutilizáveis (identidade "caderno de estudo").

import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { FieldValue, Reason } from "../data/types";

export function PageHeader(props: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink">{props.title}</h1>
        {props.subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{props.subtitle}</p>}
      </div>
      {props.actions}
    </header>
  );
}

export function Card(props: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-sheet p-5 shadow-[0_1px_0_rgba(29,39,51,0.04),0_8px_24px_-18px_rgba(29,39,51,0.25)] ${props.className ?? ""}`}
    >
      {(props.title || props.actions) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {props.title && (
            <h2 className="font-serif text-lg font-semibold text-ink">{props.title}</h2>
          )}
          {props.actions}
        </header>
      )}
      {props.children}
    </section>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

/** Classes de botão, também para links e `<label>` que se apresentam como botões. */
export function buttonClass(variant: ButtonVariant = "primary"): string {
  const styles = {
    primary: "bg-pen text-white shadow-sm hover:bg-pen-dark",
    secondary: "border border-line-strong bg-sheet text-ink hover:bg-paper",
    danger: "border border-clay/40 bg-sheet text-clay hover:bg-clay-soft",
    ghost: "text-pen hover:bg-pen-soft",
  }[variant];
  return `inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`;
}

export function Button(props: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: ButtonVariant;
  disabled?: boolean;
}) {
  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      disabled={props.disabled}
      className={buttonClass(props.variant)}
    >
      {props.children}
    </button>
  );
}

export function Spinner(props: { label?: string }) {
  const { t } = useTranslation();
  return (
    <p className="flex items-center gap-2 text-sm text-muted" role="status">
      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-line-strong border-t-pen" />
      {props.label ?? t("common.loading")}
    </p>
  );
}

export function ErrorBox(props: { error: unknown }) {
  const { t } = useTranslation();
  const message = props.error instanceof Error ? props.error.message : String(props.error);
  return (
    <p role="alert" className="rounded-xl border border-clay/30 bg-clay-soft p-3 text-sm text-clay">
      {t("common.error", { message })}
    </p>
  );
}

export function Notice(props: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-sage/30 bg-sage-soft p-3 text-sm text-sage">
      {props.children}
    </p>
  );
}

export function Badge(props: { children: ReactNode; tone?: "neutral" | "warn" | "ok" | "info" }) {
  const tone = {
    neutral: "bg-paper text-ink-soft border-line",
    warn: "bg-marker-soft text-ink border-marker/50",
    ok: "bg-sage-soft text-sage border-sage/30",
    info: "bg-pen-soft text-pen border-pen/20",
  }[props.tone ?? "neutral"];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tone}`}
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

export function certaintyLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 0.8) return "high";
  if (confidence >= 0.6) return "medium";
  return "low";
}

/** Indicador discreto de certeza (três pontos) em vez de percentagens. */
export function ConfidenceBadge(props: { field?: FieldValue | null }) {
  const { t } = useTranslation();
  const field = props.field;
  if (!field) return null;
  const kind = methodKind(field.method);
  if (kind === "user") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-sage">
        ✓ {t("common.method.user")}
      </span>
    );
  }
  const level = certaintyLevel(field.confidence);
  const filled = { high: 3, medium: 2, low: 1 }[level];
  const color = { high: "bg-sage", medium: "bg-pen", low: "bg-marker" }[level];
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs text-muted"
      title={t(`common.method.${kind}_hint`)}
    >
      <span className="inline-flex gap-0.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < filled ? color : "bg-line-strong"}`}
          />
        ))}
      </span>
      {kind === "ai" ? `${t("common.method.ai")} · ` : ""}
      {t(`common.certainty.${level}`)}
    </span>
  );
}

export function ReasonText(props: { reason: Reason }) {
  const { t } = useTranslation();
  const { reason } = props;
  const params: Record<string, unknown> = { ...reason.params };
  if (Array.isArray(params.keywords)) params.keywords = (params.keywords as string[]).join(", ");
  if (typeof params.field === "string") params.field = t(`fields.${params.field}`);
  if (typeof params.confidence === "number") {
    params.confidence = t(`common.certainty.${certaintyLevel(params.confidence)}`);
  }
  params.source = reason.source ? t(`reasons:source.${reason.source}`) : "";
  return <>{t(`reasons:${reason.code}`, { ...params, defaultValue: reason.code })}</>;
}

export function ReasonList(props: { reasons?: Reason[] }) {
  if (!props.reasons?.length) return null;
  return (
    <ul className="mt-1.5 space-y-0.5 pl-4 text-xs leading-relaxed text-ink-soft marker:text-line-strong [list-style:'–_']">
      {props.reasons.map((reason, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: razões não têm id próprio
        <li key={index}>
          <ReasonText reason={reason} />
        </li>
      ))}
    </ul>
  );
}

export function Empty(props: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line-strong bg-sheet/60 px-6 py-10 text-center">
      <p className="max-w-md font-serif text-base text-ink-soft">{props.children}</p>
      {props.action}
    </div>
  );
}

// Cores de lombada para as cadeiras (tons de encadernação; estáveis por chave).
const SPINES = [
  "#7e3b3b",
  "#355f48",
  "#2c4a6e",
  "#a8782b",
  "#5f4467",
  "#2d6a6e",
  "#9a4f2e",
  "#4b5563",
];

export function unitColor(key: string | null | undefined): string {
  if (!key) return "#9ca3af";
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return SPINES[hash % SPINES.length]!;
}
