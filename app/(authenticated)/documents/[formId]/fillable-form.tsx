"use client";

import { useState } from "react";
import {
  IconArrowBackUp,
  IconDownload,
  IconExternalLink,
  IconPrinter,
} from "@tabler/icons-react";
import type { FillableFormDef, FormFieldDef } from "@/lib/forms/types";
import { displayValue } from "@/lib/forms/format";

function Field({
  field,
  value,
  onChange,
}: {
  field: FormFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `f-${field.name}`;
  const base =
    "w-full rounded-lg border border-[var(--color-cs-border)] bg-white px-3 py-2 text-[14px] text-[var(--color-cs-text)] outline-none focus:border-[var(--color-cs-brand)]";
  return (
    <div className={field.width === "full" ? "sm:col-span-2" : ""}>
      <label htmlFor={id} className="mb-1 block text-[12px] font-semibold text-[var(--color-cs-text)]">
        {field.label}
        {field.required ? <span className="text-[var(--color-cs-danger)]"> *</span> : null}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={id}
          rows={4}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      ) : field.type === "select" ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={base}>
          <option value="">Select…</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === "checkbox" ? (
        <label className="flex items-center gap-2 text-[14px] text-[var(--color-cs-text)]">
          <input
            id={id}
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => onChange(e.target.checked ? "true" : "false")}
            className="h-4 w-4 accent-[var(--color-cs-brand)]"
          />
          Yes
        </label>
      ) : (
        <input
          id={id}
          type={
            field.type === "currency" || field.type === "number"
              ? "number"
              : field.type === "date"
                ? "date"
                : field.type === "tel"
                  ? "tel"
                  : field.type === "email"
                    ? "email"
                    : "text"
          }
          inputMode={field.type === "currency" ? "decimal" : undefined}
          step={field.type === "currency" ? "0.01" : undefined}
          value={value}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={base}
        />
      )}
      {field.help ? (
        <p className="mt-1 text-[11px] text-[var(--color-cs-text-muted)]">{field.help}</p>
      ) : null}
    </div>
  );
}

export function FillableForm({
  form,
  initialValues,
}: {
  form: FillableFormDef;
  initialValues: Record<string, string>;
}) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [downloading, setDownloading] = useState(false);

  const set = (name: string, v: string) => setValues((prev) => ({ ...prev, [name]: v }));

  async function downloadPdf() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/forms/${form.id}/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mybenefitspa-${form.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-cs-text)]">{form.title}</h1>
          <p className="mt-1 text-[13px] text-[var(--color-cs-text-secondary)]">{form.purpose}</p>
          {form.helper ? (
            <p className="mt-2 inline-block rounded-md bg-[#fff4ce] px-2 py-1 text-[11px] font-medium text-[#8a6d00]">
              Helper worksheet — not the official agency form. File the official form to submit.
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-cs-brand)] px-3 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)]"
          >
            <IconPrinter size={16} stroke={1.8} aria-hidden />
            Print
          </button>
          <button
            type="button"
            onClick={downloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-cs-border)] px-3 py-2 text-[13px] font-semibold text-[var(--color-cs-text)] hover:bg-[var(--color-cs-nav-hover)] disabled:opacity-50"
          >
            <IconDownload size={16} stroke={1.8} aria-hidden />
            {downloading ? "Preparing…" : "Download PDF"}
          </button>
          <button
            type="button"
            onClick={() => setValues(initialValues)}
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-semibold text-[var(--color-cs-text-secondary)] hover:text-[var(--color-cs-brand)]"
          >
            <IconArrowBackUp size={16} stroke={1.8} aria-hidden />
            Reset
          </button>
        </div>
      </div>

      {/* ---------- Editable form (screen only) ---------- */}
      <div className="flex flex-col gap-4 print:hidden">
        {form.sections.map((section) => (
          <section key={section.title} className="cs-card p-5">
            <h2 className="text-[14px] font-bold text-[var(--color-cs-text)]">{section.title}</h2>
            {section.description ? (
              <p className="mt-1 text-[12px] text-[var(--color-cs-text-secondary)]">{section.description}</p>
            ) : null}
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {section.fields.map((field) => (
                <Field key={field.name} field={field} value={values[field.name] ?? ""} onChange={(v) => set(field.name, v)} />
              ))}
            </div>
          </section>
        ))}
        <a
          href={form.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1.5 text-[13px] font-semibold text-[var(--color-cs-brand)] hover:underline"
        >
          <IconExternalLink size={15} stroke={1.8} aria-hidden />
          {form.officialLabel}
        </a>
        <p className="text-[11px] leading-relaxed text-[var(--color-cs-text-muted)]">{form.disclaimer}</p>
      </div>

      {/* ---------- Print/PDF document view (print only) ---------- */}
      <div className="hidden print:block">
        <div className="mb-1 text-[11px] font-bold text-[#0f2a4c]">MyBenefitsPA</div>
        <h2 className="text-[18px] font-bold text-[#0f2a4c]">{form.title}</h2>
        <p className="text-[11px] text-[#566175]">
          {form.agency}
          {form.helper ? " · Helper worksheet" : ""}
        </p>
        <hr className="my-3 border-[#e3e8ef]" />
        {form.sections.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-wide text-[#0f2a4c]">{section.title}</div>
            <dl className="mt-2">
              {section.fields.map((field) => (
                <div key={field.name} className="mb-2">
                  <dt className="text-[10px] font-semibold text-[#16243a]">{field.label}</dt>
                  <dd className="text-[12px] text-[#16243a]">{displayValue(field, values[field.name] ?? "")}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <hr className="my-3 border-[#e3e8ef]" />
        <p className="text-[9px] text-[#566175]">
          Official form to file: {form.officialLabel} — {form.officialUrl}
        </p>
        <p className="mt-1 text-[9px] text-[#566175]">{form.disclaimer}</p>
      </div>
    </div>
  );
}
