// Banco de perguntas (fase A) na página da cadeira: as perguntas dos enunciados, tal e qual
// dos ficheiros (o motor confirma o texto em nexus/questions.py). Não levam a etiqueta de IA:
// o texto não foi escrito pela IA, e cada uma leva ao original. Quem verifica (dono, Editor,
// Gestor) confirma ou rejeita depois de publicadas.

import { type ReactNode, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Badge, Button, ErrorBox } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow, QuestionRow } from "../../data/types";
import { useLabels } from "../../lib/labels";
import { documentDate, documentTitle } from "../../lib/titles";

type Decision = "confirmed" | "rejected" | null;

function QuestionItem(props: {
  doc: DocumentRow;
  question: QuestionRow;
  status: Decision;
  busy: boolean;
  onDecide: (next: Decision) => void;
  context?: ReactNode;
}) {
  const { t } = useTranslation();
  const { to, can } = useApp();
  const { doc, question, status, busy } = props;
  const page = question.pages[0] ?? 1;
  const decide = props.onDecide;

  return (
    <li aria-label={t("questions.question", { label: question.label })} className="space-y-2 py-4">
      {props.context}
      <p
        className={`font-serif text-[1.02rem] leading-relaxed whitespace-pre-line text-ink ${status === "rejected" ? "opacity-60" : ""}`}
      >
        {question.text}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span title={t("questions.from_file_hint")}>{t("questions.from_file")}</span>
        <Link className="text-pen hover:underline" to={to(`/documento/${doc.id}?pagina=${page}`)}>
          {t("questions.open_page", { page })}
        </Link>
        {status === "confirmed" && <Badge tone="ok">{t("questions.confirmed")}</Badge>}
        {status === "rejected" && <Badge tone="warn">{t("questions.rejected")}</Badge>}
        {can.verify && (
          <span className="flex gap-1.5 sm:ml-auto">
            {status ? (
              <Button variant="ghost" disabled={busy} onClick={() => decide(null)}>
                {status === "rejected" ? t("questions.restore") : t("questions.undo")}
              </Button>
            ) : (
              <>
                <Button variant="secondary" disabled={busy} onClick={() => decide("confirmed")}>
                  {t("questions.confirm")}
                </Button>
                <Button variant="ghost" disabled={busy} onClick={() => decide("rejected")}>
                  {t("questions.reject")}
                </Button>
              </>
            )}
          </span>
        )}
      </div>
    </li>
  );
}

function ExamQuestions(props: { doc: DocumentRow; questions: QuestionRow[]; excluded: number }) {
  const { t } = useTranslation();
  const { meta, to, can, source, notifyCommit } = useApp();
  const labels = useLabels(meta);
  const { doc } = props;
  const date = documentDate(doc, labels);
  // As decisões acabadas de gravar (pergunta → decisão), até o índice ser actualizado.
  const [decisions, setDecisions] = useState<Record<string, Decision>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const statusOf = (q: QuestionRow): Decision =>
    q.label in decisions ? (decisions[q.label] ?? null) : q.review_status;
  const unreviewed = props.questions.filter((q) => statusOf(q) === null);

  /** Uma ou várias perguntas, num só commit. */
  async function decide(questions: QuestionRow[], next: Decision) {
    if (questions.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await source.reviewQuestions(
        doc.sha256,
        questions.map((q) => q.label),
        next,
      );
      notifyCommit();
      setDecisions((current) => ({
        ...current,
        ...Object.fromEntries(questions.map((q) => [q.label, next])),
      }));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  let lastContext: string | null = null;
  return (
    <section
      id={`exame-${doc.id}`}
      aria-label={documentTitle(doc, labels, true)}
      className="rounded-2xl border border-line bg-sheet px-6 py-5"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-3">
        <h2 className="font-serif text-xl font-semibold text-ink">
          {documentTitle(doc, labels, true)}
          {date && <span className="ml-2 text-sm font-normal text-muted">{date}</span>}
        </h2>
        <span className="flex flex-wrap items-center gap-3">
          {can.verify && unreviewed.length > 1 && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => void decide(unreviewed, "confirmed")}
            >
              {t("questions.confirm_all", { count: unreviewed.length })}
            </Button>
          )}
          <Link className="text-sm text-pen hover:underline" to={to(`/documento/${doc.id}`)}>
            {t("questions.open_exam")}
          </Link>
        </span>
      </header>
      {error ? <ErrorBox error={error} /> : null}
      <ol className="divide-y divide-line">
        {props.questions.map((question) => {
          const showContext =
            question.context_id !== null &&
            question.context_text !== null &&
            question.context_id !== lastContext;
          lastContext = question.context_id;
          return (
            <QuestionItem
              key={question.id}
              doc={doc}
              question={question}
              status={statusOf(question)}
              busy={busy}
              onDecide={(next) => void decide([question], next)}
              context={
                showContext ? (
                  <div className="rounded-xl border border-line bg-paper/70 px-4 py-3">
                    <p className="mb-1 text-xs font-semibold tracking-wider text-muted uppercase">
                      {question.context_label ?? t("questions.context")}
                    </p>
                    <p className="font-serif leading-relaxed whitespace-pre-line text-ink-soft">
                      {question.context_text}
                    </p>
                  </div>
                ) : undefined
              }
            />
          );
        })}
      </ol>
      {props.excluded > 0 && (
        <p className="pt-3 text-xs text-muted">
          {t("questions.excluded", { count: props.excluded })}
        </p>
      )}
    </section>
  );
}

/**
 * As perguntas dos enunciados desta cadeira (um por conteúdo), pela ordem do exame. `focus`: o
 * documento de onde se veio (a página do enunciado), para ir logo às perguntas dele.
 */
export function QuestionBank(props: { docs: DocumentRow[]; focus?: string | null }) {
  const { t } = useTranslation();
  const { meta, can } = useApp();
  const focusSha = props.focus ? meta?.document(props.focus)?.sha256 : undefined;
  const target = props.docs.find((d) => d.sha256 === focusSha);
  useEffect(() => {
    if (target) document.getElementById(`exame-${target.id}`)?.scrollIntoView({ block: "start" });
  }, [target]);
  if (!meta) return null;
  const shas = props.docs.map((d) => d.sha256);
  const all = meta.questions(shas, can.verify);
  const excluded = meta.questionCounts("excluded");
  return (
    <div className="space-y-4">
      <p className="max-w-3xl text-sm text-ink-soft">{t("questions.intro")}</p>
      {props.docs.map((doc) => {
        const questions = all.filter((q) => q.sha256 === doc.sha256);
        if (questions.length === 0) return null;
        return (
          <ExamQuestions
            key={doc.id}
            doc={doc}
            questions={questions}
            excluded={excluded.get(doc.sha256) ?? 0}
          />
        );
      })}
    </div>
  );
}

/**
 * Em «A rever», para quem verifica: os enunciados com perguntas publicadas que ainda ninguém
 * confirmou nem rejeitou (fechado por defeito; leva às perguntas de cada um).
 */
export function QuestionsToVerify() {
  const { t } = useTranslation();
  const { meta, login, to, can } = useApp();
  const labels = useLabels(meta);
  if (!meta || !can.verify) return null;
  const pending = meta.questionCounts("unreviewed");
  if (pending.size === 0) return null;
  const docs = meta
    .documents({ owner: login, filedOnly: true })
    .filter(
      (d, i, all) => pending.has(d.sha256) && all.findIndex((o) => o.sha256 === d.sha256) === i,
    );
  if (docs.length === 0) return null;
  const total = docs.reduce((n, d) => n + (pending.get(d.sha256) ?? 0), 0);
  return (
    <details className="rounded-2xl border border-line bg-sheet/60 p-4">
      <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
        {t("questions.to_verify_title", { count: total })}
      </summary>
      <p className="mt-2 text-xs text-muted">{t("questions.to_verify_text")}</p>
      <ul className="mt-3 divide-y divide-line">
        {docs.map((doc) => (
          <li key={doc.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
            <Link
              className="min-w-0 flex-1 truncate hover:text-pen hover:underline"
              to={to(
                `/biblioteca?uc=${encodeURIComponent(doc.unit ?? "")}&ver=perguntas&exame=${doc.id}`,
              )}
            >
              {documentTitle(doc, labels, true)}
              {doc.unit ? ` · ${labels.unit(doc.unit)}` : ""}
            </Link>
            <span className="text-xs text-muted">
              {t("questions.to_verify_item", { count: pending.get(doc.sha256) ?? 0 })}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
