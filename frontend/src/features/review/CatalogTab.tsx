// «Em falta no catálogo»: as instituições, os cursos e as cadeiras que o material refere e
// ainda não existem, numa tabela pela ordem em que se criam. Criar uma cadeira arruma os
// documentos que esperavam por ela (o motor reclassifica-os).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Button, Empty, ErrorBox } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle, ProposalRow } from "../../data/types";
import { slugify } from "../../lib/normalize";

export interface InstitutionChoice {
  key: string;
  slug: string;
  name: string;
  acronym?: string;
  proposalId?: string;
}

/** Instituições disponíveis para uma cadeira: as do catálogo e as propostas em aberto. */
export function institutionChoices(
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
  /** Nome escolhido; se for outro, o nome proposto fica como nome alternativo. */
  name?: string;
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
        units: units.map((u) => {
          const name = u.name?.trim() || u.proposal.name;
          return {
            slug: u.slug,
            name,
            ...(u.acronym ? { acronym: u.acronym } : {}),
            ...(name !== u.proposal.name ? { aliases: [u.proposal.name] } : {}),
          };
        }),
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

/** A instituição sugerida para as cadeiras propostas: a que elas indicam, a única que já
 * existe, ou a primeira. */
function preferredInstitution(units: ProposalRow[], choices: InstitutionChoice[]): string {
  const named = new Set(units.map((u) => u.data.institution).filter((v) => typeof v === "string"));
  const existing = choices.filter((c) => !c.proposalId);
  if (named.size === 1) {
    const match = existing.find((c) => named.has(c.slug));
    if (match) return match.key;
  }
  return (existing.length === 1 ? existing[0] : choices[0])?.key ?? "";
}

/** O cimo da tabela: todas as cadeiras de uma vez, numa instituição (existente ou proposta). */
function AcceptAll(props: {
  proposals: ProposalRow[];
  choices: InstitutionChoice[];
  waiting: number;
}) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const units = props.proposals.filter((p) => p.kind === "unit");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [key, setKey] = useState(() => preferredInstitution(units, props.choices));
  const institution = props.choices.find((c) => c.key === key);
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
          <p className="flex flex-1 flex-wrap items-center gap-2">
            {t("review.catalog_all_text", { count: units.length, institution: institution.name })}
            {props.choices.length > 1 && (
              <select
                aria-label={t("review.accept_all_institution")}
                className="rounded-lg border border-line-strong bg-sheet px-2 py-1"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              >
                {props.choices.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.proposalId ? t("review.new_institution", { name: c.name }) : c.name}
                  </option>
                ))}
              </select>
            )}
            {props.waiting > 0 && t("review.catalog_all_waiting", { count: props.waiting })}
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

/** Onde o nome apareceu (fechado: abre-se só quando é preciso). */
function Evidence(props: { proposal: ProposalRow }) {
  const { t } = useTranslation();
  const { to } = useApp();
  const { evidence } = props.proposal;
  if (evidence.length === 0) return <span className="text-muted">—</span>;
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-pen underline">
        {t("review.evidence_see", { count: evidence.length })}
      </summary>
      <ul className="mt-1 max-w-xs list-disc space-y-0.5 pl-4 text-ink-soft">
        {evidence.slice(0, 5).map((e) => (
          <li key={e.document}>
            <Link className="underline" to={to(`/documento/${e.document}?pagina=${e.page ?? 1}`)}>
              «{e.snippet}»
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}

const CELL = "border-b border-line px-3 py-2 align-middle";
const INPUT = "w-full rounded-lg border border-line bg-white px-2 py-1 text-sm";

function ProposalLine(props: {
  proposal: ProposalRow;
  choices: InstitutionChoice[];
  waiting: number;
}) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const { proposal, choices } = props;
  const [acronym, setAcronym] = useState(proposalAcronym(proposal));
  const [name, setName] = useState(proposal.name);
  const suggested = choices.find((c) => c.slug === proposal.data.institution) ?? choices[0];
  const [institutionKey, setInstitutionKey] = useState(suggested?.key ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [done, setDone] = useState(false);
  const slug = slugify(acronym || name || proposal.name, 30);

  async function run(accept: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (accept && proposal.kind === "unit") {
        const inst = choices.find((c) => c.key === institutionKey);
        if (!inst) throw new Error(t("review.institution_select"));
        await source.catalogRequest(
          catalogBundle(inst, [{ proposal, slug, acronym, name }]),
          `catálogo: criar cadeira ${name.trim() || proposal.name}`,
        );
      } else if (accept && proposal.kind === "institution") {
        await source.catalogRequest(
          {
            format: "nexus-catalogo",
            version: 1,
            institutions: [
              {
                slug,
                name: name.trim() || proposal.name,
                ...(acronym ? { acronym } : {}),
                ...(name.trim() && name.trim() !== proposal.name
                  ? { aliases: [proposal.name] }
                  : {}),
              },
            ],
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

  const editable = proposal.kind !== "course";
  if (done)
    return (
      <tr>
        <td className={`${CELL} text-sage`} colSpan={6}>
          ✓ {proposal.name}: {t("common.pending_sync")}
        </td>
      </tr>
    );
  return (
    <>
      <tr>
        <td className={CELL}>
          {editable ? (
            <input
              className={INPUT}
              aria-label={t("review.name")}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : (
            <span className="font-medium">{proposal.name}</span>
          )}
        </td>
        <td className={CELL}>
          {editable ? (
            <input
              className={INPUT}
              aria-label={t("review.acronym")}
              value={acronym}
              onChange={(e) => setAcronym(e.target.value.trim())}
            />
          ) : null}
        </td>
        <td className={CELL}>
          {proposal.kind === "unit" ? (
            <select
              className={INPUT}
              aria-label={t("review.institution_select")}
              value={institutionKey}
              onChange={(e) => setInstitutionKey(e.target.value)}
            >
              {choices.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.proposalId ? t("review.new_institution", { name: c.name }) : c.name}
                </option>
              ))}
            </select>
          ) : null}
        </td>
        <td className={CELL}>
          {proposal.kind === "unit" ? (
            <span
              className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${props.waiting ? "bg-pen-soft text-pen" : "bg-paper text-muted"}`}
            >
              {t("review.waiting_docs", { count: props.waiting })}
            </span>
          ) : (
            <span className="text-muted">—</span>
          )}
        </td>
        <td className={CELL}>
          <Evidence proposal={proposal} />
        </td>
        <td className={`${CELL} whitespace-nowrap text-right`}>
          <span className="inline-flex gap-1.5">
            <Button disabled={busy || !slug} onClick={() => void run(true)}>
              {t("review.create")}
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => void run(false)}>
              {t("review.reject")}
            </Button>
          </span>
        </td>
      </tr>
      {error ? (
        <tr>
          <td className={CELL} colSpan={6}>
            <ErrorBox error={error} />
          </td>
        </tr>
      ) : null}
    </>
  );
}

const KINDS = ["institution", "course", "unit"] as const;

/** O separador: o botão «Criar tudo» e uma tabela por tipo (instituições, cursos, cadeiras). */
export function CatalogTab(props: { proposals: ProposalRow[]; waiting: Map<string, number> }) {
  const { t } = useTranslation();
  const { meta } = useApp();
  if (!meta) return null;
  const choices = institutionChoices(meta.institutions(), props.proposals);
  if (props.proposals.length === 0) return <Empty>{t("review.catalog_empty")}</Empty>;
  const total = [...props.waiting.values()].reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-5">
      <AcceptAll proposals={props.proposals} choices={choices} waiting={total} />
      {KINDS.filter((kind) => props.proposals.some((p) => p.kind === kind)).map((kind, index) => {
        const rows = props.proposals
          .filter((p) => p.kind === kind)
          .sort(
            (a, b) =>
              (props.waiting.get(b.id) ?? 0) - (props.waiting.get(a.id) ?? 0) ||
              a.name.localeCompare(b.name, "pt"),
          );
        return (
          <div key={kind} className="overflow-x-auto">
            <table className="w-full min-w-[46rem] table-fixed border-separate border-spacing-0 overflow-hidden rounded-2xl border border-line bg-sheet text-sm">
              <caption className="px-1 pb-2 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {t(`review.catalog_kind_${kind}`, { n: index + 1, count: rows.length })}
              </caption>
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-28" />
                <col className="w-[22%]" />
                <col className="w-32" />
                <col className="w-28" />
                <col className="w-48" />
              </colgroup>
              <thead>
                <tr className="bg-paper/60 text-left text-xs text-muted">
                  <th className={`${CELL} font-semibold`}>{t("review.name")}</th>
                  <th className={`${CELL} font-semibold`}>
                    {kind === "course" ? "" : t("review.acronym")}
                  </th>
                  <th className={`${CELL} font-semibold`}>
                    {kind === "unit" ? t("review.institution_select") : ""}
                  </th>
                  <th className={`${CELL} font-semibold`}>{t("review.waiting")}</th>
                  <th className={`${CELL} font-semibold`}>{t("review.evidence_where")}</th>
                  <th className={CELL} />
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <ProposalLine
                    key={p.id}
                    proposal={p}
                    choices={choices}
                    waiting={props.waiting.get(p.id) ?? 0}
                  />
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
