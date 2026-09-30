import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { useApp } from "../data/context";
import { PipelineStatus } from "../features/status/PipelineStatus";
import { Brand } from "./Brand";
import { IconBooks, IconCheckList, IconHome, IconInbox, IconSearch, IconSettings } from "./icons";

function NavItem(props: {
  to: string;
  icon: ReactNode;
  label: string;
  badge?: number;
  end?: boolean;
}) {
  return (
    <NavLink
      to={props.to}
      end={props.end}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
          isActive
            ? "bg-sheet text-pen shadow-sm ring-1 ring-line"
            : "text-ink-soft hover:bg-sheet/70 hover:text-ink"
        }`
      }
    >
      <span className="shrink-0">{props.icon}</span>
      <span className="flex-1">{props.label}</span>
      {props.badge ? (
        <span className="rounded-full bg-marker px-2 text-xs font-semibold text-ink">
          {props.badge}
        </span>
      ) : null}
    </NavLink>
  );
}

export function Layout(props: { children: ReactNode }) {
  const { t } = useTranslation();
  const { meta, login, source } = useApp();
  const review = meta?.counts(login).review ?? 0;
  const items = (
    <>
      <NavItem to="/inicio" icon={<IconHome />} label={t("nav.home")} />
      <NavItem to="/depositar" icon={<IconInbox />} label={t("nav.upload")} />
      <NavItem to="/biblioteca" icon={<IconBooks />} label={t("nav.library")} />
      <NavItem to="/rever" icon={<IconCheckList />} label={t("nav.review")} badge={review} />
      <NavItem to="/pesquisa" icon={<IconSearch />} label={t("nav.search")} />
    </>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-line bg-paper/80 lg:flex lg:flex-col lg:gap-6 lg:px-4 lg:py-6">
        <div className="px-2">
          <Brand />
        </div>
        <nav className="flex flex-col gap-1" aria-label="principal">
          {items}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <NavItem to="/definicoes" icon={<IconSettings />} label={t("nav.settings")} />
          <div className="rounded-xl border border-line bg-sheet/70 px-3 py-2.5">
            <PipelineStatus />
            <p
              className="mt-1 truncate text-xs text-muted"
              title={`${source.repo.owner}/${source.repo.name}`}
            >
              {login} · {source.repo.name}
            </p>
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-10 border-b border-line bg-paper/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Brand size={28} />
          <PipelineStatus compact />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="principal (móvel)">
          {items}
          <NavItem to="/definicoes" icon={<IconSettings />} label={t("nav.settings")} />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">{props.children}</main>
    </div>
  );
}
