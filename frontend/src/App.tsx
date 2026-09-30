import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Link, Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { buttonClass, Empty, ErrorBox, Spinner } from "./components/ui";
import { DataProvider, useApp } from "./data/context";
import { fetchPublicManifest, PublicDataSource } from "./data/public";
import { clearSession, loadSession, saveSession } from "./data/session";
import { DocumentPage } from "./features/document/DocumentPage";
import { HelpPage } from "./features/help/HelpPage";
import { HomePage } from "./features/home/HomePage";
import { LibraryPage } from "./features/library/LibraryPage";
import { ReviewPage } from "./features/review/ReviewPage";
import { SearchPage } from "./features/search/SearchPage";
import { type Connected, ConnectPage, connect } from "./features/setup/ConnectPage";
import { SettingsPage } from "./features/setup/SettingsPage";
import { SetupPage } from "./features/setup/SetupPage";
import { UploadPage } from "./features/upload/UploadPage";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
});

function Home() {
  const { manifest, meta, indexLoading } = useApp();
  if (indexLoading || manifest === undefined) return <Spinner />;
  if (!manifest || !meta || meta.institutions().length === 0)
    return <Navigate to="/configuracao" replace />;
  return <Navigate to="/inicio" replace />;
}

function Shell(props: { connected: Connected; onLogout: () => void }) {
  return (
    <DataProvider source={props.connected.source} onLogout={props.onLogout}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inicio" element={<HomePage />} />
          <Route path="/configuracao" element={<SetupPage />} />
          <Route path="/depositar" element={<UploadPage />} />
          <Route path="/biblioteca" element={<LibraryPage />} />
          <Route path="/documento/:id" element={<DocumentPage />} />
          <Route path="/rever" element={<ReviewPage />} />
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
    <DataProvider source={source} onLogout={noop} readOnly base="/publico">
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

export function App() {
  const { t } = useTranslation();
  const [connected, setConnected] = useState<Connected | null>(null);
  const [restoring, setRestoring] = useState(() => loadSession() !== null);
  const [restoreError, setRestoreError] = useState<unknown>(null);

  useEffect(() => {
    const stored = loadSession();
    if (!stored) return;
    connect(stored)
      .then(setConnected, (error: unknown) => setRestoreError(error))
      .finally(() => setRestoring(false));
  }, []);

  const onConnected = useCallback((value: Connected) => {
    saveSession(value.session);
    setConnected(value);
    setRestoreError(null);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    queryClient.clear();
    setConnected(null);
  }, []);

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
          <Route
            path="/entrar"
            element={
              connected ? (
                <Navigate to="/" replace />
              ) : (
                <>
                  {restoreError ? (
                    <div className="mx-auto max-w-lg p-4">
                      <ErrorBox error={restoreError} />
                    </div>
                  ) : null}
                  <ConnectPage onConnected={onConnected} />
                </>
              )
            }
          />
          {/* Sem sessão, quem chega vê a biblioteca pública; para entrar: #/entrar. */}
          <Route
            path="*"
            element={
              connected ? (
                <Shell connected={connected} onLogout={logout} />
              ) : (
                <Navigate to={restoreError ? "/entrar" : "/publico"} replace />
              )
            }
          />
        </Routes>
      </HashRouter>
    </QueryClientProvider>
  );
}
