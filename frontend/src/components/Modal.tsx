// Janela por cima da página (popup), com o <dialog> do browser: Esc e clicar fora fecham-na,
// e o foco fica lá dentro enquanto está aberta.

import { type ReactNode, useEffect, useId, useRef } from "react";
import { useTranslation } from "react-i18next";
import { IconClose } from "./icons";

export function Modal(props: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Ícone à esquerda do título. */
  icon?: ReactNode;
}) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: no teclado, o Esc fecha (onCancel); o clique é só no fundo
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
      onClick={(event) => {
        // O clique no fundo escuro chega ao próprio <dialog> (o conteúdo está num <div>).
        if (event.target === ref.current) props.onClose();
      }}
      className="m-auto w-[min(28rem,calc(100vw-2rem))] max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-gold/40 bg-sheet p-0 text-ink shadow-2xl backdrop:bg-night/75 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-6">
        <header className="mb-4 flex items-start gap-3">
          {props.icon && <span className="mt-0.5 text-pen">{props.icon}</span>}
          <h2 id={titleId} className="flex-1 font-serif text-lg font-semibold text-ink">
            {props.title}
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            aria-label={t("common.close")}
            className="-mr-2 -mt-1 rounded-full p-1.5 text-muted hover:bg-paper hover:text-ink"
          >
            <IconClose size={18} />
          </button>
        </header>
        {props.children}
      </div>
    </dialog>
  );
}
