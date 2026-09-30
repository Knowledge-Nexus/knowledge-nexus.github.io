import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { IconBooks, IconCheckList, IconInbox, IconSettings } from "../../components/icons";
import { Card, PageHeader } from "../../components/ui";

interface Step {
  title: string;
  text: string;
  cta: string;
}

interface Faq {
  q: string;
  a: string;
}

const STEP_LINKS = ["/configuracao", "/depositar", "/rever", "/biblioteca"];
const STEP_ICONS = [IconSettings, IconInbox, IconCheckList, IconBooks];

/** Os quatro passos, em cartões numerados (usado aqui e no Início). */
export function HowItWorks(props: { compact?: boolean }) {
  const { t } = useTranslation();
  const steps = t("guide.steps", { returnObjects: true }) as Step[];
  return (
    <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((step, index) => {
        const Icon = STEP_ICONS[index] ?? IconBooks;
        return (
          <li
            key={step.title}
            className="flex flex-col gap-2 rounded-2xl border border-line bg-sheet p-4"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-gold-light">
              <Icon size={18} />
            </span>
            <p className="font-serif text-base font-semibold text-ink">{step.title}</p>
            {!props.compact && <p className="text-sm text-ink-soft">{step.text}</p>}
            <Link
              to={STEP_LINKS[index] ?? "/"}
              className="mt-auto text-sm font-medium text-pen hover:underline"
            >
              {step.cta} →
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

export function HelpPage() {
  const { t } = useTranslation();
  const faq = t("guide.faq", { returnObjects: true }) as Faq[];
  return (
    <div className="space-y-8">
      <PageHeader title={t("guide.title")} subtitle={t("guide.subtitle")} />
      <HowItWorks />
      <Card title={t("guide.faq_title")}>
        <div className="divide-y divide-line">
          {faq.map((item) => (
            <details key={item.q} className="group py-3">
              <summary className="cursor-pointer list-none font-medium text-ink marker:hidden">
                <span className="mr-2 inline-block text-gold transition group-open:rotate-90">
                  ›
                </span>
                {item.q}
              </summary>
              <p className="mt-2 pl-5 text-sm text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}
