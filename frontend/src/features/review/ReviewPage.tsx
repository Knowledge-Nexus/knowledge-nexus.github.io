import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Markdown } from "../../components/Markdown";
import {
  Button,
  Card,
  Empty,
  ErrorBox,
  PageHeader,
  ReasonList,
  Spinner,
} from "../../components/ui";
import { useApp } from "../../data/context";
import type { ProposalRow } from "../../data/types";
import { useLabels } from "../../lib/labels";
import { slugify } from "../../lib/normalize";
import { ReviewForm } from "./ReviewForm";

function Preview(props: { sha256: string }) {
  const { t } = useTranslation();
  const { source } = useApp();
  const text = useQuery({
    queryKey: ["page", props.sha256, 1],
    queryFn: () => source.pageText(props.sha256, 1),
    retry: false,
  });
  if (text.isLoading) return <Spinner />;
  if (text.error || !text.data?.trim())
    return <p className="text-xs text-muted">{t("document.no_text")}</p>;
  return (
    <div className="max-h-72 overflow-auto rounded-lg bg-paper p-3">
      <Markdown>{text.data.slice(0, 3000)}</Markdown>
    </div>
  );
}

function ProposalCard(props: { proposal: ProposalRow }) {
  const { t } = useTranslation();
  const { source, meta, notifyCommit } = useApp();
  const { proposal } = props;
  const institutions = meta?.institutions() ?? [];
  const [slug, setSlug] = useState(slugify(proposal.name, 30));
  const [institution, setInstitution] = useState(
    String(proposal.data.institution ?? institutions[0]?.slug ?? ""),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);

  async function run(accept: boolean) {
    setBusy(true);
    setError(null);
    try {
      const inst = institutions.find((i) => i.slug === institution);
      if (accept && proposal.kind === "unit") {
        if (!inst) throw new Error(t("review.institution_select"));
        await source.catalogRequest(
          {
            format: "nexus-catalogo",
            version: 1,
            institutions: [
              { slug: inst.slug, name: inst.name, units: [{ slug, name: proposal.name }] },
            ],
            proposals: { accept: [proposal.id] },
          },
          `catálogo: criar cadeira ${proposal.name}`,
        );
      } else {
        await source.catalogRequest(
          {
            format: "nexus-catalogo",
            version: 1,
            proposals: accept ? { accept: [proposal.id] } : { reject: [proposal.id] },
          },
          `catálogo: ${accept ? "aceitar" : "rejeitar"} ${proposal.id}`,
        );
      }
      notifyCommit();
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t(`review.proposal_${proposal.kind}`, { name: proposal.name })}>
      {done ? (
        <p className="text-sm text-sage">✓ {t("common.pending_sync")}</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-muted">{t("review.evidence")}</p>
            <ul className="list-disc pl-5 text-xs text-ink-soft">
              {proposal.evidence.map((e) => (
                <li key={e.document}>
                  <Link className="underline" to={`/documento/${e.document}?pagina=${e.page ?? 1}`}>
                    «{e.snippet}»
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          {proposal.kind === "unit" && (
            <div className="flex flex-wrap gap-3">
              <label>
                {t("review.slug")}{" "}
                <input
                  className="rounded border border-line-strong px-2 py-1"
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value, 30))}
                />
              </label>
              <label>
                {t("review.institution_select")}{" "}
                <select
                  className="rounded border border-line-strong px-2 py-1"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                >
                  {institutions.map((i) => (
                    <option key={i.slug} value={i.slug}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {error ? <ErrorBox error={error} /> : null}
          <div className="flex gap-2">
            {proposal.kind === "unit" && (
              <Button disabled={busy || !slug || !institution} onClick={() => run(true)}>
                {t("review.create_unit")}
              </Button>
            )}
            <Button variant="danger" disabled={busy} onClick={() => run(false)}>
              {t("review.reject")}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

export function ReviewPage() {
  const { t } = useTranslation();
  const { meta, login, indexLoading, indexError } = useApp();
  const labels = useLabels(meta);
  const [params, setParams] = useSearchParams();
  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;

  const queue = meta.reviewQueue(login);
  const proposals = meta.proposals("open");
  const selectedId = params.get("doc") ?? queue[0]?.id;
  const selected = selectedId ? meta.document(selectedId) : undefined;

  return (
    <div className="space-y-4">
      <PageHeader title={t("review.title")} subtitle={t("review.intro")} />
      {proposals.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            {t("review.proposals")}
          </h2>
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      )}
      {queue.length === 0 && !selected ? (
        <Empty>{t("review.empty")}</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-[18rem_1fr]">
          <ul className="space-y-1">
            {queue.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => setParams({ doc: doc.id })}
                  className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${doc.id === selected?.id ? "bg-pen text-white" : "hover:bg-paper"}`}
                >
                  <span className="block truncate">{doc.source_path ?? doc.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
          {selected && (
            <Card
              key={selected.id}
              title={
                <Link className="underline" to={`/documento/${selected.id}`}>
                  {selected.source_path ?? selected.display_name}
                </Link>
              }
            >
              <div className="space-y-4">
                {selected.review_reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted">{t("review.reasons")}</p>
                    <ReasonList reasons={selected.review_reasons} />
                  </div>
                )}
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted">{t("review.preview")}</p>
                  <Preview sha256={selected.sha256} />
                </div>
                <ReviewForm doc={selected} labels={labels} />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
