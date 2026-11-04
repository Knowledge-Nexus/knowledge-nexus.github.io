// Página de entrada (a primeira que se vê): o banner, o que o site faz e o material público.
// Entrar fica nos ícones do canto, cada um com o seu popup: conta (entrar ou criar), código de
// acesso (KN1-…) e administrador (repositório + token do GitHub).

import { useQuery } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { BrandBanner } from "../../components/Brand";
import {
  IconArrowRight,
  IconGlobe,
  IconShield,
  IconTicket,
  IconUser,
  IconUserPlus,
} from "../../components/icons";
import { Modal } from "../../components/Modal";
import { Button, ErrorBox, Spinner } from "../../components/ui";
import { ACCOUNTS_URL, AccountsApi, type AccountUser, type SignedIn } from "../../data/accounts";
import type { FetchLike } from "../../data/github/client";
import { type StoredSession, takeFlash } from "../../data/session";
import { formatWhen } from "../../lib/labels";
import { AccountWaiting, type Connected, connect } from "./connect";
import {
  AdminDialog,
  CodeDialog,
  REMEMBER_KEY,
  ResetDialog,
  SignInDialog,
  SignUpDialog,
  useAccountError,
} from "./EntryDialogs";

type Dialog = "conta" | "registo" | "codigo" | "admin" | "repor" | "google";
const DIALOGS = new Set<string>(["conta", "registo", "codigo", "admin", "repor", "google"]);

export interface Waiting {
  user: AccountUser;
  session: StoredSession;
}

/** Depois de uma saída forçada, o popup certo abre com a razão. */
function flashDialog(code: string): Dialog {
  return code.startsWith("account_") ? "conta" : "codigo";
}

function CornerButton(props: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  strong?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      title={props.label}
      aria-label={props.label}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
        props.strong
          ? "bg-gold text-navy shadow hover:bg-gold-light"
          : "border border-gold/40 text-gold-light hover:border-gold hover:bg-white/5"
      }`}
    >
      {props.icon}
      <span className="hidden sm:inline">{props.label}</span>
    </button>
  );
}

export function WelcomePage(props: {
  onConnected: (connected: Connected) => void;
  waiting: Waiting | null;
  onWaiting: (waiting: Waiting) => void;
  onSignOut: () => void;
  restoreError?: unknown;
  /** Convite (KNC-…) ou código para repor a palavra-passe, vindos da ligação. */
  invite?: string;
  reset?: string;
  fetchImpl?: FetchLike;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const message = useAccountError();
  const [params, setParams] = useSearchParams();
  const api = useMemo(() => new AccountsApi(ACCOUNTS_URL, props.fetchImpl), [props.fetchImpl]);
  const config = useQuery({
    queryKey: ["accounts-config", api.base],
    queryFn: () => api.config(),
    staleTime: 5 * 60 * 1000,
  });
  const accounts = config.data ?? null;
  const [flash] = useState(() => takeFlash());
  const fromUrl = params.get("entrar");
  const [dialog, setDialog] = useState<Dialog | null>(() => {
    if (fromUrl === "erro") return "conta";
    if (fromUrl && DIALOGS.has(fromUrl)) return fromUrl as Dialog;
    if (props.reset) return "repor";
    if (props.invite) return props.waiting ? null : "registo";
    return flash ? flashDialog(flash) : null;
  });
  const [dialogError, setDialogError] = useState<string | null>(() => {
    if (fromUrl === "erro") return message(params.get("motivo") ?? "erro_interno");
    if (flash) return flash.startsWith("account_") ? message(flash) : t(`connect.errors.${flash}`);
    return null;
  });

  useEffect(() => {
    if (fromUrl && DIALOGS.has(fromUrl)) setDialog(fromUrl as Dialog);
  }, [fromUrl]);

  const open = (next: Dialog) => {
    setDialogError(null);
    setDialog(next);
  };
  const close = () => {
    setDialog(null);
    setDialogError(null);
    if (props.invite || props.reset) navigate("/", { replace: true });
    else if (params.toString()) setParams({}, { replace: true });
  };

  /** Entrou numa conta: abre a biblioteca, ou fica à espera se ainda não tiver acesso. */
  const enterAccount = useCallback(
    async (signed: SignedIn, remember: boolean, invite?: string) => {
      if (invite && signed.user.access === "none") {
        try {
          await api.acceptInvite(signed.token, invite);
        } catch {
          // convite gasto ou inválido: a conta entra na mesma (à espera)
        }
      }
      const session: StoredSession = {
        owner: "",
        name: "",
        branch: "main",
        token: signed.token,
        remember,
        account: { api: api.base },
      };
      try {
        props.onConnected(await connect(session, props.fetchImpl));
      } catch (error) {
        if (!(error instanceof AccountWaiting)) throw error;
        props.onWaiting({ user: error.user, session });
        setDialog(null);
        navigate("/", { replace: true });
      }
    },
    [api, props.onConnected, props.onWaiting, props.fetchImpl, navigate],
  );

  // Volta do Google com um código de uso único: troca-o pela sessão.
  const exchanged = useRef(false);
  useEffect(() => {
    const code = params.get("codigo");
    if (fromUrl !== "google" || !code || exchanged.current) return;
    exchanged.current = true;
    let remember = false;
    try {
      remember = sessionStorage.getItem(REMEMBER_KEY) === "1";
      sessionStorage.removeItem(REMEMBER_KEY);
    } catch {
      // sem armazenamento
    }
    api
      .googleExchange(code)
      .then((signed) => enterAccount(signed, remember))
      .catch((error: unknown) => {
        setDialogError(message(error));
        setDialog("conta");
        setParams({}, { replace: true });
      });
  }, [fromUrl, params, api, enterAccount, message, setParams]);

  const steps = t("connect.how", { returnObjects: true }) as string[];
  const signedOut = !props.waiting;

  return (
    <div className="leather min-h-screen pb-16">
      <header className="flex flex-wrap items-center justify-end gap-2 px-4 pt-4 sm:px-8">
        {props.waiting ? (
          <>
            <span className="mr-1 text-sm text-white/80">
              <IconUser size={16} className="mr-1 inline" />
              {props.waiting.user.name}
            </span>
            <Button variant="secondary" onClick={props.onSignOut}>
              {t("nav.logout")}
            </Button>
          </>
        ) : (
          accounts && (
            <>
              <CornerButton
                label={t("accounts.sign_in")}
                icon={<IconUser size={18} />}
                onClick={() => open("conta")}
              />
              {accounts.signup && (
                <CornerButton
                  label={t("accounts.sign_up")}
                  icon={<IconUserPlus size={18} />}
                  onClick={() => open("registo")}
                  strong
                />
              )}
            </>
          )
        )}
        <CornerButton
          label={t("welcome.code")}
          icon={<IconTicket size={18} />}
          onClick={() => open("codigo")}
        />
        <CornerButton
          label={t("welcome.admin")}
          icon={<IconShield size={18} />}
          onClick={() => open("admin")}
        />
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-8">
        <BrandBanner />
      </div>

      {props.restoreError ? (
        <div className="mx-auto mt-6 max-w-xl px-4">
          <ErrorBox error={props.restoreError} />
        </div>
      ) : null}

      {props.waiting && (
        <WaitingPanel
          api={api}
          waiting={props.waiting}
          invite={props.invite}
          onAccepted={(user) =>
            void enterAccount(
              { token: props.waiting!.session.token, user },
              props.waiting!.session.remember,
            )
          }
        />
      )}

      <section className="mx-auto max-w-2xl px-4 pt-8 text-center text-white/85 sm:px-8">
        <h1 className="font-display text-2xl leading-snug tracking-[0.04em] text-gold-light sm:text-3xl">
          {t("app.tagline")}
        </h1>
        <ol className="mx-auto mt-6 max-w-xl space-y-4 text-left">
          {steps.map((line, index) => (
            <li key={line} className="flex gap-3">
              <span className="gilt-frame flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm text-gold-light">
                {index + 1}
              </span>
              <span className="pt-1 text-sm leading-relaxed">{line}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-center gap-2">
          <a
            href="#/publico"
            className="inline-flex items-center gap-3 rounded-full bg-gold px-7 py-3.5 text-base font-semibold text-navy shadow-lg shadow-black/30 ring-1 ring-gold-light/60 transition hover:-translate-y-0.5 hover:bg-gold-light"
          >
            <IconGlobe size={20} />
            {t("welcome.public")}
            <IconArrowRight size={18} />
          </a>
          <p className="text-xs text-white/60">{t("welcome.public_hint")}</p>
        </div>
      </section>

      {dialog === "conta" && accounts && signedOut && (
        <SignInDialog
          api={api}
          config={accounts}
          invite={props.invite}
          initialError={dialogError}
          onSignedIn={enterAccount}
          onSwitch={open}
          onClose={close}
        />
      )}
      {dialog === "registo" && accounts && signedOut && (
        <SignUpDialog
          api={api}
          config={accounts}
          invite={props.invite}
          onSignedIn={enterAccount}
          onSwitch={open}
          onClose={close}
        />
      )}
      {(dialog === "conta" || dialog === "registo") && !accounts && signedOut && (
        <Modal title={t("accounts.sign_in")} icon={<IconUser />} onClose={close}>
          {config.isLoading ? (
            <Spinner />
          ) : (
            <p className="text-sm text-ink-soft">{t("accounts.unavailable")}</p>
          )}
          {dialogError && <ErrorBox error={dialogError} />}
        </Modal>
      )}
      {dialog === "repor" && props.reset && (
        <ResetDialog api={api} code={props.reset} onSignedIn={enterAccount} onClose={close} />
      )}
      {dialog === "google" && (
        <Modal title={t("accounts.sign_in")} icon={<IconUser />} onClose={close}>
          <Spinner label={t("connect.checking")} />
        </Modal>
      )}
      {dialog === "codigo" && (
        <CodeDialog
          onConnected={props.onConnected}
          fetchImpl={props.fetchImpl}
          initialError={dialogError}
          onClose={close}
        />
      )}
      {dialog === "admin" && (
        <AdminDialog onConnected={props.onConnected} fetchImpl={props.fetchImpl} onClose={close} />
      )}
    </div>
  );
}

/** Conta sem acesso: o que falta e, com um convite, entrar logo. */
function WaitingPanel(props: {
  api: AccountsApi;
  waiting: Waiting;
  invite?: string;
  onAccepted: (user: AccountUser) => void;
}) {
  const { t } = useTranslation();
  const message = useAccountError();
  const [code, setCode] = useState(props.invite ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = props.waiting;
  const reason =
    user.status === "paused"
      ? "accounts.waiting_paused"
      : user.until && Date.parse(user.until) < Date.now()
        ? "accounts.waiting_ended"
        : "accounts.waiting_text";

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const { user: updated } = await props.api.acceptInvite(props.waiting.session.token, code);
      props.onAccepted(updated);
    } catch (err) {
      setError(message(err));
      setBusy(false);
    }
  }

  return (
    <section
      role="status"
      className="mx-auto mt-6 max-w-xl rounded-2xl border border-gold/50 bg-sheet p-5 text-sm text-ink shadow-lg"
    >
      <p className="font-serif text-base font-semibold">
        {t("accounts.waiting_title", { name: user.name })}
      </p>
      <p className="mt-1 text-ink-soft">
        {t(reason, { when: user.until ? formatWhen(user.until) : "" })}
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 text-sm">
          <span className="text-xs font-medium text-ink-soft">{t("accounts.invite_code")}</span>
          <input
            className="mt-1 w-full rounded-xl border border-line-strong bg-white px-3 py-1.5 font-mono"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
          />
        </label>
        <Button variant="secondary" disabled={busy || !code.trim()} onClick={() => void accept()}>
          {t("accounts.use_invite")}
        </Button>
      </div>
      {error && (
        <div className="mt-2">
          <ErrorBox error={error} />
        </div>
      )}
    </section>
  );
}
