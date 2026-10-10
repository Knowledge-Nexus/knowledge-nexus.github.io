import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IconGlobe } from "../../components/icons";
import { Button, Card, ErrorBox, PageHeader } from "../../components/ui";
import { clearCache } from "../../data/cache";
import { useApp } from "../../data/context";
import { GitHubDataSource } from "../../data/source";
import { academicYears, formatWhen, useLabels } from "../../lib/labels";
import { InviteCard } from "./InviteCard";

export function SettingsPage() {
  const { t } = useTranslation();
  const { source, login, meta, notifyCommit, logout } = useApp();
  const labels = useLabels(meta);
  const user = meta?.users().find((u) => u.login === login);
  const enrolled = new Set((user?.enrollments.units ?? []).map((u) => u.unit));
  const [selection, setSelection] = useState<Set<string>>(enrolled);
  const [year, setYear] = useState(academicYears()[1] ?? "");
  const [tutor, setTutor] = useState(user?.preferences.tutor_mode ?? true);
  const [error, setError] = useState<unknown>(null);
  const [saved, setSaved] = useState(false);
  const publicCount = (meta?.documents({ owner: login }) ?? []).filter(
    (d) => d.visibility === "public",
  ).length;
  const expiration = source instanceof GitHubDataSource ? source.client.tokenExpiration : null;
  const guest = source instanceof GitHubDataSource ? source.guest : undefined;

  async function save() {
    setError(null);
    try {
      await source.patchUser((u) => {
        const enrollments = (u.enrollments as Record<string, unknown> | undefined) ?? {};
        const previous =
          (enrollments.units as { unit: string; academic_year?: string }[] | undefined) ?? [];
        const kept = previous.filter((e) => selection.has(e.unit));
        const added = [...selection]
          .filter((key) => !previous.some((e) => e.unit === key))
          .map((unit) => ({ unit, academic_year: year }));
        u.enrollments = { ...enrollments, units: [...kept, ...added] };
        u.preferences = {
          ...((u.preferences as Record<string, unknown>) ?? {}),
          tutor_mode: tutor,
        };
      });
      notifyCommit();
      setSaved(true);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title={t("settings.title")} />
      <Card title={t("settings.repository")}>
        <p className="text-sm">
          {source.repo.owner}/{source.repo.name} ({source.repo.branch}) · {t("settings.user")}:{" "}
          <strong>{login}</strong>
        </p>
        {expiration && (
          <p className="text-xs text-muted">
            {t("settings.token_expires", { when: formatWhen(expiration) })}
          </p>
        )}
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" onClick={() => void clearCache()}>
            {t("settings.clear_cache")}
          </Button>
          <Button variant="danger" onClick={logout}>
            {t("nav.logout")}
          </Button>
        </div>
      </Card>
      {!guest && <InviteCard owner={source.repo.owner} name={source.repo.name} />}
      <Card title={t("settings.sharing")}>
        <div className="space-y-2 text-sm">
          <p className="text-ink-soft">{t("settings.sharing_intro")}</p>
          <p>{t("settings.sharing_count", { count: publicCount })}</p>
          <a className="inline-flex items-center gap-1.5 text-pen underline" href="#/publico">
            <IconGlobe size={15} /> {t("settings.sharing_public_page")}
          </a>
          <p className="text-xs text-muted">{t("settings.sharing_setup")}</p>
        </div>
      </Card>
      <Card title={t("settings.enrollments")}>
        <div className="space-y-3 text-sm">
          <ul className="grid gap-1 sm:grid-cols-2">
            {labels.units.map((u) => (
              <li key={u.key}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selection.has(u.key)}
                    onChange={(e) => {
                      const next = new Set(selection);
                      if (e.target.checked) next.add(u.key);
                      else next.delete(u.key);
                      setSelection(next);
                    }}
                  />
                  {labels.unit(u.key)}
                </label>
              </li>
            ))}
          </ul>
          <label>
            {t("setup.academic_year")}{" "}
            <select
              className="rounded border border-line-strong px-2 py-1"
              value={year}
              onChange={(e) => setYear(e.target.value)}
            >
              {academicYears().map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={tutor} onChange={(e) => setTutor(e.target.checked)} />
            {t("settings.tutor_mode")}
          </label>
          {error ? <ErrorBox error={error} /> : null}
          {saved && <p className="text-sage">✓ {t("common.pending_sync")}</p>}
          <Button onClick={() => void save()}>{t("common.save")}</Button>
        </div>
      </Card>
    </div>
  );
}
