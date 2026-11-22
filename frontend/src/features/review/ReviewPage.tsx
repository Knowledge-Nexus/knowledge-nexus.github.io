// «A rever»: quatro separadores (com o número de cada um) em vez de uma página comprida.
// Documentos (DocumentQueue: lista, documento e classificação à altura do ecrã), Perguntas
// por verificar, Removidos e Em falta no catálogo (CatalogTab). O separador fica no endereço
// (`?aba=`), tal como o documento escolhido (`?doc=`).

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { Empty, ErrorBox, PageHeader, Spinner } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DocumentRow } from "../../data/types";
import { useLabels } from "../../lib/labels";
import { settleRemovals, useRemovals } from "../../lib/removal";
import { QuestionsToVerify, questionsToVerify } from "../questions/QuestionBank";
import { CatalogTab } from "./CatalogTab";
import { DocumentQueue, proposalOf } from "./DocumentQueue";
import { type Removal, RemovedList, RemovedNotice } from "./RemoveDocuments";

const TABS = ["documentos", "perguntas", "removidos", "catalogo"] as const;
type Tab = (typeof TABS)[number];

export function ReviewPage() {
  const { t } = useTranslation();
  const { meta, login, indexLoading, indexError, can } = useApp();
  const labels = useLabels(meta);
  const [params, setParams] = useSearchParams();
  const [lastRemoval, setLastRemoval] = useState<Removal | null>(null);
  const removals = useRemovals();
  useEffect(() => {
    if (meta) settleRemovals(meta);
  }, [meta]);
  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;

  // O que acabaste de remover já não aparece, mesmo antes de o índice ser actualizado.
  const fullQueue = meta.reviewQueue(login).filter((d) => !removals.hidden.has(d.id));
  const inQueue = new Set(fullQueue.map((d) => d.id));
  // Os outros ficheiros de um conjunto seguem o principal: aparecem por baixo dele e são
  // arrumados com ele quando o confirmares.
  const followers = new Map<string, DocumentRow[]>();
  const queue = fullQueue.filter((d) => {
    if (d.bundle_lead && d.bundle_lead !== d.id && inQueue.has(d.bundle_lead)) {
      followers.set(d.bundle_lead, [...(followers.get(d.bundle_lead) ?? []), d]);
      return false;
    }
    return true;
  });
  const proposals = meta.proposals("open");
  // Quantos documentos esperam por cada proposta de cadeira.
  const waiting = new Map<string, number>();
  for (const doc of fullQueue) {
    const id = proposalOf(doc);
    if (id) waiting.set(id, (waiting.get(id) ?? 0) + 1);
  }
  const removedDocs = meta
    .removed(login)
    .filter((d) => !removals.restored.has(d.id) && !removals.hidden.has(d.id));
  const questions = can.verify ? questionsToVerify(meta, login).total : 0;
  const counts: Record<Tab, number> = {
    documentos: queue.length,
    perguntas: questions,
    removidos: removedDocs.length,
    catalogo: proposals.length,
  };
  const visible = TABS.filter((tab) => tab !== "perguntas" || can.verify);
  const wanted = params.get("aba") as Tab | null;
  const tab: Tab = wanted && visible.includes(wanted) ? wanted : "documentos";
  const go = (next: Tab) =>
    setParams((current) => {
      const out = new URLSearchParams(current);
      if (next === "documentos") out.delete("aba");
      else out.set("aba", next);
      return out;
    });

  return (
    <div className="space-y-3">
      <PageHeader title={t("review.title")} subtitle={t("review.intro")} />
      <div
        role="tablist"
        aria-label={t("review.title")}
        className="flex flex-wrap gap-1 border-b border-line"
      >
        {visible.map((name) => {
          const active = name === tab;
          const warn = name === "catalogo" && counts.catalogo > 0;
          return (
            <button
              key={name}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => go(name)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2 text-sm font-medium transition ${active ? "border-gold text-pen" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {t(`review.tab_${name}`)}
              <span
                className={`rounded-full px-2 text-xs font-semibold ${active ? "bg-pen text-white" : warn ? "bg-marker-soft text-ink" : "bg-pen-soft text-pen"}`}
              >
                {counts[name]}
              </span>
            </button>
          );
        })}
      </div>
      {lastRemoval && <RemovedNotice removal={lastRemoval} onClose={() => setLastRemoval(null)} />}
      {tab === "documentos" && (
        <DocumentQueue
          queue={queue}
          followers={followers}
          proposals={proposals}
          labels={labels}
          onCatalog={() => go("catalogo")}
          onRemoved={(removal, next) => {
            setLastRemoval(removal);
            setParams((current) => {
              const out = new URLSearchParams(current);
              if (next) out.set("doc", next);
              else out.delete("doc");
              return out;
            });
          }}
        />
      )}
      {tab === "perguntas" && <QuestionsToVerify />}
      {tab === "removidos" && <RemovedList docs={removedDocs} />}
      {tab === "catalogo" && <CatalogTab proposals={proposals} waiting={waiting} />}
    </div>
  );
}
