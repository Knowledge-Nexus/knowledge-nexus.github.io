import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useApp } from "../data/context";
import { PipelineStatus } from "../features/status/PipelineStatus";

export function Layout(props: { children: ReactNode }) {
  const { t } = useTranslation();
  const { meta, login, source } = useApp();
  const review = meta?.counts(login).review ?? 0;
  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-slate-900">{t("app.name")}</span>
            <span className="text-xs text-slate-500">
              {source.repo.owner}/{source.repo.name} · {login}
            </span>
          </div>
          <PipelineStatus />
        </div>
        <nav className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 pb-2" aria-label="principal">
          <NavLink to="/depositar" className={link}>
            {t("nav.upload")}
          </NavLink>
          <NavLink to="/biblioteca" className={link}>
            {t("nav.library")}
          </NavLink>
          <NavLink to="/rever" className={link}>
            {t("nav.review")}
            {review > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-400 px-1.5 text-xs text-slate-900">
                {review}
              </span>
            )}
          </NavLink>
          <NavLink to="/pesquisa" className={link}>
            {t("nav.search")}
          </NavLink>
          <NavLink to="/definicoes" className={link}>
            {t("nav.settings")}
          </NavLink>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">{props.children}</main>
    </div>
  );
}
