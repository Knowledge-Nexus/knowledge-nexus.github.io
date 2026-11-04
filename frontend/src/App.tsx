import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Link, Navigate, Route, Routes, useParams } from "react-router";
import { Layout } from "./components/Layout";
import { buttonClass, Empty, ErrorBox, Spinner } from "./components/ui";
import { AccountsApi } from "./data/accounts";
import { DataProvider, useApp } from "./data/context";
import { fetchPublicManifest, PublicDataSource } from "./data/public";
import {
  clearSession,
  hasFlash,
  loadSession,
  type StoredSession,
  saveSession,
  setFlash,
} from "./data/session";
import { DocumentPage } from "./features/document/DocumentPage";
import { AccountWaiting, type Connected, connect } from "./features/entry/connect";
import { type Waiting, WelcomePage } from "./features/entry/WelcomePage";
import { HelpPage } from "./features/help/HelpPage";
import { HomePage } from "./features/home/HomePage";
import { LibraryPage } from "./features/library/LibraryPage";
import { ReviewPage } from "./features/review/ReviewPage";
import { SearchPage } from "./features/search/SearchPage";
import { SettingsPage } from "./features/setup/SettingsPage";
import { SetupPage } from "./features/setup/SetupPage";
import { UploadPage } from "./features/upload/UploadPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function Home() {
  const { manifest, meta, indexLoading, can } = useApp();
  if (indexLoading || manifest === undefined) return <Spinner />;
  if (can.configure && (!manifest || !meta || meta.institutions().length === 0))
    return <Navigate to="/configuracao" replace />;
  return <Navigate to="/inicio" replace />;
}

function Shell(props: { connected: Connected; onLogout: () => void }) {
  // Só existem as páginas que esta pessoa pode usar (o nível da conta ou o código de acesso).
  const { source } = props.connected;
  const can = source.capabilities;
  const only = (allowed: boolean, element: ReactNode) =>
    allowed ? element : <Navigate to="/biblioteca" replace />;
  const account = source.account?.user;
  // Quem só vê (sem descarregar) leva o nome por cima das páginas.
  const watermark = account && !can.download ? `${account.name} · ${account.email}` : null;
  return (
    <DataProvider source={source} onLogout={props.onLogout} can={can} watermark={watermark}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/configuracao" element={only(can.configure, <SetupPage />)} />
          <Route path="/depositar" element={only(can.upload, <UploadPage />)} />
          <Route path="/biblioteca" element={<LibraryPage />} />
          <Route path="/documento/:id" element={<DocumentPage />} />
          <Route path="/rever" element={only(can.organize, <ReviewPage />)} />
          <Route path="/pesquisa" element={<SearchPage />} />
          <Route path="/definicoes" element={<SettingsPage />} />
          <Route path="/ajuda" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </DataProvider>
  );
}

const noop = () => {};

/** Sem sessão: a página de entrada em `/`; qualquer outra página leva lá. */
function WelcomeOrHome(props: Parameters<typeof WelcomePage>[0]) {
  return (
    <Routes>
      <Route index element={<WelcomePage {...props} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Página pública: o material que o dono marcou como público, só de leitura. */
function PublicShell() {
  const { t } = useTranslation();
  const manifest = useQuery({
    queryKey: ["public-manifest"],
    queryFn: () => fetchPublicManifest(),
  });
  const owner = manifest.data?.owner ?? "";
  const source = useMemo(() => new PublicDataSource(owner), [owner]);
  if (manifest.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (manifest.error) return <ErrorBox error={manifest.error} />;
  if (!manifest.data) {
    return (
      <div className="mx-auto max-w-lg space-y-3 p-8">
        <Empty
          action={
            <Link to="/entrar" className={buttonClass("secondary")}>
              {t("public.enter")}
            </Link>
          }
        >
          {t("public.unavailable")} {t("public.unavailable_hint")}
        </Empty>
      </div>
    );
  }
  return (
    <DataProvider source={source} onLogout={noop} visitor base="/publico">
      <Layout>
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="biblioteca" element={<LibraryPage />} />
          <Route path="documento/:id" element={<DocumentPage />} />
          <Route path="pesquisa" element={<SearchPage />} />
          <Route path="*" element={<Navigate to="/publico" replace />} />
        </Routes>
      </Layout>
    </DataProvider>
  );
}

/** Termina a sessão de uma conta no Worker (sem esperar: sair é sempre imediato aqui). */
function signOutAccount(session: StoredSession | null) {
  if (session?.account)
    void new AccountsApi(session.account.api).signOut(session.token).catch(() => {});
}

/** As ligações que o dono envia: convite (`#/convite/KNC-…`) e repor (`#/repor/KNR-…`). */
function WelcomeRoute(
  props: Omit<Parameters<typeof WelcomePage>[0], "invite" | "reset"> & {
    kind?: "invite" | "reset";
  },
) {
  const { code } = useParams();
  const { kind, ...rest } = props;
  return (
    <WelcomePage
      {...rest}
      {...(kind === "invite" && code ? { invite: code } : {})}
      {...(kind === "reset" && code ? { reset: code } : {})}
    />
  );
}

export function App() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState<Connected | null>(null);
  const [waiting, setWaiting] = useState<Waiting | null>(null);
  const [restoring, setRestoring] = useState(() => loadSession() !== null);
  const [restoreError, setRestoreError] = useState<unknown>(null);

  useEffect(() => {
    const stored = loadSession();
    if (!stored) return;
    connect(stored)
      .then(setConnected, (error: unknown) => {
        if (error instanceof AccountWaiting) {
          // Conta ainda sem acesso: fica com sessão, a ver o material público.
          setWaiting({ user: error.user, session: stored });
        } else if (error instanceof Error && error.message === "account_signed_out") {
          clearSession();
        } else if (error instanceof Error && error.message.startsWith("access_")) {
          // Acesso temporário suspenso ou terminado pelo dono: a razão aparece na entrada.
          clearSession();
          setFlash(error.message);
        } else setRestoreError(error);
      })
      .finally(() => setRestoring(false));
  }, []);

  const onConnected = useCallback((value: Connected) => {
    saveSession(value.session);
    setConnected(value);
    setWaiting(null);
    setRestoreError(null);
  }, []);

  const onWaiting = useCallback((value: Waiting) => {
    saveSession(value.session);
    setWaiting(value);
  }, []);

  const logout = useCallback(() => {
    signOutAccount(loadSession());
    clearSession();
    queryClient.clear();
    setConnected(null);
    setWaiting(null);
  }, []);

  const welcome = {
    onConnected,
    waiting,
    onWaiting,
    onSignOut: logout,
    restoreError,
  };

  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label={t("connect.checking")} />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <Routes>
          <Route path="/publico/*" element={<PublicShell />} />
          {/* Ligação antiga para entrar: abre o popup do administrador (ou o do código). */}
          <Route
            path="/entrar"
            element={
              <Navigate to={connected ? "/" : hasFlash() ? "/" : "/?entrar=admin"} replace />
            }
          />
          <Route
            path="/convite/:code"
            element={
              connected ? <Navigate to="/" replace /> : <WelcomeRoute {...welcome} kind="invite" />
            }
          />
          <Route
            path="/repor/:code"
            element={
              connected ? <Navigate to="/" replace /> : <WelcomeRoute {...welcome} kind="reset" />
            }
          />
          {/* Sem sessão, quem chega vê a página de entrada (com o material público à vista). */}
          <Route
            path="*"
            element={
              connected ? (
                <Shell connected={connected} onLogout={logout} />
              ) : (
                <WelcomeOrHome {...welcome} />
              )
            }
          />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}
