import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import YAML from "yaml";
import { SuggestInput } from "../../components/SuggestInput";
import { Button, Card, ErrorBox, PageHeader, Spinner } from "../../components/ui";
import { useApp } from "../../data/context";
import type { CatalogBundle } from "../../data/types";
import { academicYears } from "../../lib/labels";
import { slugify } from "../../lib/normalize";
import {
  courseSuggestions,
  DEGREES,
  findSuggestion,
  institutionSuggestions,
  unitSuggestions,
} from "../../lib/reference";

interface UnitDraft {
  name: string;
  acronym: string;
  code: string;
  year: string;
  semester: string;
}

const emptyUnit = (): UnitDraft => ({ name: "", acronym: "", code: "", year: "1", semester: "1" });

export function buildBundle(input: {
  institution: string;
  institutionAcronym: string;
  course: string;
  degree: string;
  units: UnitDraft[];
}): { bundle: CatalogBundle; institution: string; course: string; units: string[] } {
  const inst = slugify(input.institutionAcronym || input.institution, 30);
  const course = slugify(input.course, 40);
  const used = new Set<string>();
  const units = input.units
    .filter((u) => u.name.trim())
    .map((u) => {
      let slug = slugify(u.acronym || u.name, 30);
      while (used.has(slug)) slug = `${slug}-2`;
      used.add(slug);
      return { ...u, slug };
    });
  const bundle: CatalogBundle = {
    format: "nexus-catalogo",
    version: 1,
    institutions: [
      {
        slug: inst,
        name: input.institution.trim(),
        ...(input.institutionAcronym ? { acronym: input.institutionAcronym.trim() } : {}),
        courses: input.course.trim()
          ? [
              {
                slug: course,
                name: input.course.trim(),
                ...(input.degree ? { degree: input.degree } : {}),
                units: units.map((u) => ({
                  unit: u.slug,
                  curricular_year: Number(u.year) || undefined,
                  semester: Number(u.semester) || undefined,
                })),
              },
            ]
          : [],
        units: units.map((u) => ({
          slug: u.slug,
          name: u.name.trim(),
          ...(u.acronym ? { acronym: u.acronym.trim() } : {}),
          ...(u.code ? { code: u.code.trim() } : {}),
        })),
      },
    ],
  };
  return { bundle, institution: inst, course, units: units.map((u) => u.slug) };
}

function StructureStep() {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const ready = useQuery({
    queryKey: ["structure", source.repo],
    queryFn: () => source.structureReady(),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  if (ready.isLoading) return <Spinner />;
  if (ready.data) return <p className="text-sm text-sage">✓ {t("setup.structure_ready")}</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-soft">{t("setup.structure_missing")}</p>
      {error ? (
        <ErrorBox
          error={t("setup.structure_error", {
            message: error instanceof Error ? error.message : String(error),
          })}
        />
      ) : null}
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await source.scaffold();
            notifyCommit();
            await ready.refetch();
          } catch (err) {
            setError(err);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? t("common.saving") : t("setup.structure_create")}
      </Button>
    </div>
  );
}

function ManualCatalog(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const { source, notifyCommit, meta } = useApp();
  const [institution, setInstitution] = useState("");
  const [institutionAcronym, setInstitutionAcronym] = useState("");
  const [course, setCourse] = useState("");
  const [degree, setDegree] = useState("licenciatura");
  const [year, setYear] = useState(academicYears()[1] ?? "");
  const [enroll, setEnroll] = useState(true);
  const [units, setUnits] = useState<UnitDraft[]>([emptyUnit()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const institutions = institutionSuggestions(meta);
  const courses = courseSuggestions(meta, degree);
  const knownUnits = unitSuggestions(meta);
  const update = (index: number, patch: Partial<UnitDraft>) =>
    setUnits((all) => all.map((u, i) => (i === index ? { ...u, ...patch } : u)));

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const built = buildBundle({ institution, institutionAcronym, course, degree, units });
      await source.catalogRequest(built.bundle, `catálogo: ${institution} / ${course}`);
      if (enroll) {
        await source.patchUser((user) => {
          const enrollments = (user.enrollments as Record<string, unknown> | undefined) ?? {};
          const courses = new Set((enrollments.courses as string[] | undefined) ?? []);
          if (course.trim()) courses.add(`${built.institution}/${built.course}`);
          const current = ((enrollments.units as { unit: string }[] | undefined) ?? []).filter(
            (u) => !built.units.includes(u.unit.split("/")[1] ?? ""),
          );
          user.enrollments = {
            courses: [...courses],
            units: [
              ...current,
              ...built.units.map((u) => ({
                unit: `${built.institution}/${u}`,
                academic_year: year,
              })),
            ],
          };
        });
      }
      notifyCommit();
      props.onDone();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-line-strong px-2 py-1.5 text-sm";
  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          {t("setup.institution")}
          <SuggestInput
            className={input}
            value={institution}
            suggestions={institutions}
            onChange={(e) => {
              setInstitution(e.target.value);
              const match = findSuggestion(institutions, e.target.value);
              if (match?.acronym && !institutionAcronym) setInstitutionAcronym(match.acronym);
            }}
            required
          />
        </label>
        <label className="text-sm">
          {t("setup.institution_acronym")}
          <input
            className={input}
            value={institutionAcronym}
            onChange={(e) => setInstitutionAcronym(e.target.value)}
          />
        </label>
        <label className="text-sm">
          {t("setup.course")}
          <SuggestInput
            className={input}
            value={course}
            suggestions={courses}
            onChange={(e) => setCourse(e.target.value)}
          />
        </label>
        <label className="text-sm">
          {t("setup.degree")}
          <select className={input} value={degree} onChange={(e) => setDegree(e.target.value)}>
            {DEGREES.map((d) => (
              <option key={d.slug} value={d.slug}>
                {d.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("setup.units")}</legend>
        {units.map((unit, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: linhas editáveis sem id
          <div key={index} className="grid grid-cols-12 gap-2">
            <SuggestInput
              className={`${input} col-span-5`}
              placeholder={t("setup.unit_name")}
              value={unit.name}
              suggestions={knownUnits}
              onChange={(e) => {
                const match = findSuggestion(knownUnits, e.target.value);
                update(index, {
                  name: e.target.value,
                  ...(match?.acronym && !unit.acronym ? { acronym: match.acronym } : {}),
                });
              }}
            />
            <input
              className={`${input} col-span-2`}
              placeholder={t("setup.unit_acronym")}
              value={unit.acronym}
              onChange={(e) => update(index, { acronym: e.target.value })}
            />
            <input
              className={`${input} col-span-2`}
              placeholder={t("setup.unit_code")}
              value={unit.code}
              onChange={(e) => update(index, { code: e.target.value })}
            />
            <input
              className={`${input} col-span-1`}
              aria-label={t("setup.unit_year")}
              value={unit.year}
              onChange={(e) => update(index, { year: e.target.value })}
            />
            <input
              className={`${input} col-span-1`}
              aria-label={t("setup.unit_semester")}
              value={unit.semester}
              onChange={(e) => update(index, { semester: e.target.value })}
            />
            <button
              type="button"
              className="col-span-1 text-xs text-clay"
              onClick={() => setUnits((all) => all.filter((_, i) => i !== index))}
            >
              {t("setup.remove")}
            </button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => setUnits((all) => [...all, emptyUnit()])}>
          {t("setup.add_unit")}
        </Button>
      </fieldset>
      <div className="flex flex-wrap items-center gap-4 text-sm">
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
          <input type="checkbox" checked={enroll} onChange={(e) => setEnroll(e.target.checked)} />
          {t("setup.enroll")}
        </label>
      </div>
      {error ? <ErrorBox error={error} /> : null}
      <Button type="submit" disabled={busy}>
        {busy ? t("common.saving") : t("setup.submit")}
      </Button>
    </form>
  );
}

function ImportCatalog(props: { onDone: () => void }) {
  const { t } = useTranslation();
  const { source, notifyCommit } = useApp();
  const [error, setError] = useState<unknown>(null);
  return (
    <div className="space-y-3 text-sm">
      <p className="text-ink-soft">{t("setup.import_help")}</p>
      <input
        type="file"
        accept=".yaml,.yml"
        onChange={async (event) => {
          setError(null);
          const file = event.target.files?.[0];
          if (!file) return;
          try {
            const bundle = YAML.parse(await file.text()) as CatalogBundle;
            if (bundle?.format !== "nexus-catalogo") throw new Error(t("setup.import_invalid"));
            await source.catalogRequest(bundle, `catálogo: importação de ${file.name}`);
            notifyCommit();
            props.onDone();
          } catch (err) {
            setError(err);
          }
        }}
      />
      {error ? <ErrorBox error={error} /> : null}
    </div>
  );
}

export function SetupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"import" | "manual" | "infer">("manual");
  const [done, setDone] = useState(false);
  const tab = (value: typeof mode) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${mode === value ? "bg-pen text-white" : "border border-line-strong bg-sheet text-ink-soft hover:bg-paper"}`;
  return (
    <div className="space-y-4">
      <PageHeader title={t("setup.title")} />
      <Card title={t("setup.structure_title")}>
        <StructureStep />
      </Card>
      <Card title={t("setup.catalog_title")}>
        {done ? (
          <p className="text-sm text-sage">✓ {t("setup.done")}</p>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">{t("setup.catalog_intro")}</p>
            <div className="flex gap-2">
              <button type="button" className={tab("manual")} onClick={() => setMode("manual")}>
                {t("setup.mode_manual")}
              </button>
              <button type="button" className={tab("import")} onClick={() => setMode("import")}>
                {t("setup.mode_import")}
              </button>
              <button type="button" className={tab("infer")} onClick={() => setMode("infer")}>
                {t("setup.mode_infer")}
              </button>
            </div>
            {mode === "manual" && <ManualCatalog onDone={() => setDone(true)} />}
            {mode === "import" && <ImportCatalog onDone={() => setDone(true)} />}
            {mode === "infer" && (
              <div className="space-y-3 text-sm">
                <p className="text-ink-soft">{t("setup.infer_help")}</p>
                <Button onClick={() => navigate("/depositar")}>{t("setup.infer_go")}</Button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
