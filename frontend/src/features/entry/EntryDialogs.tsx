// Os popups da entrada: conta (entrar e criar), código de acesso (KN1-…, como até aqui),
// administrador (repositório + token do GitHub) e repor a palavra-passe.

import { useQuery } from "@tanstack/react-query";
import { type FormEvent, type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconGoogle, IconShield, IconTicket, IconUser, IconUserPlus } from "../../components/icons";
import { Modal } from "../../components/Modal";
import { Button, ErrorBox } from "../../components/ui";
import {
  AccountError,
  type AccountsApi,
  type AccountsConfig,
  type SignedIn,
} from "../../data/accounts";
import type { FetchLike } from "../../data/github/client";
import { parseRepo } from "../../data/session";
import { decodeInvite } from "../../lib/invite";
import { formatWhen } from "../../lib/labels";
import { type Connected, connect } from "./connect";

const input = "mt-1 w-full rounded-xl border border-line-strong bg-white px-3 py-2";
export const REMEMBER_KEY = "nexus.lembrar";

/** Mensagem de um erro das contas (o Worker devolve um código). */
export function useAccountError() {
  const { t } = useTranslation();
  return (error: unknown): string => {
    const code = error instanceof AccountError ? error.code : (error as Error)?.message;
    const key = `accounts.errors.${code}`;
    const text = t(key);
    return text === key ? t("accounts.errors.unknown", { code: String(code ?? error) }) : text;
  };
}

function Field(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
  help?: ReactNode;
  required?: boolean;
  mono?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{props.label}</span>
      <input
        className={`${input} ${props.mono ? "font-mono" : ""}`}
        type={props.type ?? "text"}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        autoComplete={props.autoComplete ?? "off"}
        required={props.required ?? true}
        autoFocus={props.autoFocus}
      />
      {props.help && <span className="mt-1 block text-xs text-muted">{props.help}</span>}
    </label>
  );
}

function Remember(props: { value: boolean; onChange: (value: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <label className="flex items-start gap-2 text-sm">
      <input
        type="checkbox"
        checked={props.value}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>
        {t("connect.remember")}
        <span className="block text-xs text-muted">{t("accounts.remember_help")}</span>
      </span>
    </label>
  );
}

function GoogleButton(props: { api: AccountsApi; invite?: string; remember: boolean }) {
  const { t } = useTranslation();
  const back = `${window.location.origin}${window.location.pathname}`;
  return (
    <>
      <div className="my-4 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        {t("accounts.or")}
        <span className="h-px flex-1 bg-line" />
      </div>
      <a
        href={props.api.googleUrl(back, props.invite)}
        onClick={() => {
          try {
            sessionStorage.setItem(REMEMBER_KEY, props.remember ? "1" : "0");
          } catch {
            // sem armazenamento: a sessão fica só neste separador
          }
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-white px-4 py-2 text-sm font-medium hover:bg-paper"
      >
        <IconGoogle size={17} /> {t("accounts.google")}
      </a>
    </>
  );
}

function InviteInfo(props: { api: AccountsApi; code: string }) {
  const { t } = useTranslation();
  const code = props.code.trim();
  const info = useQuery({
    queryKey: ["invite-info", code],
    enabled: code.length > 8,
    queryFn: () => props.api.inviteInfo(code),
    retry: false,
  });
  if (!code || info.isLoading) return null;
  if (info.error)
    return <p className="text-xs text-clay">{t("accounts.errors.convite_invalido")}</p>;
  if (!info.data) return null;
  return (
    <p className="rounded-xl border border-sage/30 bg-sage-soft p-3 text-xs text-sage">
      {t("accounts.invite_info", {
        role: t(`accounts.roles.${info.data.role}`),
        label: info.data.label ?? "",
      })}
      {info.data.until ? ` ${t("accounts.until", { when: formatWhen(info.data.until) })}` : ""}
    </p>
  );
}

export function SignInDialog(props: {
  api: AccountsApi;
  config: AccountsConfig;
  invite?: string;
  initialError?: string | null;
  onSignedIn: (signed: SignedIn, remember: boolean, invite?: string) => Promise<void>;
  onSwitch: (dialog: "registo") => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const message = useAccountError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(props.initialError ?? null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await props.onSignedIn(await props.api.signIn(email, password), remember, props.invite);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={t("accounts.sign_in")} icon={<IconUser />} onClose={props.onClose}>
      <form className="space-y-4" onSubmit={submit}>
        {props.invite && <InviteInfo api={props.api} code={props.invite} />}
        <Field
          label={t("accounts.email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          autoFocus
        />
        <Field
          label={t("accounts.password")}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />
        <Remember value={remember} onChange={setRemember} />
        {error && <ErrorBox error={error} />}
        <Button type="submit" disabled={busy}>
          {busy ? t("connect.checking") : t("accounts.sign_in")}
        </Button>
      </form>
      {props.config.google && (
        <GoogleButton api={props.api} invite={props.invite} remember={remember} />
      )}
      <div className="mt-5 space-y-1 border-t border-line pt-4 text-xs text-muted">
        {props.config.signup || props.invite ? (
          <p>
            {t("accounts.no_account")}{" "}
            <button
              type="button"
              className="text-pen underline"
              onClick={() => props.onSwitch("registo")}
            >
              {t("accounts.sign_up")}
            </button>
          </p>
        ) : null}
        <p>{t("accounts.forgot")}</p>
      </div>
    </Modal>
  );
}

export function SignUpDialog(props: {
  api: AccountsApi;
  config: AccountsConfig;
  invite?: string;
  onSignedIn: (signed: SignedIn, remember: boolean) => Promise<void>;
  onSwitch: (dialog: "conta") => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const message = useAccountError();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState(props.invite ?? "");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const closed = !props.config.signup && !invite.trim();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const signed = await props.api.signUp({
        name,
        email,
        password,
        ...(invite.trim() ? { invite: invite.trim() } : {}),
      });
      await props.onSignedIn(signed, remember);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={t("accounts.sign_up")} icon={<IconUserPlus />} onClose={props.onClose}>
      <p className="mb-4 text-sm text-ink-soft">
        {props.config.signup ? t("accounts.sign_up_intro") : t("accounts.sign_up_invite_only")}
      </p>
      <form className="space-y-4" onSubmit={submit}>
        <Field
          label={t("accounts.name")}
          value={name}
          onChange={setName}
          autoComplete="name"
          autoFocus
        />
        <Field
          label={t("accounts.email")}
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <Field
          label={t("accounts.password")}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          help={t("accounts.password_help")}
        />
        <Field
          label={t("accounts.invite_code")}
          value={invite}
          onChange={setInvite}
          required={!props.config.signup}
          mono
          help={t("accounts.invite_code_help")}
        />
        <InviteInfo api={props.api} code={invite} />
        <Remember value={remember} onChange={setRemember} />
        {error && <ErrorBox error={error} />}
        <Button type="submit" disabled={busy || closed}>
          {busy ? t("connect.checking") : t("accounts.sign_up_submit")}
        </Button>
      </form>
      {props.config.google && (
        <GoogleButton api={props.api} invite={invite.trim() || undefined} remember={remember} />
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted">
        {t("accounts.have_account")}{" "}
        <button
          type="button"
          className="text-pen underline"
          onClick={() => props.onSwitch("conta")}
        >
          {t("accounts.sign_in")}
        </button>
      </p>
    </Modal>
  );
}

export function ResetDialog(props: {
  api: AccountsApi;
  code: string;
  onSignedIn: (signed: SignedIn, remember: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const message = useAccountError();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== again) return setError(t("accounts.errors.palavras_diferentes"));
    setBusy(true);
    setError(null);
    try {
      await props.onSignedIn(await props.api.resetPassword(props.code, password), false);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <Modal title={t("accounts.reset_title")} icon={<IconUser />} onClose={props.onClose}>
      <form className="space-y-4" onSubmit={submit}>
        <p className="text-sm text-ink-soft">{t("accounts.reset_intro")}</p>
        <Field
          label={t("accounts.new_password")}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          help={t("accounts.password_help")}
          autoFocus
        />
        <Field
          label={t("accounts.repeat_password")}
          type="password"
          value={again}
          onChange={setAgain}
          autoComplete="new-password"
        />
        {error && <ErrorBox error={error} />}
        <Button type="submit" disabled={busy}>
          {busy ? t("common.saving") : t("accounts.reset_submit")}
        </Button>
      </form>
    </Modal>
  );
}

/** Códigos de acesso KN1-… (os que o dono dá nas Definições): funcionam como sempre. */
export function CodeDialog(props: {
  onConnected: (connected: Connected) => void;
  fetchImpl?: FetchLike;
  initialError?: string | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(props.initialError ?? null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const invite = decodeInvite(code);
    const parsed = invite ? parseRepo(invite.repo) : null;
    if (!invite || !parsed) return setError(t("connect.errors.code_invalid"));
    setBusy(true);
    try {
      const guest = {
        name: invite.name,
        ...(invite.until ? { until: invite.until } : {}),
        ...(invite.scope === "read" ? { scope: invite.scope } : {}),
      };
      props.onConnected(
        await connect(
          { ...parsed, branch: "main", token: invite.token, remember: false, guest },
          props.fetchImpl,
        ),
      );
    } catch (err) {
      const reason = err instanceof Error ? err.message : "";
      // Um código que deixou de funcionar é quase sempre um token expirado ou apagado.
      const known: Record<string, string> = {
        unauthorized: "code_expired",
        not_found: "code_expired",
        public: "public",
        no_push: "no_push",
        access_paused: "access_paused",
        access_revoked: "access_revoked",
        access_ended: "access_ended",
        access_token_expired: "code_expired",
      };
      setError(known[reason] ? t(`connect.errors.${known[reason]}`) : String(reason || err));
      setBusy(false);
    }
  }

  return (
    <Modal title={t("connect.code_title")} icon={<IconTicket />} onClose={props.onClose}>
      <p className="mb-4 text-sm text-ink-soft">{t("connect.code_intro")}</p>
      <form className="space-y-4" onSubmit={submit}>
        <Field
          label={t("connect.code")}
          type="password"
          value={code}
          onChange={setCode}
          mono
          autoFocus
        />
        {error && <ErrorBox error={error} />}
        <Button type="submit" disabled={busy}>
          {busy ? t("connect.checking") : t("connect.code_submit")}
        </Button>
      </form>
    </Modal>
  );
}

/** O dono: o repositório de dados e o token dele do GitHub (como sempre foi). */
export function AdminDialog(props: {
  onConnected: (connected: Connected) => void;
  fetchImpl?: FetchLike;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [repo, setRepo] = useState("");
  const [token, setToken] = useState("");
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = parseRepo(repo);
    if (!parsed) return setError(t("connect.errors.repo_format"));
    setBusy(true);
    try {
      props.onConnected(
        await connect(
          { ...parsed, branch: "main", token: token.trim(), remember },
          props.fetchImpl,
        ),
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ["unauthorized", "not_found", "public", "no_push"];
      setError(known.includes(code) ? t(`connect.errors.${code}`) : String(code || err));
      setBusy(false);
    }
  }

  return (
    <Modal title={t("connect.title")} icon={<IconShield />} onClose={props.onClose}>
      <p className="mb-4 text-sm text-ink-soft">{t("connect.intro")}</p>
      <form className="space-y-4" onSubmit={submit}>
        <label className="block text-sm">
          <span className="font-medium">{t("connect.repo")}</span>
          <input
            className={input}
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            placeholder={t("connect.repo_placeholder")}
            autoComplete="off"
            required
            autoFocus
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium">{t("connect.token")}</span>
          <input
            className={`${input} font-mono`}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            autoComplete="off"
            required
          />
          <span className="mt-1 block text-xs text-muted">{t("connect.token_help")}</span>
          <a
            className="text-xs text-pen underline"
            href="https://github.com/settings/personal-access-tokens/new"
            target="_blank"
            rel="noreferrer"
          >
            {t("connect.token_link")}
          </a>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>
            {t("connect.remember")}
            <span className="block text-xs text-muted">{t("connect.remember_help")}</span>
          </span>
        </label>
        {error && <ErrorBox error={error} />}
        <Button type="submit" disabled={busy}>
          {busy ? t("connect.checking") : t("connect.submit")}
        </Button>
      </form>
    </Modal>
  );
}
