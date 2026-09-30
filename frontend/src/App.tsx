import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import { ErrorBox, Spinner } from "./components/ui";
import { DataProvider, useApp } from "./data/context";
import { clearSession, loadSession, saveSession } from "./data/session";
import { DocumentPage } from "./features/document/DocumentPage";
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
          <Route path="*" element={<Navigate to="/" replace />} />
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
        {connected ? (
          <Shell connected={connected} onLogout={logout} />
        ) : (
          <>
            {restoreError ? (
              <div className="mx-auto max-w-lg p-4">
                <ErrorBox error={restoreError} />
              </div>
            ) : null}
            <ConnectPage onConnected={onConnected} />
          </>
        )}
      </HashRouter>
    </QueryClientProvider>
  );
}
