// Contas nas Definições. O dono vê os pedidos de acesso, dá e tira papéis, suspende, põe
// prazos, cria convites e ligações para repor a palavra-passe (com o token dele do GitHub).
// Quem entrou com conta vê só a sua (nome e palavra-passe).

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Card, ErrorBox, Spinner } from "../../components/ui";
import {
  type AccountRole,
  type AccountSession,
  AccountsApi,
  type AccountUser,
  siteLink,
} from "../../data/accounts";
import { formatWhen } from "../../lib/labels";
import { useAccountError } from "../entry/EntryDialogs";

const input = "rounded-xl border border-line-strong bg-white px-2.5 py-1.5 text-sm";
const dateOnly = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
/** Fim do dia escolhido (o acesso vale o dia inteiro). */
const endOfDay = (date: string) => (date ? `${date}T23:59:59Z` : null);

function CopyField(props: { label: string; value: string }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={`${input} min-w-0 flex-1 font-mono text-xs`}
        readOnly
        aria-label={props.label}
        value={props.value}
        onFocus={(e) => e.target.select()}
      />
      <Button
        variant="secondary"
        onClick={() =>
          void navigator.clipboard?.writeText(props.value).then(
            () => setCopied(true),
            () => {},
          )
        }
      >
        {copied ? t("invite.copied") : t("invite.copy")}
      </Button>
    </div>
  );
}

function accountState(user: AccountUser): "waiting" | "paused" | "ended" | "active" {
  if (user.role === "none") return "waiting";
  if (user.status === "paused") return "paused";
  if (user.until && Date.parse(user.until) < Date.now()) return "ended";
  return "active";
}

function UserRow(props: { user: AccountUser; api: AccountsApi; token: string }) {
  const { t } = useTranslation();
  const message = useAccountError();
  const queryClient = useQueryClient();
  const { user, api, token } = props;
  const [reset, setReset] = useState<string | null>(null);
  const state = accountState(user);
  const update = useMutation({
    mutationFn: (patch: Parameters<AccountsApi["updateUser"]>[2]) =>
      api.updateUser(token, user.id, patch),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["accounts-users"] }),
  });
  const remove = useMutation({
    mutationFn: () => api.removeUser(token, user.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["accounts-users"] }),
  });
  const resetLink = useMutation({
    mutationFn: () => api.resetLink(token, user.id),
    onSuccess: (data) => setReset(siteLink(`/repor/${data.code}`)),
  });
  const error = update.error ?? remove.error ?? resetLink.error;
  const busy = update.isPending || remove.isPending;

  return (
    <li aria-label={user.name} className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{user.name}</span>
        <span className="text-xs text-muted">{user.email}</span>
        <Badge tone={state === "active" ? "ok" : state === "waiting" ? "warn" : "neutral"}>
          {t(`accounts.admin.state.${state}`)}
        </Badge>
        <span className="text-xs text-muted">
          {user.last_seen_at
            ? t("accounts.admin.last_seen", { when: formatWhen(user.last_seen_at) })
            : t("accounts.admin.created", { when: formatWhen(user.created_at) })}
        </span>
      </div>
      {state === "waiting" ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => update.mutate({ role: "reader" })}>
            {t("accounts.admin.give_reader")}
          </Button>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => update.mutate({ role: "editor" })}
          >
            {t("accounts.admin.give_editor")}
          </Button>
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t("accounts.admin.refuse_confirm", { name: user.name })))
                remove.mutate();
            }}
          >
            {t("accounts.admin.refuse")}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <select
            className={input}
            aria-label={t("accounts.admin.role_of", { name: user.name })}
            value={user.role}
            disabled={busy}
            onChange={(e) => update.mutate({ role: e.target.value as AccountRole })}
          >
            {(["reader", "editor", "none"] as const).map((role) => (
              <option key={role} value={role}>
                {t(`accounts.roles.${role}`)}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
            {t("accounts.admin.until")}
            <input
              type="date"
              className={input}
              aria-label={t("accounts.admin.until_of", { name: user.name })}
              value={dateOnly(user.until)}
              disabled={busy}
              onChange={(e) => update.mutate({ until: endOfDay(e.target.value) })}
            />
          </label>
          {user.until && (
            <Button variant="ghost" disabled={busy} onClick={() => update.mutate({ until: null })}>
              {t("accounts.admin.no_until")}
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              update.mutate({ status: user.status === "paused" ? "active" : "paused" })
            }
          >
            {user.status === "paused" ? t("accounts.admin.resume") : t("accounts.admin.pause")}
          </Button>
          {user.password && (
            <Button variant="ghost" disabled={busy} onClick={() => resetLink.mutate()}>
              {t("accounts.admin.reset")}
            </Button>
          )}
          <Button
            variant="danger"
            disabled={busy}
            onClick={() => {
              if (window.confirm(t("accounts.admin.remove_confirm", { name: user.name })))
                remove.mutate();
            }}
          >
            {t("accounts.admin.remove")}
          </Button>
        </div>
      )}
      {reset && (
        <div className="space-y-1">
          <p className="text-xs text-ink-soft">
            {t("accounts.admin.reset_ready", { name: user.name })}
          </p>
          <CopyField label={t("accounts.admin.reset_link")} value={reset} />
        </div>
      )}
      {error ? <ErrorBox error={message(error)} /> : null}
    </li>
  );
}

function InvitesCard(props: { api: AccountsApi; token: string }) {
  const { t } = useTranslation();
  const message = useAccountError();
  const queryClient = useQueryClient();
  const { api, token } = props;
  const invites = useQuery({
    queryKey: ["accounts-invites"],
    queryFn: () => api.invites(token),
  });
  const [role, setRole] = useState<AccountRole>("reader");
  const [label, setLabel] = useState("");
  const [until, setUntil] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const create = useMutation({
    mutationFn: () =>
      api.createInvite(token, {
        role,
        ...(label.trim() ? { label: label.trim() } : {}),
        until: endOfDay(until),
      }),
    onSuccess: (data) => {
      setLink(siteLink(`/convite/${data.code}`));
      setLabel("");
      void queryClient.invalidateQueries({ queryKey: ["accounts-invites"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.removeInvite(token, id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["accounts-invites"] }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    setLink(null);
    create.mutate();
  }

  return (
    <Card title={t("accounts.admin.invites_title")}>
      <p className="mb-3 text-sm text-ink-soft">{t("accounts.admin.invites_intro")}</p>
      <form className="flex flex-wrap items-end gap-3 text-sm" onSubmit={submit}>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-soft">
            {t("accounts.admin.invite_role")}
          </span>
          <select
            className={input}
            value={role}
            onChange={(e) => setRole(e.target.value as AccountRole)}
          >
            <option value="reader">{t("accounts.roles.reader")}</option>
            <option value="editor">{t("accounts.roles.editor")}</option>
          </select>
        </label>
        <label className="flex min-w-48 flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-ink-soft">
            {t("accounts.admin.invite_label")}
          </span>
          <input className={input} value={label} onChange={(e) => setLabel(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-ink-soft">
            {t("accounts.admin.invite_until")}
          </span>
          <input
            type="date"
            className={input}
            value={until}
            onChange={(e) => setUntil(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={create.isPending}>
          {t("accounts.admin.invite_create")}
        </Button>
      </form>
      {link && (
        <div className="mt-3 space-y-1 rounded-xl border border-sage/30 bg-sage-soft p-3">
          <p className="text-xs text-sage">{t("accounts.admin.invite_ready")}</p>
          <CopyField label={t("accounts.admin.invite_link")} value={link} />
        </div>
      )}
      {create.error ? <ErrorBox error={message(create.error)} /> : null}
      {invites.data && invites.data.invites.length > 0 && (
        <ul className="mt-4 divide-y divide-line text-sm">
          {invites.data.invites.map((invite) => {
            const expired = !invite.used_by && Date.parse(invite.expires_at) < Date.now();
            return (
              <li key={invite.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
                <span className="font-medium">
                  {invite.label ?? t("accounts.admin.invite_no_label")}
                </span>
                <span className="text-xs text-muted">{t(`accounts.roles.${invite.role}`)}</span>
                <span className="flex-1 text-xs text-muted">
                  {invite.used_by
                    ? t("accounts.admin.invite_used", {
                        name: invite.used_by_name ?? invite.used_by,
                        when: formatWhen(invite.used_at ?? invite.created_at),
                      })
                    : expired
                      ? t("accounts.admin.invite_expired")
                      : t("accounts.admin.invite_open", { when: formatWhen(invite.expires_at) })}
                </span>
                <Button
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(invite.id)}
                >
                  {t("accounts.admin.invite_remove")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

/** Só o dono (entrou com o token dele do GitHub). */
export function AccountsManager(props: { token: string }) {
  const { t } = useTranslation();
  const message = useAccountError();
  const api = useMemo(() => new AccountsApi(), []);
  const config = useQuery({
    queryKey: ["accounts-config", api.base],
    queryFn: () => api.config(),
    staleTime: 5 * 60 * 1000,
  });
  const users = useQuery({
    queryKey: ["accounts-users"],
    enabled: Boolean(config.data),
    queryFn: () => api.users(props.token),
  });

  if (config.isLoading)
    return (
      <Card title={t("accounts.admin.title")}>
        <Spinner />
      </Card>
    );
  if (!config.data)
    return (
      <Card title={t("accounts.admin.title")}>
        <p className="text-sm text-ink-soft">{t("accounts.admin.off")}</p>
      </Card>
    );
  const list = users.data?.users ?? [];
  const waiting = list.filter((u) => u.role === "none");
  const others = list.filter((u) => u.role !== "none");
  return (
    <>
      <Card title={t("accounts.admin.title")}>
        <p className="mb-2 text-sm text-ink-soft">{t("accounts.admin.intro")}</p>
        {users.isLoading && <Spinner />}
        {users.error ? <ErrorBox error={message(users.error)} /> : null}
        {waiting.length > 0 && (
          <section className="mt-3 rounded-xl border border-marker/60 bg-marker-soft/60 px-4">
            <h3 className="pt-3 text-sm font-semibold">
              {t("accounts.admin.waiting", { count: waiting.length })}
            </h3>
            <ul className="divide-y divide-line">
              {waiting.map((user) => (
                <UserRow key={user.id} user={user} api={api} token={props.token} />
              ))}
            </ul>
          </section>
        )}
        {others.length > 0 ? (
          <ul className="mt-2 divide-y divide-line">
            {others.map((user) => (
              <UserRow key={user.id} user={user} api={api} token={props.token} />
            ))}
          </ul>
        ) : (
          !users.isLoading &&
          waiting.length === 0 && <p className="text-sm text-muted">{t("accounts.admin.none")}</p>
        )}
      </Card>
      <InvitesCard api={api} token={props.token} />
    </>
  );
}

/** A conta de quem entrou (nome e palavra-passe). */
export function AccountCard(props: { account: AccountSession }) {
  const { t } = useTranslation();
  const message = useAccountError();
  const { account } = props;
  const [name, setName] = useState(account.user.name);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: (patch: Parameters<AccountsApi["updateMe"]>[1]) =>
      account.api.updateMe(account.token, patch),
    onSuccess: (_, patch) => {
      setDone(patch.password ? t("accounts.password_changed") : t("accounts.saved"));
      setCurrent("");
      setPassword("");
    },
  });

  return (
    <Card title={t("accounts.mine")}>
      <div className="space-y-4 text-sm">
        <p>
          {account.user.email} · <strong>{t(`accounts.roles.${account.user.access}`)}</strong>
          {account.user.until
            ? ` ${t("accounts.until", { when: formatWhen(account.user.until) })}`
            : ""}
        </p>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ name });
          }}
        >
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-soft">{t("accounts.name")}</span>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <Button type="submit" variant="secondary" disabled={save.isPending}>
            {t("common.save")}
          </Button>
        </form>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({ password, ...(account.user.password ? { current } : {}) });
          }}
        >
          {account.user.password && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-ink-soft">
                {t("accounts.current_password")}
              </span>
              <input
                className={input}
                type="password"
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </label>
          )}
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-ink-soft">{t("accounts.new_password")}</span>
            <input
              className={input}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button type="submit" variant="secondary" disabled={save.isPending || !password}>
            {t("accounts.change_password")}
          </Button>
        </form>
        {done && <p className="text-sage">✓ {done}</p>}
        {save.error ? <ErrorBox error={message(save.error)} /> : null}
      </div>
    </Card>
  );
}
