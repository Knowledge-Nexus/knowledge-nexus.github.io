// Definições → «Acessos que deste» (só para o dono): ver os códigos, mudar o prazo,
// suspender, reactivar, renovar com um token novo e terminar. O registo fica em
// `acessos.yaml` no repositório de dados (`lib/access.ts`); os códigos, só neste browser.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, ErrorBox, Notice } from "../../components/ui";
import { type FetchLike, GitHubClient } from "../../data/github/client";
import type { GitHubDataSource } from "../../data/source";
import {
  type AccessEntry,
  type AccessState,
  accessState,
  clampUntil,
  newAccessId,
  scopeOf,
  storeCode,
  storedCodes,
  TOKENS_PAGE,
  tokenFingerprint,
} from "../../lib/access";
import { type AccessScope, decodeInvite, encodeInvite, tokenPageUrl } from "../../lib/invite";
import { formatWhen } from "../../lib/labels";

const input = "rounded-lg border border-line-strong bg-sheet px-2 py-1 text-sm";
const DAY = 86_400_000;

const TONE: Record<AccessState, "ok" | "warn" | "neutral" | "info"> = {
  active: "ok",
  paused: "warn",
  revoked: "neutral",
  ended: "neutral",
  token_expired: "neutral",
};

/** "2026-10-24T18:00" (hora local) para o campo de data e hora. */
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

/**
 * Confirma que o token abre o repositório (privado) e que as permissões batem com o tipo de
 * código: acesso total precisa de escrita; «só ver e descarregar» NÃO pode ter escrita (é o
 * próprio GitHub que impede as alterações). Devolve o fim do token.
 */
export async function checkToken(
  token: string,
  owner: string,
  name: string,
  scope: AccessScope = "full",
  fetchImpl?: FetchLike,
): Promise<string | null> {
  const client = new GitHubClient(token.trim(), fetchImpl);
  const info = await client.repo(owner, name).catch(() => null);
  if (!info) throw new Error("no_access");
  if (!info.private) throw new Error("public");
  if (scope === "full" && info.permissions && info.permissions.push === false)
    throw new Error("no_push");
  const writes = await client.canWrite(owner, name);
  if (scope === "read" && writes) throw new Error("not_read_only");
  if (scope === "full" && !writes) throw new Error("read_only_token");
  return client.tokenExpiration;
}

/** Mensagem para os erros de `checkToken`. */
export function tokenErrorText(t: (key: string) => string, reason: string): string {
  const known: Record<string, string> = {
    no_access: "invite.errors.no_access",
    public: "connect.errors.public",
    no_push: "connect.errors.no_push",
    not_read_only: "invite.errors.not_read_only",
    read_only_token: "invite.errors.read_only_token",
  };
  return known[reason] ? t(known[reason]) : reason;
}

export const accessesKey = (source: GitHubDataSource) => [
  "accesses",
  `${source.repo.owner}/${source.repo.name}`,
];

/** Junta um acesso novo ao registo (e à lista mostrada) e guarda o código neste browser. */
export async function registerAccess(
  source: GitHubDataSource,
  queryClient: ReturnType<typeof useQueryClient>,
  entry: AccessEntry,
  code: string,
): Promise<void> {
  const others = (list: AccessEntry[]) => list.filter((e) => e.token_sha256 !== entry.token_sha256);
  await source.patchAccesses(
    (list) => [...others(list), entry],
    `acessos: código para ${entry.name}`,
  );
  storeCode(`${source.repo.owner}/${source.repo.name}`, entry.id, code);
  queryClient.setQueryData<AccessEntry[]>(accessesKey(source), (old) => [
    ...others(old ?? []),
    entry,
  ]);
}

export function AccessManager(props: { source: GitHubDataSource; fetchImpl?: FetchLike }) {
  const { t } = useTranslation();
  const { source } = props;
  const queryClient = useQueryClient();
  const repoName = `${source.repo.owner}/${source.repo.name}`;
  // O ficheiro lido pela API pode vir da cache do browser durante um minuto: as alterações
  // feitas aqui aparecem já (setQueryData) e não se volta a ler logo a seguir.
  const query = useQuery({
    queryKey: accessesKey(source),
    queryFn: () => source.accesses(),
    staleTime: 5 * 60_000,
  });
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const entries = query.data ?? [];
  const codes = storedCodes(repoName);

  async function change(
    id: string,
    mutate: (entry: AccessEntry) => AccessEntry | null,
    message: string,
  ) {
    setError(null);
    setBusy(true);
    const apply = (list: AccessEntry[]) =>
      list.flatMap((e) => {
        if (e.id !== id) return [e];
        const next = mutate(e);
        return next ? [{ ...next, updated_at: new Date().toISOString() }] : [];
      });
    try {
      await source.patchAccesses(apply, message);
      queryClient.setQueryData<AccessEntry[]>(accessesKey(source), (old) => apply(old ?? []));
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  function remember(id: string, code: string | null) {
    storeCode(repoName, id, code);
    // Os códigos lêem-se do armazenamento local em cada desenho: basta redesenhar.
    queryClient.setQueryData<AccessEntry[]>(accessesKey(source), (old) => [...(old ?? [])]);
  }

  const add = (entry: AccessEntry, code: string) =>
    registerAccess(source, queryClient, entry, code);

  return (
    <Card title={t("access.title")}>
      <div className="space-y-4 text-sm">
        <p className="text-ink-soft">{t("access.intro")}</p>
        {query.isLoading && <p className="text-muted">{t("connect.checking")}</p>}
        {query.error ? <ErrorBox error={query.error} /> : null}
        {!query.isLoading && entries.length === 0 && (
          <p className="text-muted italic">{t("access.empty")}</p>
        )}
        <ul className="divide-y divide-line">
          {entries.map((entry) => (
            <AccessRow
              key={entry.id}
              entry={entry}
              code={codes[entry.id]}
              busy={busy}
              repo={source.repo}
              fetchImpl={props.fetchImpl}
              change={(mutate, message) => change(entry.id, mutate, message)}
              remember={(code) => remember(entry.id, code)}
            />
          ))}
        </ul>
        {error ? <ErrorBox error={error} /> : null}
        <ImportCode repo={source.repo} fetchImpl={props.fetchImpl} known={entries} onAdd={add} />
        <p className="text-xs text-muted">
          {t("access.soft_note")}{" "}
          <a className="text-pen underline" href={TOKENS_PAGE} target="_blank" rel="noreferrer">
            {t("invite.revoke_link")}
          </a>
          .
        </p>
      </div>
    </Card>
  );
}

function AccessRow(props: {
  entry: AccessEntry;
  code: string | undefined;
  busy: boolean;
  repo: { owner: string; name: string };
  fetchImpl?: FetchLike;
  change: (mutate: (entry: AccessEntry) => AccessEntry | null, message: string) => Promise<void>;
  remember: (code: string | null) => void;
}) {
  const { t } = useTranslation();
  const { entry } = props;
  const state = accessState(entry);
  const [panel, setPanel] = useState<"code" | "until" | "renew" | null>(null);
  const [untilInput, setUntilInput] = useState(toLocalInput(entry.until));
  const [capped, setCapped] = useState(false);
  const [token, setToken] = useState("");
  const [renewError, setRenewError] = useState<string | null>(null);
  const [revoked, setRevoked] = useState(false);
  const closed = state === "revoked";
  const label = entry.name;
  const scope = scopeOf(entry);

  async function setUntil(wanted: Date) {
    const next = clampUntil(wanted, entry.token_expires);
    setCapped(next.capped);
    setUntilInput(toLocalInput(next.until));
    await props.change(
      // Dar mais tempo a um acesso que tinha acabado volta a abri-lo.
      (e) => ({ ...e, until: next.until }),
      `acessos: prazo de ${label} até ${next.until.slice(0, 16).replace("T", " ")}`,
    );
  }

  function addDays(days: number) {
    const base = Math.max(Date.now(), entry.until ? Date.parse(entry.until) : Date.now());
    void setUntil(new Date(base + days * DAY));
  }

  async function renew() {
    setRenewError(null);
    try {
      const expires = await checkToken(
        token,
        props.repo.owner,
        props.repo.name,
        scope,
        props.fetchImpl,
      );
      const fingerprint = await tokenFingerprint(token);
      const until = entry.until && Date.parse(entry.until) > Date.now() ? entry.until : null;
      const code = encodeInvite({
        repo: `${props.repo.owner}/${props.repo.name}`,
        token: token.trim(),
        name: entry.name,
        ...((until ?? expires) ? { until: (until ?? expires) as string } : {}),
        ...(scope === "read" ? { scope } : {}),
      });
      await props.change(
        (e) => ({
          ...e,
          token_sha256: fingerprint,
          token_hint: token.trim().slice(-4),
          token_expires: expires,
        }),
        `acessos: token novo para ${label}`,
      );
      props.remember(code);
      setToken("");
      setPanel("code");
    } catch (err) {
      setRenewError(tokenErrorText(t, err instanceof Error ? err.message : String(err)));
    }
  }

  async function revoke() {
    if (!window.confirm(t("access.revoke_confirm", { name: entry.name }))) return;
    await props.change((e) => ({ ...e, status: "revoked" }), `acessos: terminar ${label}`);
    props.remember(null);
    setPanel(null);
    setRevoked(true);
  }

  const small = "text-xs text-pen hover:underline disabled:opacity-50";
  return (
    <li className="space-y-2 py-3" aria-label={entry.name}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-ink">{entry.name}</span>
        <Badge tone={TONE[state]}>{t(`access.state.${state}`)}</Badge>
        <Badge tone={scope === "read" ? "info" : "neutral"}>{t(`invite.scope.${scope}`)}</Badge>
        <span className="text-xs text-muted">
          {[
            entry.until ? t("access.until", { when: formatWhen(entry.until) }) : null,
            entry.token_expires
              ? t("access.token_until", { when: formatWhen(entry.token_expires) })
              : t("access.token_no_expiry"),
            t("access.token_hint", { hint: entry.token_hint }),
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </div>
      {!closed && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <button
            type="button"
            className={small}
            onClick={() => setPanel(panel === "code" ? null : "code")}
          >
            {t(panel === "code" ? "access.hide_code" : "access.show_code")}
          </button>
          <button type="button" className={small} disabled={props.busy} onClick={() => addDays(1)}>
            {t("access.add_day")}
          </button>
          <button type="button" className={small} disabled={props.busy} onClick={() => addDays(7)}>
            {t("access.add_week")}
          </button>
          <button
            type="button"
            className={small}
            onClick={() => setPanel(panel === "until" ? null : "until")}
          >
            {t("access.change_until")}
          </button>
          {entry.status === "paused" ? (
            <button
              type="button"
              className={small}
              disabled={props.busy}
              onClick={() =>
                void props.change(
                  (e) => ({ ...e, status: "active" }),
                  `acessos: reactivar ${label}`,
                )
              }
            >
              {t("access.resume")}
            </button>
          ) : (
            <button
              type="button"
              className={small}
              disabled={props.busy}
              onClick={() =>
                void props.change(
                  (e) => ({ ...e, status: "paused" }),
                  `acessos: suspender ${label}`,
                )
              }
            >
              {t("access.pause")}
            </button>
          )}
          <button
            type="button"
            className={small}
            onClick={() => setPanel(panel === "renew" ? null : "renew")}
          >
            {t("access.renew")}
          </button>
          <button
            type="button"
            className="text-xs text-clay hover:underline disabled:opacity-50"
            disabled={props.busy}
            onClick={() => void revoke()}
          >
            {t("access.revoke")}
          </button>
        </div>
      )}
      {closed && (
        <div className="space-y-1 text-xs text-muted">
          {revoked && (
            <p>
              {t("access.revoked_note", { name: entry.name })}{" "}
              <a className="text-pen underline" href={TOKENS_PAGE} target="_blank" rel="noreferrer">
                {t("invite.revoke_link")}
              </a>
            </p>
          )}
          <button
            type="button"
            className={small}
            disabled={props.busy}
            onClick={() => void props.change(() => null, `acessos: retirar ${label} da lista`)}
          >
            {t("access.remove")}
          </button>
        </div>
      )}

      {panel === "code" &&
        (props.code ? (
          <div className="space-y-2">
            <textarea
              readOnly
              aria-label={t("access.code_of", { name: entry.name })}
              className="h-16 w-full rounded-lg border border-line-strong bg-sheet p-2 font-mono text-xs break-all"
              value={props.code}
              onFocus={(e) => e.currentTarget.select()}
            />
            <Button
              variant="secondary"
              onClick={() => void navigator.clipboard?.writeText(props.code ?? "")}
            >
              {t("invite.copy")}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted">{t("access.code_not_here")}</p>
        ))}

      {panel === "until" && (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted">
            {t("access.new_until")}{" "}
            <input
              type="datetime-local"
              className={input}
              value={untilInput}
              onChange={(e) => setUntilInput(e.target.value)}
            />
          </label>
          <Button
            variant="secondary"
            disabled={props.busy || !untilInput}
            onClick={() => void setUntil(new Date(untilInput))}
          >
            {t("access.save_until")}
          </Button>
        </div>
      )}
      {capped && (
        <Notice>
          {t("access.capped", {
            when: entry.token_expires ? formatWhen(entry.token_expires) : "",
          })}
        </Notice>
      )}

      {panel === "renew" && (
        <div className="space-y-2 rounded-xl border border-line bg-paper p-3 text-xs">
          <p className="text-ink-soft">
            {t("access.renew_help")} {t(`invite.scope_token.${scope}`)}
          </p>
          <a
            className="text-pen underline"
            href={tokenPageUrl(props.repo.owner, props.repo.name, entry.name, 30, scope)}
            target="_blank"
            rel="noreferrer"
          >
            {t("invite.create_token")}
          </a>
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-muted">
              {t("invite.token")}{" "}
              <input
                type="password"
                autoComplete="off"
                className={`${input} font-mono`}
                value={token}
                onChange={(e) => setToken(e.target.value)}
              />
            </label>
            <Button disabled={props.busy || !token.trim()} onClick={() => void renew()}>
              {t("access.renew_save")}
            </Button>
          </div>
          {renewError && <p className="text-clay">{renewError}</p>}
        </div>
      )}
    </li>
  );
}

/** Juntar à lista um código feito antes da gestão de acessos (ou noutro browser). */
function ImportCode(props: {
  repo: { owner: string; name: string };
  fetchImpl?: FetchLike;
  known: AccessEntry[];
  onAdd: (entry: AccessEntry, code: string) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setMessage(null);
    const invite = decodeInvite(code);
    const repo = `${props.repo.owner}/${props.repo.name}`;
    if (!invite) return setMessage(t("connect.errors.code_invalid"));
    if (invite.repo.toLowerCase() !== repo.toLowerCase())
      return setMessage(t("access.import_other_repo"));
    setBusy(true);
    try {
      const fingerprint = await tokenFingerprint(invite.token);
      if (props.known.some((e) => e.token_sha256 === fingerprint))
        return setMessage(t("access.import_known"));
      const scope = invite.scope ?? "full";
      const expires = await checkToken(
        invite.token,
        props.repo.owner,
        props.repo.name,
        scope,
        props.fetchImpl,
      ).catch((err: unknown) => {
        const reason = err instanceof Error ? err.message : "";
        // Um token que não bate com o tipo do código diz porquê; o resto é um token que já
        // não abre o repositório (expirou ou foi apagado).
        if (reason === "not_read_only" || reason === "read_only_token")
          throw new Error(tokenErrorText(t, reason));
        throw new Error(t("connect.errors.code_expired"));
      });
      const now = new Date().toISOString();
      await props.onAdd(
        {
          id: newAccessId(),
          name: invite.name,
          token_sha256: fingerprint,
          token_hint: invite.token.slice(-4),
          token_expires: expires,
          until: invite.until ?? expires,
          status: "active",
          ...(scope === "read" ? { scope } : {}),
          created_at: now,
        },
        code.trim(),
      );
      setCode("");
      setOpen(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="text-xs text-pen hover:underline"
        onClick={() => setOpen(true)}
      >
        {t("access.import_open")}
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-line bg-paper p-3 text-xs">
      <p className="text-ink-soft">{t("access.import_help")}</p>
      <textarea
        aria-label={t("access.import_label")}
        className="h-16 w-full rounded-lg border border-line-strong bg-sheet p-2 font-mono break-all"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <div className="flex gap-2">
        <Button disabled={busy || !code.trim()} onClick={() => void submit()}>
          {t("access.import_save")}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => setOpen(false)}>
          {t("unit_edit.cancel")}
        </Button>
      </div>
      {message && <p className="text-clay">{message}</p>}
    </div>
  );
}
