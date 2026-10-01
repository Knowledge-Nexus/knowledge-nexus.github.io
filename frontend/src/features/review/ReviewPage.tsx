import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { DocumentPreview } from "../../components/DocumentViewer";
import {
  Button,
  Card,
  Empty,
  ErrorBox,
  Notice,
  PageHeader,
  ReasonList,
  Spinner,
} from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, DocumentRow, ProposalRow } from "../../data/types";
import { useLabels } from "../../lib/labels";
import { slugify } from "../../lib/normalize";
import { BulkReview } from "./BulkReview";
import { ReviewForm } from "./ReviewForm";

interface InstitutionChoice {
  key: string;
  slug: string;
  name: string;
  acronym?: string;
  proposalId?: string;
}

/** Instituições disponíveis para uma cadeira: as do catálogo e as propostas em aberto. */
function institutionChoices(
  existing: { slug: string; name: string; acronym: string | null }[],
  proposals: ProposalRow[],
): InstitutionChoice[] {
  const out: InstitutionChoice[] = existing.map((i) => ({
    key: `i:${i.slug}`,
    slug: i.slug,
    name: i.name,
    ...(i.acronym ? { acronym: i.acronym } : {}),
  }));
  for (const p of proposals.filter((x) => x.kind === "institution")) {
    const acronym = typeof p.data.acronym === "string" ? p.data.acronym : undefined;
    out.push({
      key: `p:${p.id}`,
      slug: slugify(acronym ?? p.name, 30),
      name: p.name,
      ...(acronym ? { acronym } : {}),
      proposalId: p.id,
    });
  }
  return out;
}

interface UnitChoice {
  proposal: ProposalRow;
  slug: string;
  acronym: string;
}

const proposalAcronym = (p: ProposalRow) =>
  typeof p.data.acronym === "string" ? p.data.acronym : "";

const defaultSlug = (p: ProposalRow) => slugify(proposalAcronym(p) || p.name, 30);

/** Pedido de catálogo: cria a instituição (se for proposta) e as cadeiras, e aceita as
 * propostas. O motor aplica-o e reclassifica o que estava à espera. */
function catalogBundle(institution: InstitutionChoice, units: UnitChoice[]): CatalogBundle {
  return {
    format: "nexus-catalogo",
    version: 1,
    institutions: [
      {
        slug: institution.slug,
        name: institution.name,
        ...(institution.acronym ? { acronym: institution.acronym } : {}),
        units: units.map((u) => ({
          slug: u.slug,
          name: u.proposal.name,
          ...(u.acronym ? { acronym: u.acronym } : {}),
        })),
      },
    ],
    proposals: {
      accept: [
        ...units.map((u) => u.proposal.id),
        ...(institution.proposalId ? [institution.proposalId] : []),
      ],
    },
  };
}

function Evidence(props: { proposal: ProposalRow }) {
  const { t } = useTranslation();
  const { to } = useApp();
  return (
    <div>
      <p className="text-xs font-semibold text-muted">
        {t("review.evidence_count", { count: props.proposal.evidence.length })}
      </p>
      <ul className="list-disc pl-5 text-xs text-ink-soft">
        {props.proposal.evidence.slice(0, 3).map((e) => (
          <li key={e.document}>
            <Link className="underline" to={to(`/documento/${e.document}?pagina=${e.page ?? 1}`)}>
              «{e.snippet}»
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Um clique: a instituição proposta (ou a única existente) com todas as cadeiras propostas. */
function AcceptAll(props: { proposals: ProposalRow[]; choices: InstitutionChoice[] }) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const units = props.proposals.filter((p) => p.kind === "unit");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const institution = props.choices.length === 1 ? props.choices[0] : undefined;
  if (!institution || units.length === 0) return null;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const chosen = units.map((p) => ({
        proposal: p,
        slug: defaultSlug(p),
        acronym: proposalAcronym(p),
      }));
      await source.catalogRequest(
        catalogBundle(institution!, chosen),
        `catálogo: ${institution!.name} + ${units.length} cadeira(s)`,
      );
      notifyCommit();
      setDone(true);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-marker/60 bg-marker-soft p-4 text-sm">
      {done ? (
        <p className="text-sage">✓ {t("review.accept_all_done")}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="flex-1">
            {t("review.accept_all_text", {
              institution: institution.name,
              units: units
                .map((u) => (proposalAcronym(u) ? `${u.name} (${proposalAcronym(u)})` : u.name))
                .join(", "),
            })}
          </p>
          <Button onClick={() => void run()} disabled={busy}>
            {t("review.accept_all")}
          </Button>
        </div>
      )}
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}

function ProposalCard(props: { proposal: ProposalRow; choices: InstitutionChoice[] }) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const { proposal, choices } = props;
  const [slug, setSlug] = useState(defaultSlug(proposal));
  const [acronym, setAcronym] = useState(proposalAcronym(proposal));
  const suggested = choices.find((c) => c.slug === proposal.data.institution) ?? choices[0];
  const [institutionKey, setInstitutionKey] = useState(suggested?.key ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);

  async function run(accept: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (accept && proposal.kind === "unit") {
        const inst = choices.find((c) => c.key === institutionKey);
        if (!inst) throw new Error(t("review.institution_select"));
        await source.catalogRequest(
          catalogBundle(inst, [{ proposal, slug, acronym }]),
          `catálogo: criar cadeira ${proposal.name}`,
        );
      } else if (accept && proposal.kind === "institution") {
        await source.catalogRequest(
          {
            format: "nexus-catalogo",
            version: 1,
            institutions: [{ slug, name: proposal.name, ...(acronym ? { acronym } : {}) }],
            proposals: { accept: [proposal.id] },
          },
          `catálogo: criar instituição ${proposal.name}`,
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

  const editable = proposal.kind === "unit" || proposal.kind === "institution";
  const input = "rounded-lg border border-line-strong bg-sheet px-2 py-1";
  return (
    <Card title={t(`review.proposal_${proposal.kind}`, { name: proposal.name })}>
      {done ? (
        <p className="text-sm text-sage">✓ {t("common.pending_sync")}</p>
      ) : (
        <div className="space-y-3 text-sm">
          <Evidence proposal={proposal} />
          {editable && (
            <div className="flex flex-wrap gap-3">
              <label>
                {t("review.acronym")}{" "}
                <input
                  className={`${input} w-24`}
                  value={acronym}
                  onChange={(e) => setAcronym(e.target.value.trim())}
                />
              </label>
              <label>
                {t("review.slug")}{" "}
                <input
                  className={input}
                  value={slug}
                  onChange={(e) => setSlug(slugify(e.target.value, 30))}
                />
              </label>
              {proposal.kind === "unit" && (
                <label>
                  {t("review.institution_select")}{" "}
                  <select
                    className={input}
                    value={institutionKey}
                    onChange={(e) => setInstitutionKey(e.target.value)}
                  >
                    {choices.map((c) => (
                      <option key={c.key} value={c.key}>
                        {c.proposalId ? t("review.new_institution", { name: c.name }) : c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}
          {error ? <ErrorBox error={error} /> : null}
          <div className="flex gap-2">
            {proposal.kind === "unit" && (
              <Button disabled={busy || !slug || !institutionKey} onClick={() => run(true)}>
                {t("review.create_unit")}
              </Button>
            )}
            {proposal.kind === "institution" && (
              <Button disabled={busy || !slug} onClick={() => run(true)}>
                {t("review.create_institution")}
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
  const [checked, setChecked] = useState<Set<string>>(new Set());
  if (indexError) return <ErrorBox error={indexError} />;
  if (indexLoading) return <Spinner />;
  if (!meta) return <Empty>{t("pipeline.no_indices")}</Empty>;

  const fullQueue = meta.reviewQueue(login);
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
  // Grupos de documentos "idênticos": mesma sugestão de cadeira, tipo e papel.
  const groupMap = new Map<string, { key: string; label: string; docs: typeof queue }>();
  for (const doc of queue) {
    const c = doc.classification;
    const key = [c.unit?.value, c.document_type?.value, c.role?.value].join("|");
    const label = [
      c.unit?.value ? labels.unit(String(c.unit.value)) : t("library.no_unit"),
      c.document_type?.value ? labels.term("document_types", String(c.document_type.value)) : null,
      c.role?.value ? labels.term("roles", String(c.role.value)) : null,
    ]
      .filter(Boolean)
      .join(" · ");
    const group = groupMap.get(key) ?? { key, label, docs: [] };
    group.docs.push(doc);
    groupMap.set(key, group);
  }
  const groups = [...groupMap.values()].sort((a, b) => b.docs.length - a.docs.length);
  const toggle = (ids: string[], on: boolean) =>
    setChecked((current) => {
      const next = new Set(current);
      for (const id of ids) {
        if (on) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  const proposals = meta.proposals("open");
  const choices = institutionChoices(meta.institutions(), proposals);
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
          <AcceptAll proposals={proposals} choices={choices} />
          {proposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} choices={choices} />
          ))}
        </div>
      )}
      {queue.length === 0 && !selected ? (
        <Empty>{t("review.empty")}</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-[20rem_1fr]">
          <div className="space-y-3">
            {groups.map((group) => {
              const ids = group.docs.map((d) => d.id);
              const all = ids.every((id) => checked.has(id));
              return (
                <div key={group.key} className="rounded-xl border border-line bg-sheet/60 p-2">
                  <label className="flex items-center gap-2 px-1 pb-1 text-xs font-semibold text-muted">
                    <input
                      type="checkbox"
                      checked={all}
                      onChange={() => toggle(ids, !all)}
                      aria-label={t("review.select_group", { label: group.label })}
                    />
                    <span className="flex-1 truncate" title={group.label}>
                      {group.label}
                    </span>
                    <span>{group.docs.length}</span>
                  </label>
                  <ul className="space-y-0.5">
                    {group.docs.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked.has(doc.id)}
                          onChange={() => toggle([doc.id], !checked.has(doc.id))}
                          aria-label={doc.source_path ?? doc.display_name}
                        />
                        <button
                          type="button"
                          onClick={() => setParams({ doc: doc.id })}
                          className={`min-w-0 flex-1 rounded-lg px-2 py-1 text-left text-sm ${doc.id === selected?.id && checked.size < 2 ? "bg-pen text-white" : "hover:bg-paper"}`}
                        >
                          <span className="block truncate">
                            {doc.source_path?.split("/").pop() ?? doc.display_name}
                          </span>
                          {followers.has(doc.id) && (
                            <span
                              className={`block truncate text-xs ${doc.id === selected?.id && checked.size < 2 ? "text-white/80" : "text-muted"}`}
                            >
                              {t("bundle.followers", {
                                count: followers.get(doc.id)?.length ?? 0,
                                name: doc.bundle_name,
                              })}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          {checked.size >= 2 ? (
            <BulkReview
              key={[...checked].sort().join(",")}
              docs={queue.filter((d) => checked.has(d.id))}
              labels={labels}
            />
          ) : null}
          {checked.size < 2 && selected && (
            <Card
              key={selected.id}
              title={
                <Link className="underline" to={`/documento/${selected.id}`}>
                  {selected.source_path ?? selected.display_name}
                </Link>
              }
            >
              <div className="space-y-4">
                {selected.bundle_id && (
                  <Notice>
                    {t(
                      selected.bundle_lead === selected.id
                        ? "bundle.review_lead"
                        : "bundle.review_member",
                      {
                        name: selected.bundle_name,
                        count: meta.bundleMembers(selected.bundle_id).length,
                      },
                    )}
                  </Notice>
                )}
                {selected.review_reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted">{t("review.reasons")}</p>
                    <ReasonList reasons={selected.review_reasons} />
                  </div>
                )}
                <div>
                  <p className="mb-1 text-xs font-semibold text-muted">{t("review.preview")}</p>
                  <DocumentPreview doc={selected} />
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
