"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconTrash } from "@tabler/icons-react";

type ActivityRow = {
  datePeriod: string;
  source: string;
  activity: string;
  hours: number | null;
  proofSaved: boolean;
};

type Submission = {
  reason: string | null;
  submittedDate: string | null;
  method: string | null;
  confirmationNumber: string;
  dhsStatus: string | null;
  followUpDate: string | null;
  nextAction: string;
};

type Notice = {
  received: boolean;
  noticeDate: string | null;
  effectiveDate: string | null;
  appealDeadline: string | null;
  continuedBenefitDeadline: string | null;
  appealFiledDate: string | null;
  hearingType: string | null;
  receiptSaved: boolean;
  reasonChallenged: string[];
  reasonChallengedOther: string;
  evidenceSaved: string[];
};

type RecordShape = {
  medicaidCaseNumber?: string;
  nextRenewalDate?: string | null;
  caregiverName?: string;
  status?: string | null;
  qualifyingActivity?: string[];
  exemptionReason?: string;
  exemptionProofSaved?: string;
  activityLog?: ActivityRow[];
  totalRecordedHours?: number;
  hoursMet?: boolean;
  usingIncomeOption?: boolean;
  exemptionApplies?: boolean;
  proofSaved?: string[];
  proofOtherNote?: string;
  missingProofNote?: string;
  missingProofOwner?: string;
  missingProofByDate?: string | null;
  submission?: Partial<Submission>;
  notice?: Partial<Notice>;
};

const STATUS_OPTIONS = [
  { id: "hours_80", label: "80+ qualifying hours" },
  { id: "income_580", label: "Household income of at least $580/month" },
  { id: "exemption", label: "Exemption / hardship" },
  { id: "need_help", label: "Need help determining status" },
];

const ACTIVITY_OPTIONS = [
  { id: "paid_work", label: "Paid work" },
  { id: "school", label: "School" },
  { id: "training", label: "Job/work training" },
  { id: "volunteer", label: "Volunteer/community service" },
  { id: "combination", label: "Combination" },
];

const PROOF_OPTIONS = [
  { id: "pay_stubs", label: "Pay stubs / proof of payment" },
  { id: "timesheets", label: "Timesheets / payroll record" },
  { id: "employer_letter", label: "Employer letter" },
  { id: "work_schedule", label: "Work schedule" },
  { id: "school_enrollment", label: "School enrollment/schedule" },
  { id: "training_attendance", label: "Training attendance record" },
  { id: "volunteer_log", label: "Volunteer/community-service log or letter" },
  { id: "exemption_medical_caregiver", label: "Exemption/medical/caregiver information" },
  { id: "dhs_notice", label: "DHS notice/request" },
  { id: "other", label: "Other" },
];

const SUBMISSION_REASONS = [
  { id: "application", label: "Application" },
  { id: "renewal", label: "Renewal" },
  { id: "information_request", label: "DHS information request" },
  { id: "cure_appeal", label: "Cure/appeal" },
];

const SUBMISSION_METHODS = [
  { id: "compass", label: "COMPASS/myCOMPASS" },
  { id: "phone", label: "Phone" },
  { id: "mail", label: "Mail" },
  { id: "cao", label: "CAO/In person" },
  { id: "other", label: "Other" },
];

const DHS_STATUSES = [
  { id: "accepted", label: "Accepted" },
  { id: "pending", label: "Pending" },
  { id: "info_requested", label: "More information requested" },
];

const CHALLENGE_REASONS = [
  { id: "hours_miscounted", label: "Hours miscounted" },
  { id: "proof_not_credited", label: "Proof not credited" },
  { id: "exemption_denied", label: "Exemption denied" },
  { id: "other", label: "Other" },
];

const EVIDENCE_ITEMS = [
  { id: "notice", label: "Notice" },
  { id: "activity_proof", label: "Activity proof" },
  { id: "submission_receipts", label: "Submission receipts" },
  { id: "medical_exemption_proof", label: "Medical/exemption proof" },
];

function toggleInArray(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

function emptyRow(): ActivityRow {
  return { datePeriod: "", source: "", activity: "", hours: null, proofSaved: false };
}

const chipBase =
  "rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition-colors text-left";
const chipOn = "border-[var(--color-cs-brand)] bg-[var(--color-cs-brand-soft)] text-[var(--color-cs-brand)]";
const chipOff = "border-[var(--color-cs-border)] bg-white text-[var(--color-cs-text-secondary)] hover:border-[var(--color-cs-brand)]";

export function WorkRequirementForm({
  beneficiaryId,
  month,
  monthLabel,
  beneficiaryName,
  defaultNextRenewalDate,
  record,
}: {
  beneficiaryId: string;
  month: string;
  monthLabel: string;
  beneficiaryName: string;
  defaultNextRenewalDate: string;
  record: RecordShape | null;
}) {
  const router = useRouter();

  const [caseNumber, setCaseNumber] = useState(record?.medicaidCaseNumber ?? "");
  const [nextRenewalDate, setNextRenewalDate] = useState(
    record?.nextRenewalDate ? String(record.nextRenewalDate).slice(0, 10) : defaultNextRenewalDate,
  );
  const [caregiverName, setCaregiverName] = useState(record?.caregiverName ?? "");
  const [status, setStatus] = useState<string | null>(record?.status ?? null);
  const [qualifyingActivity, setQualifyingActivity] = useState<string[]>(record?.qualifyingActivity ?? []);
  const [exemptionReason, setExemptionReason] = useState(record?.exemptionReason ?? "");
  const [exemptionProofSaved, setExemptionProofSaved] = useState(record?.exemptionProofSaved ?? "not_yet");

  const [rows, setRows] = useState<ActivityRow[]>(
    record?.activityLog?.length ? record.activityLog : [emptyRow()],
  );
  const [hoursMet, setHoursMet] = useState(record?.hoursMet ?? false);
  const [usingIncomeOption, setUsingIncomeOption] = useState(record?.usingIncomeOption ?? false);
  const [exemptionApplies, setExemptionApplies] = useState(record?.exemptionApplies ?? false);

  const [proofSaved, setProofSaved] = useState<string[]>(record?.proofSaved ?? []);
  const [proofOtherNote, setProofOtherNote] = useState(record?.proofOtherNote ?? "");
  const [missingProofNote, setMissingProofNote] = useState(record?.missingProofNote ?? "");
  const [missingProofOwner, setMissingProofOwner] = useState(record?.missingProofOwner ?? "");
  const [missingProofByDate, setMissingProofByDate] = useState(
    record?.missingProofByDate ? String(record.missingProofByDate).slice(0, 10) : "",
  );

  const [submission, setSubmission] = useState<Submission>({
    reason: record?.submission?.reason ?? null,
    submittedDate: record?.submission?.submittedDate ? String(record.submission.submittedDate).slice(0, 10) : null,
    method: record?.submission?.method ?? null,
    confirmationNumber: record?.submission?.confirmationNumber ?? "",
    dhsStatus: record?.submission?.dhsStatus ?? null,
    followUpDate: record?.submission?.followUpDate ? String(record.submission.followUpDate).slice(0, 10) : null,
    nextAction: record?.submission?.nextAction ?? "",
  });

  const [notice, setNotice] = useState<Notice>({
    received: record?.notice?.received ?? false,
    noticeDate: record?.notice?.noticeDate ? String(record.notice.noticeDate).slice(0, 10) : null,
    effectiveDate: record?.notice?.effectiveDate ? String(record.notice.effectiveDate).slice(0, 10) : null,
    appealDeadline: record?.notice?.appealDeadline ? String(record.notice.appealDeadline).slice(0, 10) : null,
    continuedBenefitDeadline: record?.notice?.continuedBenefitDeadline
      ? String(record.notice.continuedBenefitDeadline).slice(0, 10)
      : null,
    appealFiledDate: record?.notice?.appealFiledDate ? String(record.notice.appealFiledDate).slice(0, 10) : null,
    hearingType: record?.notice?.hearingType ?? null,
    receiptSaved: record?.notice?.receiptSaved ?? false,
    reasonChallenged: record?.notice?.reasonChallenged ?? [],
    reasonChallengedOther: record?.notice?.reasonChallengedOther ?? "",
    evidenceSaved: record?.notice?.evidenceSaved ?? [],
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalHours = rows.reduce((sum, r) => sum + (Number(r.hours) || 0), 0);

  function updateRow(i: number, patch: Partial<ActivityRow>) {
    setSaved(false);
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    const res = await fetch("/api/work-requirements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        beneficiaryId,
        month,
        medicaidCaseNumber: caseNumber,
        nextRenewalDate: nextRenewalDate || null,
        caregiverName,
        status,
        qualifyingActivity,
        exemptionReason,
        exemptionProofSaved,
        activityLog: rows.filter((r) => r.datePeriod || r.source || r.activity || r.hours),
        totalRecordedHours: totalHours,
        hoursMet,
        usingIncomeOption,
        exemptionApplies,
        proofSaved,
        proofOtherNote,
        missingProofNote,
        missingProofOwner,
        missingProofByDate: missingProofByDate || null,
        submission,
        notice,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Could not save this month's record.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Action-oriented top section: status, hours, beneficiary info */}
      <section className="rounded-[18px] border border-[var(--color-cs-brand)]/25 bg-[var(--color-cs-brand-soft)] p-4">
        <h2 className="mb-1 text-[15px] font-bold text-[var(--color-cs-brand)]">
          {monthLabel} — how {beneficiaryName || "the beneficiary"} is meeting the requirement
        </h2>
        <p className="mb-3 text-[12px] text-[var(--color-cs-text-secondary)]">
          Not yet an official DHS submission — a record of proof, kept ready for application, renewal,
          or a DHS request.
        </p>

        <div className="mb-3 grid gap-2 sm:grid-cols-2">
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            Medicaid / case no.
            <input
              className="cs-input mt-1 h-9 w-full"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
            />
          </label>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            Next Medicaid renewal
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={nextRenewalDate}
              onChange={(e) => setNextRenewalDate(e.target.value)}
            />
          </label>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)] sm:col-span-2">
            Authorized caregiver / representative
            <input
              className="cs-input mt-1 h-9 w-full"
              value={caregiverName}
              onChange={(e) => setCaregiverName(e.target.value)}
            />
          </label>
        </div>

        <div className="mb-3">
          <div className="mb-1.5 text-[12.5px] font-semibold text-[var(--color-cs-text)]">My status</div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSaved(false);
                  setStatus((cur) => (cur === o.id ? null : o.id));
                }}
                className={`${chipBase} ${status === o.id ? chipOn : chipOff}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-1">
          <div className="mb-1.5 text-[12.5px] font-semibold text-[var(--color-cs-text)]">
            Qualifying activity
          </div>
          <div className="flex flex-wrap gap-2">
            {ACTIVITY_OPTIONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSaved(false);
                  setQualifyingActivity((cur) => toggleInArray(cur, o.id));
                }}
                className={`${chipBase} ${qualifyingActivity.includes(o.id) ? chipOn : chipOff}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {status === "exemption" && (
          <div className="mt-3 rounded-[14px] bg-white/70 p-3">
            <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
              Exemption claimed, if applicable
              <textarea
                className="cs-input mt-1 w-full"
                rows={2}
                value={exemptionReason}
                onChange={(e) => setExemptionReason(e.target.value)}
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[var(--color-cs-text-secondary)]">
              Exemption information/proof saved in Vault?
              {(["yes", "no", "not_yet"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setExemptionProofSaved(v)}
                  className={`${chipBase} !px-2.5 !py-1 ${exemptionProofSaved === v ? chipOn : chipOff}`}
                >
                  {v === "not_yet" ? "Not yet" : v[0].toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Monthly activity & proof log with hours progress box */}
      <section className="rounded-[18px] border border-[var(--color-cs-border)] bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-bold text-[var(--color-cs-text)]">Monthly activity &amp; proof log</h2>
          <div className="rounded-xl bg-[var(--color-cs-success-bg)] px-4 py-2 text-center">
            <div className="text-[20px] font-extrabold tabular-nums text-[var(--color-cs-success)]">
              {totalHours} / 80
            </div>
            <div className="text-[10.5px] font-semibold uppercase tracking-wide text-[var(--color-cs-success)]">
              recorded hours
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {rows.map((row, i) => (
            <div key={i} className="grid grid-cols-1 gap-1.5 rounded-[12px] bg-[var(--color-cs-surface)] p-2.5 sm:grid-cols-[1fr_1.4fr_1fr_5rem_auto_auto]">
              <input
                placeholder="Date / period"
                className="cs-input h-9"
                value={row.datePeriod}
                onChange={(e) => updateRow(i, { datePeriod: e.target.value })}
              />
              <input
                placeholder="Employer, school, program, or org"
                className="cs-input h-9"
                value={row.source}
                onChange={(e) => updateRow(i, { source: e.target.value })}
              />
              <input
                placeholder="Activity"
                className="cs-input h-9"
                value={row.activity}
                onChange={(e) => updateRow(i, { activity: e.target.value })}
              />
              <input
                type="number"
                min={0}
                placeholder="Hours"
                className="cs-input h-9"
                value={row.hours ?? ""}
                onChange={(e) => updateRow(i, { hours: e.target.value === "" ? null : Number(e.target.value) })}
              />
              <label className="flex items-center gap-1.5 whitespace-nowrap px-1 text-[11.5px] text-[var(--color-cs-text-secondary)]">
                <input
                  type="checkbox"
                  checked={row.proofSaved}
                  onChange={(e) => updateRow(i, { proofSaved: e.target.checked })}
                />
                Proof saved
              </label>
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => {
                  setSaved(false);
                  setRows((prev) => prev.filter((_, idx) => idx !== i));
                }}
                className="cs-circbtn !h-8 !w-8 justify-self-end text-[var(--color-cs-danger)]"
              >
                <IconTrash size={14} stroke={2} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, emptyRow()])}
          className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-cs-brand)] hover:underline"
        >
          <IconPlus size={14} stroke={2.2} /> Add row
        </button>

        <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--color-cs-sep)] pt-3">
          {[
            { key: "hoursMet", label: "80-hour requirement met", value: hoursMet, set: setHoursMet },
            { key: "income", label: "Using $580 income option", value: usingIncomeOption, set: setUsingIncomeOption },
            { key: "exemption", label: "Exemption applies", value: exemptionApplies, set: setExemptionApplies },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => {
                setSaved(false);
                f.set(!f.value);
              }}
              className={`${chipBase} ${f.value ? chipOn : chipOff}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Proof Check — amber */}
      <section className="rounded-[18px] border border-[var(--color-cs-warning)]/30 bg-[var(--color-cs-warning-bg)] p-4">
        <h2 className="mb-2 text-[15px] font-bold text-[var(--color-cs-warning)]">
          Proof saved in the Vault
        </h2>
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {PROOF_OPTIONS.map((o) => (
            <label key={o.id} className="flex items-center gap-2 text-[12.5px] text-[var(--color-cs-text)]">
              <input
                type="checkbox"
                checked={proofSaved.includes(o.id)}
                onChange={() => {
                  setSaved(false);
                  setProofSaved((cur) => toggleInArray(cur, o.id));
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
        {proofSaved.includes("other") && (
          <input
            placeholder="Describe the other proof"
            className="cs-input mt-2 h-9 w-full"
            value={proofOtherNote}
            onChange={(e) => setProofOtherNote(e.target.value)}
          />
        )}

        <div className="mt-3 grid gap-2 border-t border-[var(--color-cs-warning)]/25 pt-3 sm:grid-cols-3">
          <label className="text-[12px] text-[var(--color-cs-text-secondary)] sm:col-span-1">
            Missing proof still needed
            <textarea
              className="cs-input mt-1 w-full"
              rows={2}
              value={missingProofNote}
              onChange={(e) => setMissingProofNote(e.target.value)}
            />
          </label>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            Who will obtain it?
            <input
              className="cs-input mt-1 h-9 w-full"
              value={missingProofOwner}
              onChange={(e) => setMissingProofOwner(e.target.value)}
            />
          </label>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            By date
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={missingProofByDate}
              onChange={(e) => setMissingProofByDate(e.target.value)}
            />
          </label>
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-cs-text-secondary)]">
          PA DHS says paid work must be verified (e.g. a pay stub). School, training, volunteering, and
          combinations may also satisfy the requirement.
        </p>
      </section>

      {/* DHS submission & follow-up */}
      <section className="rounded-[18px] border border-[var(--color-cs-border)] bg-white p-4">
        <h2 className="mb-2 text-[15px] font-bold text-[var(--color-cs-text)]">DHS submission &amp; follow-up</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-cs-text-secondary)]">Reason</div>
            <div className="flex flex-wrap gap-2">
              {SUBMISSION_REASONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSubmission((s) => ({ ...s, reason: s.reason === o.id ? null : o.id }))}
                  className={`${chipBase} !px-2.5 !py-1 ${submission.reason === o.id ? chipOn : chipOff}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-cs-text-secondary)]">Method</div>
            <div className="flex flex-wrap gap-2">
              {SUBMISSION_METHODS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSubmission((s) => ({ ...s, method: s.method === o.id ? null : o.id }))}
                  className={`${chipBase} !px-2.5 !py-1 ${submission.method === o.id ? chipOn : chipOff}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            Submitted
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={submission.submittedDate ?? ""}
              onChange={(e) => setSubmission((s) => ({ ...s, submittedDate: e.target.value || null }))}
            />
          </label>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            Confirmation / receipt #
            <input
              className="cs-input mt-1 h-9 w-full"
              value={submission.confirmationNumber}
              onChange={(e) => setSubmission((s) => ({ ...s, confirmationNumber: e.target.value }))}
            />
          </label>
          <div>
            <div className="mb-1.5 text-[12px] font-semibold text-[var(--color-cs-text-secondary)]">DHS status</div>
            <div className="flex flex-wrap gap-2">
              {DHS_STATUSES.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSubmission((s) => ({ ...s, dhsStatus: s.dhsStatus === o.id ? null : o.id }))}
                  className={`${chipBase} !px-2.5 !py-1 ${submission.dhsStatus === o.id ? chipOn : chipOff}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)]">
            Follow-up date
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={submission.followUpDate ?? ""}
              onChange={(e) => setSubmission((s) => ({ ...s, followUpDate: e.target.value || null }))}
            />
          </label>
          <label className="text-[12px] text-[var(--color-cs-text-secondary)] sm:col-span-2">
            Next action
            <input
              className="cs-input mt-1 h-9 w-full"
              value={submission.nextAction}
              onChange={(e) => setSubmission((s) => ({ ...s, nextAction: e.target.value }))}
            />
          </label>
        </div>
      </section>

      {/* NOTICE RECEIVED — red */}
      <section className="rounded-[18px] border-2 border-[var(--color-cs-danger)] bg-[var(--color-cs-danger-bg)] p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-[16px] font-extrabold uppercase tracking-tight text-[var(--color-cs-danger)]">
            Notice received? Act now
          </h2>
          <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-cs-danger)]">
            <input
              type="checkbox"
              checked={notice.received}
              onChange={(e) => setNotice((n) => ({ ...n, received: e.target.checked }))}
            />
            Notice received this month
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-4">
          <label className="text-[11.5px] font-semibold text-[var(--color-cs-danger)]">
            Notice date
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={notice.noticeDate ?? ""}
              onChange={(e) => setNotice((n) => ({ ...n, noticeDate: e.target.value || null }))}
            />
          </label>
          <label className="text-[11.5px] font-semibold text-[var(--color-cs-danger)]">
            Effective date
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={notice.effectiveDate ?? ""}
              onChange={(e) => setNotice((n) => ({ ...n, effectiveDate: e.target.value || null }))}
            />
          </label>
          <label className="text-[11.5px] font-semibold text-[var(--color-cs-danger)]">
            Appeal deadline (on notice)
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={notice.appealDeadline ?? ""}
              onChange={(e) => setNotice((n) => ({ ...n, appealDeadline: e.target.value || null }))}
            />
          </label>
          <label className="text-[11.5px] font-semibold text-[var(--color-cs-danger)]">
            Continued-benefit deadline (on notice)
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={notice.continuedBenefitDeadline ?? ""}
              onChange={(e) => setNotice((n) => ({ ...n, continuedBenefitDeadline: e.target.value || null }))}
            />
          </label>
        </div>

        <p className="mt-2 text-[11px] font-medium text-[var(--color-cs-danger)]">
          Most CAO appeals must generally be filed within 30 days of the written notice, but protecting
          continued benefits can require action during a shorter advance-notice period. Use the exact
          deadlines printed on the notice, not a general rule.
        </p>

        <div className="mt-3 grid gap-2 border-t border-[var(--color-cs-danger)]/25 pt-3 sm:grid-cols-3">
          <label className="text-[11.5px] font-semibold text-[var(--color-cs-danger)]">
            Appeal filed
            <input
              type="date"
              className="cs-input mt-1 h-9 w-full"
              value={notice.appealFiledDate ?? ""}
              onChange={(e) => setNotice((n) => ({ ...n, appealFiledDate: e.target.value || null }))}
            />
          </label>
          <div>
            <div className="mb-1 text-[11.5px] font-semibold text-[var(--color-cs-danger)]">Hearing</div>
            <div className="flex gap-2">
              {(["telephone", "in_person"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setNotice((n) => ({ ...n, hearingType: n.hearingType === v ? null : v }))}
                  className={`${chipBase} !px-2.5 !py-1 ${notice.hearingType === v ? chipOn : chipOff}`}
                >
                  {v === "telephone" ? "Telephone" : "In person"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-1.5 self-end text-[12px] font-semibold text-[var(--color-cs-danger)]">
            <input
              type="checkbox"
              checked={notice.receiptSaved}
              onChange={(e) => setNotice((n) => ({ ...n, receiptSaved: e.target.checked }))}
            />
            Receipt saved
          </label>
        </div>

        <div className="mt-3">
          <div className="mb-1 text-[11.5px] font-semibold text-[var(--color-cs-danger)]">Reason challenged</div>
          <div className="flex flex-wrap gap-2">
            {CHALLENGE_REASONS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() =>
                  setNotice((n) => ({ ...n, reasonChallenged: toggleInArray(n.reasonChallenged, o.id) }))
                }
                className={`${chipBase} !px-2.5 !py-1 ${notice.reasonChallenged.includes(o.id) ? chipOn : chipOff}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <div className="mb-1 text-[11.5px] font-semibold text-[var(--color-cs-danger)]">Appeal evidence saved</div>
          <div className="flex flex-wrap gap-2">
            {EVIDENCE_ITEMS.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() =>
                  setNotice((n) => ({ ...n, evidenceSaved: toggleInArray(n.evidenceSaved, o.id) }))
                }
                className={`${chipBase} !px-2.5 !py-1 ${notice.evidenceSaved.includes(o.id) ? chipOn : chipOff}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[11.5px] font-semibold text-[var(--color-cs-danger)]">
          Free PA Medicaid legal help — Pennsylvania Health Law Project: 1-800-274-3258
        </p>
      </section>

      {error && <p className="text-xs text-[var(--color-cs-danger)]">{error}</p>}
      <div className="flex items-center gap-3 border-t border-[var(--color-cs-sep)] pt-3">
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-xl bg-[var(--color-cs-brand)] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[var(--color-cs-brand-hover)] disabled:opacity-50"
        >
          {saving ? "Saving…" : `Save ${monthLabel} record`}
        </button>
        {saved && <span className="text-[12px] text-[var(--color-cs-success)]">Saved</span>}
      </div>
      <p className="pb-2 text-[10.5px] text-[var(--color-cs-text-secondary)]">
        MyBenefitsPA works alongside PA DHS, COMPASS/myCOMPASS and other official systems. MyBenefitsPA
        does not determine Medicaid eligibility or replace instructions in an official notice.
      </p>
    </div>
  );
}
