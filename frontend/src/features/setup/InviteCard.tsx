// Definições → dar acesso temporário a outra pessoa (ver `lib/invite.ts`).

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, ErrorBox } from "../../components/ui";
import { type FetchLike, GitHubClient } from "../../data/github/client";
import { encodeInvite, tokenPageUrl } from "../../lib/invite";
import { formatWhen } from "../../lib/labels";

const DAYS = [1, 3, 7, 14, 30];

export function InviteCard(props: { owner: string; name: string; fetchImpl?: FetchLike }) {
  const { t } = useTranslation();
  const [person, setPerson] = useState("");
  const [days, setDays] = useState(7);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; until: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const input = "mt-1 w-full rounded-xl border border-line-strong px-3 py-2";

  async function generate() {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      // Confirma que o token abre o repositório (privado) e pode escrever nele.
      const client = new GitHubClient(token.trim(), props.fetchImpl);
      const info = await client.repo(props.owner, props.name).catch(() => null);
      if (!info) throw new Error(t("invite.errors.no_access"));
      if (!info.private) throw new Error(t("connect.errors.public"));
      if (info.permissions && info.permissions.push === false)
        throw new Error(t("connect.errors.no_push"));
      const until =
        client.tokenExpiration ?? new Date(Date.now() + days * 86_400_000).toISOString();
      const code = encodeInvite({
        repo: `${props.owner}/${props.name}`,
        token: token.trim(),
        name: person.trim(),
        until,
      });
      setResult({ code, until });
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={t("invite.title")}>
      <div className="space-y-4 text-sm">
        <p className="text-ink-soft">{t("invite.intro")}</p>
        <ol className="list-decimal space-y-4 pl-5">
          <li className="space-y-2">
            <div className="flex flex-wrap gap-3">
              <label className="block min-w-48 flex-1">
                <span className="font-medium">{t("invite.person")}</span>
                <input
                  className={input}
                  value={person}
                  onChange={(e) => setPerson(e.target.value)}
                  placeholder={t("invite.person_placeholder")}
                />
              </label>
              <label className="block">
                <span className="font-medium">{t("invite.days")}</span>
                <select
                  className={input}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                >
                  {DAYS.map((d) => (
                    <option key={d} value={d}>
                      {t("invite.days_option", { count: d })}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </li>
          <li className="space-y-1">
            <a
              className={`inline-block ${person.trim() ? "" : "pointer-events-none opacity-50"} text-pen underline`}
              href={tokenPageUrl(props.owner, props.name, person.trim() || "?", days)}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!person.trim()}
            >
              {t("invite.create_token")}
            </a>
            <p className="text-xs text-muted">
              {t("invite.create_token_help", { repo: props.name })}
            </p>
          </li>
          <li className="space-y-2">
            <label className="block">
              <span className="font-medium">{t("invite.token")}</span>
              <input
                className={`${input} font-mono`}
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                autoComplete="off"
              />
            </label>
            <Button
              disabled={busy || !person.trim() || !token.trim()}
              onClick={() => void generate()}
            >
              {busy ? t("connect.checking") : t("invite.generate")}
            </Button>
          </li>
        </ol>
        {error ? <ErrorBox error={error} /> : null}
        {result && (
          <div className="space-y-2 rounded-xl border border-sage/40 bg-paper p-3">
            <p className="font-medium">
              {t("invite.ready", { name: person.trim() })}
              {result.until ? ` ${t("invite.until", { when: formatWhen(result.until) })}` : ""}
            </p>
            <textarea
              readOnly
              aria-label={t("invite.code_label")}
              className="h-20 w-full rounded-lg border border-line-strong bg-sheet p-2 font-mono text-xs break-all"
              value={result.code}
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  void navigator.clipboard?.writeText(result.code).then(() => setCopied(true))
                }
              >
                {copied ? t("invite.copied") : t("invite.copy")}
              </Button>
            </div>
            <ul className="list-disc space-y-1 pl-5 text-xs text-ink-soft">
              <li>{t("invite.warn_secret")}</li>
              <li>{t("invite.warn_scope")}</li>
              <li>
                {t("invite.warn_revoke")}{" "}
                <a
                  className="text-pen underline"
                  href="https://github.com/settings/personal-access-tokens"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("invite.revoke_link")}
                </a>
              </li>
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
