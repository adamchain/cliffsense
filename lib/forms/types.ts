import type { Program } from "@/lib/programs";

/* ---------------------------------------------------------------------------
 * Shared types for the Reports & Docs feature: a catalog of the official
 * reporting / recertification forms per benefit program, plus an in-app
 * "fillable" form engine (field schemas) that pre-fills from the beneficiary
 * profile and produces a printable, downloadable document.
 * ------------------------------------------------------------------------- */

/** Whether a form is for ongoing reporting or for (re)applying / recertifying. */
export type FormCategory = "reporting" | "reapply";

/** A catalog entry: an official agency form or online process we point users to. */
export type CatalogForm = {
  id: string;
  program: Program;
  category: FormCategory;
  /** Agency form number, where one exists (e.g. "SSA-821", "PA 600 R"). */
  formNumber?: string;
  title: string;
  agency: string;
  /** One-line description of what it's for. */
  purpose: string;
  /** How often it's filed (e.g. "As needed", "Every 6 months", "Annual"). */
  frequency: string;
  /** Link to the official PDF or online portal. */
  officialUrl: string;
  /** true → officialUrl is an online portal / app, not a downloadable PDF. */
  online?: boolean;
  /** When set, an in-app fillable version exists (see FILLABLE_FORMS[id]). */
  fillableId?: string;
};

export type FieldType =
  | "text"
  | "textarea"
  | "date"
  | "number"
  | "currency"
  | "select"
  | "checkbox"
  | "tel"
  | "email";

/** Which piece of profile data a field defaults to, resolved server-side. */
export type PrefillKey =
  | "beneficiaryFullName"
  | "beneficiaryFirstName"
  | "beneficiaryLastName"
  | "dateOfBirth"
  | "state"
  | "county"
  | "householdSize"
  | "monthlyEarnedIncome"
  | "bankBalance"
  | "preparerName"
  | "preparerEmail"
  | "today";

export type FormFieldDef = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
  prefill?: PrefillKey;
  /** Conversational phrasing for the guided/chat experience; falls back to label. */
  question?: string;
  /** Layout hint within a section's two-column grid. */
  width?: "full" | "half";
};

export type FormSection = {
  title: string;
  description?: string;
  fields: FormFieldDef[];
};

export type FillableFormDef = {
  id: string;
  title: string;
  agency: string;
  /** Short subtitle shown under the title. */
  purpose: string;
  /** The matching official form to file (PDF or portal). */
  officialUrl: string;
  officialLabel: string;
  /** When true, this is a MyBenefitsPA helper worksheet, not the agency's form. */
  helper?: boolean;
  sections: FormSection[];
  /** Printed at the foot of the generated document. */
  disclaimer: string;
  /**
   * When set, MyBenefitsPA can fetch the official fillable PDF at `officialUrl`
   * and auto-fill its AcroForm fields. Keys are this form's field `name`s; values
   * are keyword phrases matched (case-insensitively) against each official field's
   * internal name + tooltip text. Only set for forms whose officialUrl is a
   * fillable government PDF; omit for helper worksheets / portal links.
   */
  officialFill?: { matchers: Record<string, string[]> };
};

export type PrefillValues = Partial<Record<PrefillKey, string>>;
