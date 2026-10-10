import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useLocation } from "react-router";
import { useApp } from "../data/context";
import { GitHubDataSource } from "../data/source";
import { PipelineStatus } from "../features/status/PipelineStatus";
import { formatWhen } from "../lib/labels";
import { Brand } from "./Brand";
import {
  IconBooks,
  IconCheckList,
  IconGlobe,
  IconHelp,
  IconHome,
  IconInbox,
  IconSearch,
  IconSettings,
} from "./icons";

function NavItem(props: {
  to: string;
  icon: ReactNode;
  label: string;
  hint?: string;
  badge?: number;
  end?: boolean;
  dark?: boolean;
}) {
  const dark = props.dark ?? true;
  return (
    <NavLink
      to={props.to}
      end={props.end}
      title={props.hint}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
          dark
            ? isActive
              ? "bg-white/10 text-gold-light shadow-[inset_3px_0_0_var(--color-gold)]"
              : "text-white/75 hover:bg-white/5 hover:text-white"
            : isActive
              ? "bg-sheet text-pen shadow-sm ring-1 ring-line"
              : "text-ink-soft hover:bg-sheet/70 hover:text-ink"
        }`
      }
    >
      <span className="shrink-0">{props.icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block">{props.label}</span>
        {props.hint && dark && (
          <span
            aria-hidden="true"
            className="hidden truncate text-[0.7rem] font-normal text-white/45 group-hover:text-white/60 lg:block"
          >
            {props.hint}
          </span>
        )}
      </span>
      {props.badge ? (
        <span className="rounded-full bg-gold px-2 text-xs font-semibold text-navy">
          {props.badge}
        </span>
      ) : null}
    </NavLink>
  );
}

/** Moldura da página pública (visitantes): só biblioteca e pesquisa. */
function PublicLayout(props: { children: ReactNode }) {
  const { t } = useTranslation();
  const { to } = useApp();
  const items = (
    <>
      <NavItem to={to("")} end icon={<IconHome />} label={t("nav.home")} />
      <NavItem to={to("/biblioteca")} icon={<IconBooks />} label={t("nav.library")} />
      <NavItem to={to("/pesquisa")} icon={<IconSearch />} label={t("nav.search")} />
    </>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="leather sticky top-0 hidden h-screen border-r border-gold/40 lg:flex lg:flex-col lg:gap-6 lg:px-4 lg:py-6">
        <div className="px-2">
          <Brand dark />
        </div>
        <nav className="flex flex-col gap-1" aria-label="principal">
          {items}
        </nav>
        <div className="mt-auto rounded-xl border border-gold/30 bg-white/5 px-3 py-2.5 text-xs text-white/70">
          <p className="flex items-center gap-1.5 font-medium text-gold-light">
            <IconGlobe size={14} /> {t("public.badge")}
          </p>
          <a
            className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-navy hover:bg-gold-light"
            href="#/entrar"
            title={t("public.enter")}
          >
            {t("public.enter_short")}
          </a>
        </div>
      </aside>
      <header className="leather sticky top-0 z-10 border-b border-gold/40 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <Brand size={30} dark />
          <a
            href="#/entrar"
            className="rounded-full bg-gold px-3 py-1 text-xs font-semibold text-navy"
          >
            {t("public.enter_short")}
          </a>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="principal (móvel)">
          {items}
        </nav>
      </header>
      <Main>{props.children}</Main>
    </div>
  );
}

export function Layout(props: { children: ReactNode }) {
  const { t } = useTranslation();
  const { meta, login, source, readOnly } = useApp();
  if (readOnly) return <PublicLayout>{props.children}</PublicLayout>;
  const review = meta?.counts(login).review ?? 0;
  const items = (dark: boolean) => (
    <>
      <NavItem
        dark={dark}
        to="/inicio"
        icon={<IconHome />}
        label={t("nav.home")}
        hint={t("nav.home_hint")}
      />
      <NavItem
        dark={dark}
        to="/depositar"
        icon={<IconInbox />}
        label={t("nav.upload")}
        hint={t("nav.upload_hint")}
      />
      <NavItem
        dark={dark}
        to="/biblioteca"
        icon={<IconBooks />}
        label={t("nav.library")}
        hint={t("nav.library_hint")}
      />
      <NavItem
        dark={dark}
        to="/rever"
        icon={<IconCheckList />}
        label={t("nav.review")}
        hint={t("nav.review_hint")}
        badge={review}
      />
      <NavItem
        dark={dark}
        to="/pesquisa"
        icon={<IconSearch />}
        label={t("nav.search")}
        hint={t("nav.search_hint")}
      />
    </>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="leather sticky top-0 hidden h-screen border-r border-gold/40 lg:flex lg:flex-col lg:gap-6 lg:px-4 lg:py-6">
        <div className="px-2">
          <Brand dark />
        </div>
        <nav className="flex flex-col gap-1" aria-label="principal">
          {items(true)}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <NavItem to="/ajuda" icon={<IconHelp />} label={t("nav.help")} />
          <NavItem to="/definicoes" icon={<IconSettings />} label={t("nav.settings")} />
          <div className="rounded-xl border border-gold/30 bg-white/5 px-3 py-2.5 text-white/80 [&_p]:text-white/80">
            <PipelineStatus />
            <p
              className="mt-1 truncate text-xs !text-white/50"
              title={`${source.repo.owner}/${source.repo.name}`}
            >
              {login} · {source.repo.name}
            </p>
          </div>
        </div>
      </aside>
      <header className="leather sticky top-0 z-10 border-b border-gold/40 lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 [&_p]:text-white/80">
          <Brand size={30} dark />
          <PipelineStatus compact />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2" aria-label="principal (móvel)">
          {items(true)}
          <NavItem to="/ajuda" icon={<IconHelp />} label={t("nav.help")} />
          <NavItem to="/definicoes" icon={<IconSettings />} label={t("nav.settings")} />
        </nav>
      </header>
      <Main>
        <GuestBanner />
        {props.children}
      </Main>
    </div>
  );
}

/** Quem entrou com um código de acesso temporário vê de quem é o acesso e até quando. */
function GuestBanner() {
  const { t } = useTranslation();
  const { source } = useApp();
  const guest = source instanceof GitHubDataSource ? source.guest : undefined;
  if (!guest) return null;
  const until =
    (source instanceof GitHubDataSource && source.client.tokenExpiration) || guest.until;
  return (
    <p
      role="status"
      className="mb-6 rounded-xl border border-gold/50 bg-marker-soft px-4 py-2 text-sm text-ink"
    >
      {t("invite.banner", { name: guest.name })}
      {until ? ` ${t("invite.until", { when: formatWhen(until) })}` : ""}.
    </p>
  );
}

/** Área principal. A biblioteca usa a largura toda (estantes e cartões enchem o ecrã);
 * as outras páginas ficam numa coluna mais estreita, melhor para ler. */
function Main(props: { children: ReactNode }) {
  const { pathname } = useLocation();
  const wide = pathname.startsWith("/biblioteca") || pathname.startsWith("/publico");
  return (
    <main
      className={`mx-auto w-full px-4 py-8 sm:px-8 ${wide ? "max-w-[120rem] 2xl:px-12" : "max-w-6xl"}`}
    >
      {props.children}
    </main>
  );
}
