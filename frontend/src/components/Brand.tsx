// Marca: ícone + nome. Os ficheiros vivem em public/brand/ (ver BRAND para trocar).

import { useState } from "react";
import { useTranslation } from "react-i18next";

/**
 * Ficheiros da marca em public/brand/. Os originais (icon.jpg, banner.jpg) ficam lá como
 * fonte; o site usa versões optimizadas (ícone recortado em círculo, banner em WebP).
 */
export const BRAND = {
  icon: "/brand/icon-64.png",
  banner: "/brand/banner.webp" as string | null,
};

function DefaultMark(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#27496d" />
      <path d="M9 23V9h3l8 9.5V9h3v14h-3l-8-9.5V23z" fill="#f4c95d" />
    </svg>
  );
}

export function BrandIcon(props: { size?: number }) {
  const size = props.size ?? 32;
  const [failed, setFailed] = useState(false);
  if (failed) return <DefaultMark size={size} />;
  return (
    <img
      src={BRAND.icon}
      width={size}
      height={size}
      alt=""
      className="rounded-full"
      onError={() => setFailed(true)}
    />
  );
}

export function Brand(props: { size?: number }) {
  const { t } = useTranslation();
  return (
    <span className="flex items-center gap-2.5">
      <BrandIcon size={props.size} />
      <span className="whitespace-nowrap font-serif text-xl font-semibold tracking-tight text-ink">
        {t("app.name")}
      </span>
    </span>
  );
}

/** Banner da página de entrada; se o ficheiro não existir, mostra uma composição tipográfica. */
export function BrandBanner() {
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  if (BRAND.banner && !failed) {
    return (
      <img
        src={BRAND.banner}
        alt={t("app.name")}
        width={1584}
        height={672}
        className="mx-auto block h-auto w-full max-w-5xl"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="relative flex h-full w-full flex-col justify-end overflow-hidden bg-pen p-10 text-white">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 31px, #fff 31px, #fff 32px)",
        }}
      />
      <div className="absolute top-0 bottom-0 left-16 w-px bg-marker/60" />
      <p className="relative max-w-sm font-serif text-3xl leading-snug">
        {t("connect.banner_quote")}
      </p>
      <p className="relative mt-3 text-sm text-white/70">{t("connect.banner_caption")}</p>
    </div>
  );
}
