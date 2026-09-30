import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Brand, BrandBanner } from "../../components/Brand";
import { Button, Card, ErrorBox } from "../../components/ui";
import { type FetchLike, GitHubClient, GitHubError } from "../../data/github/client";
import { parseRepo, type StoredSession } from "../../data/session";
import { GitHubDataSource } from "../../data/source";

export interface Connected {
  session: StoredSession;
  source: GitHubDataSource;
}

/** Valida o token e o repositório. Recusa repositórios públicos (direitos de autor). */
export async function connect(session: StoredSession, fetchImpl?: FetchLike): Promise<Connected> {
  const client = new GitHubClient(session.token, fetchImpl);
  let login: string;
  try {
    login = (await client.user()).login;
  } catch (error) {
    if (error instanceof GitHubError && error.status === 401) throw new Error("unauthorized");
    throw error;
  }
  let info: Awaited<ReturnType<GitHubClient["repo"]>>;
  try {
    info = await client.repo(session.owner, session.name);
  } catch (error) {
    if (error instanceof GitHubError && (error.status === 404 || error.status === 403))
      throw new Error("not_found");
    throw error;
  }
  if (!info.private) throw new Error("public");
  if (info.permissions && info.permissions.push === false) throw new Error("no_push");
  const branch = info.default_branch || session.branch || "main";
  const repo = { owner: session.owner, name: session.name, branch };
  return {
    session: { ...session, branch },
    source: new GitHubDataSource(client, repo, login, info),
  };
}

export function ConnectPage(props: {
  onConnected: (connected: Connected) => void;
  fetchImpl?: FetchLike;
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
      const connected = await connect(
        { ...parsed, branch: "main", token: token.trim(), remember },
        props.fetchImpl,
      );
      props.onConnected(connected);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      const known = ["unauthorized", "not_found", "public", "no_push"];
      setError(known.includes(code) ? t(`connect.errors.${code}`) : String(code || err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <div className="hidden lg:block">
        <BrandBanner />
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <Brand size={36} />
            <p className="text-sm text-ink-soft">{t("app.tagline")}</p>
          </div>
          <Card title={t("connect.title")}>
            <p className="mb-4 text-sm text-ink-soft">{t("connect.intro")}</p>
            <form className="space-y-4" onSubmit={submit}>
              <label className="block text-sm">
                <span className="font-medium">{t("connect.repo")}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2"
                  value={repo}
                  onChange={(e) => setRepo(e.target.value)}
                  placeholder={t("connect.repo_placeholder")}
                  autoComplete="off"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium">{t("connect.token")}</span>
                <input
                  className="mt-1 w-full rounded-xl border border-line-strong px-3 py-2 font-mono"
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
          </Card>
        </div>
      </div>
    </div>
  );
}
