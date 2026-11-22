// Notificações do dono: os ficheiros que não foi possível guardar (pelo nome) e os pedidos
// da interface que não se aplicaram. Vêm do manifest dos índices (`deposit`, escrito pelo
// motor em `index/deposit.py`); só quem configura (o dono) vê o ícone.

import { type ReactNode, useState } from "react";
import { useTranslation } from "react-i18next";
import { IconBell } from "../../components/icons";
import { Modal } from "../../components/Modal";
import { Button, ErrorBox } from "../../components/ui";
import { useApp } from "../../data/context";
import type { DepositState } from "../../data/types";
import { formatWhen } from "../../lib/labels";
import { problemCount } from "../../lib/processing";

/** "20251121T101010Z-abcd.yaml" → a data do pedido (é assim que a interface os nomeia). */
function requestDate(name: string): string | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/.exec(name);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z` : null;
}

function validDate(value: string | null): string | null {
  return value && !Number.isNaN(Date.parse(value)) ? value : null;
}

function Section(props: { title: string; hint: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-ink">{props.title}</h3>
      <p className="text-xs text-muted">{props.hint}</p>
      <ul className="space-y-2">{props.children}</ul>
    </section>
  );
}

function More(props: { count: number }) {
  const { t } = useTranslation();
  return props.count > 0 ? (
    <li className="text-xs text-muted">{t("notifications.more", { count: props.count })}</li>
  ) : null;
}

export function NotificationList(props: { deposit: DepositState | undefined }) {
  const { t } = useTranslation();
  const { login, source, notifyCommit } = useApp();
  const deposit = props.deposit;
  // Os pedidos «Tentar de novo» já enviados (o item sai da lista com os índices seguintes).
  const [asked, setAsked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  async function retry(logs: string[]) {
    setBusy(true);
    setError(null);
    try {
      await source.retryFailed(logs);
      setAsked((before) => new Set([...before, ...logs]));
      notifyCommit();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  if (problemCount(deposit) === 0 || !deposit) {
    return <p className="text-sm text-ink-soft">{t("notifications.none")}</p>;
  }
  const stuck = deposit.waiting.filter((item) => item.kind);
  const pending = deposit.failed.filter((item) => !asked.has(item.log)).map((item) => item.log);
  const who = (owner: string) => (owner === login ? "" : t("notifications.from", { login: owner }));
  return (
    <div className="space-y-5">
      {error ? <ErrorBox error={error} /> : null}
      {deposit.failed_total > 0 && (
        <Section title={t("notifications.failed_title")} hint={t("notifications.failed_hint")}>
          {pending.length > 1 && (
            <li>
              <Button variant="secondary" disabled={busy} onClick={() => retry(pending)}>
                {t("notifications.retry_all")}
              </Button>
            </li>
          )}
          {deposit.failed.map((item) => {
            const at = validDate(item.at);
            return (
              <li key={item.log} className="rounded-xl border border-clay/30 bg-paper p-3">
                <p className="break-all font-medium text-ink">{item.name}</p>
                <p className="text-xs text-muted">
                  {[who(item.login), at ? formatWhen(at) : ""].filter(Boolean).join(" · ")}
                </p>
                {item.error && <p className="mt-1 break-words text-xs text-clay">{item.error}</p>}
                {asked.has(item.log) ? (
                  <p className="mt-2 text-xs text-sage">✓ {t("notifications.retry_sent")}</p>
                ) : (
                  <div className="mt-2">
                    <Button variant="secondary" disabled={busy} onClick={() => retry([item.log])}>
                      {t("notifications.retry")}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
          <More count={deposit.failed_total - deposit.failed.length} />
        </Section>
      )}
      {deposit.stuck_total > 0 && (
        <Section title={t("notifications.stuck_title")} hint={t("notifications.stuck_hint")}>
          {stuck.map((item) => (
            <li key={item.label} className="rounded-xl border border-marker/40 bg-paper p-3">
              <p className="break-all font-medium text-ink">{item.name}</p>
              <p className="text-xs text-ink-soft" title={item.reason}>
                {t(`notifications.kind.${item.kind}`)}
                {who(item.login) ? ` · ${who(item.login)}` : ""}
              </p>
            </li>
          ))}
          <More count={deposit.stuck_total - stuck.length} />
        </Section>
      )}
      {deposit.catalog_failed.length > 0 && (
        <Section title={t("notifications.catalog_title")} hint={t("notifications.catalog_hint")}>
          {deposit.catalog_failed.map((item) => {
            const at = requestDate(item.name);
            return (
              <li key={item.log} className="rounded-xl border border-clay/30 bg-paper p-3">
                <p className="font-medium text-ink">
                  {at ? t("notifications.catalog_item", { when: formatWhen(at) }) : item.name}
                </p>
                {item.error && <p className="mt-1 break-words text-xs text-clay">{item.error}</p>}
              </li>
            );
          })}
        </Section>
      )}
    </div>
  );
}

/** O ícone das notificações (com o número de problemas) e a janela com a lista. */
export function Notifications(props: { dark?: boolean }) {
  const { t } = useTranslation();
  const { manifest, can } = useApp();
  const [open, setOpen] = useState(false);
  if (!can.configure) return null;
  const count = problemCount(manifest?.deposit);
  const dark = props.dark ?? true;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={count ? t("notifications.open_count", { count }) : t("notifications.open")}
        title={count ? t("notifications.open_count", { count }) : t("notifications.open")}
        className={`relative shrink-0 rounded-full p-1.5 transition ${
          dark ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-ink-soft hover:bg-paper"
        }`}
      >
        <IconBell size={18} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-gold px-1 text-center text-[0.65rem] font-semibold leading-4 text-navy">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <Modal title={t("notifications.title")} icon={<IconBell />} onClose={() => setOpen(false)}>
          <NotificationList deposit={manifest?.deposit} />
        </Modal>
      )}
    </>
  );
}
