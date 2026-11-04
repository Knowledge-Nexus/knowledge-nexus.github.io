// Uma cadeira como um livro (lombada de cor, sigla e nome): nas estantes da Biblioteca e no
// Início. Ficheiro próprio para que Shelves.tsx não importe LibraryPage.tsx (que importa Shelves).

import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IconArrowRight, IconGlobe } from "../../components/icons";
import { unitColor } from "../../components/ui";
import { isPublic } from "../../components/Visibility";
import { useApp } from "../../data/context";
import type { UnitRow } from "../../data/types";

/** Uma cadeira apresentada como um livro: lombada de cor, sigla e nome. */
export function UnitBook(props: {
  unit: UnitRow;
  count: number;
  subtitle?: string;
  /** Versão pequena, para as estantes (mais cadeiras por linha). */
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { meta, login, to, can } = useApp();
  const { unit, compact } = props;
  const color = unitColor(unit.key);
  const shared = can.visibility && isPublic(meta?.unitVisibility(login)[unit.key]);
  return (
    <Link
      to={to(`/biblioteca?uc=${encodeURIComponent(unit.key)}`)}
      title={unit.name}
      className={`group relative flex h-full overflow-hidden border border-line bg-sheet transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-20px_rgba(29,39,51,0.45)] ${compact ? "rounded-xl" : "rounded-2xl"}`}
    >
      <span
        className={`shrink-0 ${compact ? "w-1.5" : "w-3"}`}
        style={{ backgroundColor: color }}
      />
      <span
        className={`flex min-w-0 flex-1 flex-col ${compact ? "gap-0.5 px-3 py-2" : "gap-1 px-4 py-4"}`}
      >
        <span
          className={`flex items-center gap-1.5 font-semibold tracking-wider uppercase ${compact ? "text-[11px]" : "text-xs"}`}
          style={{ color }}
        >
          {unit.acronym ?? unit.code ?? unit.slug}
          {shared && (
            <span className="text-pen" title={t("visibility.badge")}>
              <IconGlobe size={compact ? 11 : 13} />
              <span className="sr-only">{t("visibility.badge")}</span>
            </span>
          )}
        </span>
        <span
          className={`font-serif leading-snug font-semibold text-ink ${compact ? "line-clamp-2 text-[0.95rem]" : "text-lg"}`}
        >
          {unit.name}
        </span>
        <span className={`text-muted ${compact ? "text-[11px]" : "mt-1 text-xs"}`}>
          {props.subtitle ? `${props.subtitle} · ` : ""}
          {t("library.documents", { count: props.count })}
        </span>
      </span>
      {!compact && (
        <span className="self-center pr-4 text-line-strong transition group-hover:text-pen">
          <IconArrowRight />
        </span>
      )}
    </Link>
  );
}
