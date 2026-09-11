/**
 * 30 beneficiary eligibility-loss prevention scenarios from the clarified
 * MyBenefitsPA product brief (closure-code notes included). Educational
 * action plans — not individual eligibility determinations.
 */

export type LossPersonaGroup =
  | "procedural"
  | "substantive"
  | "hybrid"
  | "policy";

export type EligibilityLossPersona = {
  n: number;
  id: string;
  persona: string;
  title: string;
  group: LossPersonaGroup;
  programs: string[];
  trigger: string;
  consequence: string;
  classification: string;
  slideReason?: string;
  steps: [string, string, string, string, string, string];
};

export const CLOSURE_CODE_NOTES = {
  "042": "Failure to Furnish Required Information — a recorded case action, not proof of who caused the failure or that the person was substantively ineligible.",
  "440": "Semi-Annual Reporting Requirements Not Met — a procedural label on a budget/case action, not necessarily a unique person or permanent loss.",
  "474": "SNAP End of Certification Period — the budget closed because the certification period ended. It does not by itself prove a missed renewal, household fault, or substantive ineligibility.",
} as const;

export const ELIGIBILITY_LOSS_PERSONAS: EligibilityLossPersona[] = [
  {
    n: 1,
    id: "elena_medicaid_renewal",
    persona: "Elena",
    title: "Medicaid renewal never completed",
    group: "procedural",
    programs: ["MedicaidABD", "MedicaidMAGI", "SNAP"],
    trigger:
      "Elena remains financially eligible but sets aside her Medicaid renewal because she believes coverage renews automatically.",
    consequence:
      "Medicaid may close for failure to complete the renewal even though she still meets the substantive rules. SNAP may remain open on a different certification schedule.",
    classification: "Purely procedural renewal failure.",
    steps: [
      "Open COMPASS and every mailed notice immediately. Confirm the exact renewal due date, case number, requested verifications, and whether the renewal is still open online.",
      "Submit the signed renewal and all requested proof before the deadline. Save the confirmation page, upload receipts, and keep a complete copy.",
      "Call the County Assistance Office after submission and ask the worker to identify any missing or illegible item. Record the worker's name, date, time, and instructions.",
      "If the due date passed but the case remains open, submit the renewal immediately and ask that it be processed as a late renewal rather than waiting for closure.",
      "If coverage already closed for a procedural reason, ask for reconsideration under the applicable post-closure period and file a new application if the agency will not reopen it.",
      "Appeal by the deadline on the adverse notice and request continued benefits within any shorter continuation period. At the same time, screen for another Medicaid category or temporary replacement coverage.",
    ],
  },
  {
    n: 2,
    id: "jamal_snap_interview",
    persona: "Jamal",
    title: "Missed SNAP interview",
    group: "procedural",
    programs: ["SNAP", "MedicaidMAGI"],
    trigger:
      "Jamal submits his SNAP renewal but misses the telephone interview because DHS calls an obsolete telephone number.",
    consequence:
      "SNAP may close for failure to complete the interview. Medicaid should be evaluated separately because it follows a different eligibility process.",
    classification: "Procedural interview failure.",
    steps: [
      "Update telephone number, mailing address, email, and communication preferences in COMPASS and directly with the County Assistance Office.",
      "Call before the interview deadline, explain that the agency used an obsolete number, and request the earliest rescheduled interview.",
      "If telephone access is unreliable, request an in-person interview, an authorized representative, interpreter services, or another disability or communication accommodation.",
      "Upload income, household-composition, shelter, utility, and allowable medical-expense proof before the rescheduled interview.",
      "After the interview, obtain confirmation that the interview requirement is satisfied and ask whether any additional item remains outstanding.",
      "If SNAP has closed, ask whether recertification can still be completed or reopened for agency error or good cause; otherwise appeal when supported and submit a new application immediately.",
    ],
  },
  {
    n: 3,
    id: "grace_missing_bank_statement",
    persona: "Grace",
    title: "Missing bank statement",
    group: "procedural",
    programs: ["SSI", "MedicaidABD", "SNAP"],
    trigger:
      "Grace returns her Medicaid renewal but provides only one of the two bank statements requested. Her actual balance remains below the applicable resource limit.",
    consequence:
      "Medicaid may terminate for failure to verify resources even though Grace remains financially eligible.",
    classification: "Procedural verification failure.",
    steps: [
      "Read the verification request literally and identify the exact account, statement period, due date, and form of proof required. A transaction screenshot may not satisfy a request for a complete statement.",
      "Download every page of the requested statement, including ownership, account number, opening and closing balances, and all transactions.",
      "If a statement is unavailable, obtain a signed bank letter showing ownership, current balance, and the historical balance information requested.",
      "Upload or deliver the document through an approved method, label it by account and month, and retain proof of transmission.",
      "Provide a written explanation and supporting records for unusual deposits so a transfer, reimbursement, loan, excluded payment, or returned item is not misclassified as income.",
      "Call before the deadline to confirm the statement is legible and sufficient. Appeal and attach the transmission proof if a closure notice issues despite timely compliance.",
    ],
  },
  {
    n: 4,
    id: "robert_mawd_premium",
    persona: "Robert",
    title: "MAWD premium lapse",
    group: "procedural",
    programs: ["MAWD", "SSDI"],
    trigger:
      "Robert remains employed and otherwise eligible for MAWD, but his automatic premium payment fails after his debit card expires.",
    consequence:
      "MAWD may terminate for premium nonpayment even though he continues to meet disability, employment, and financial requirements. SSDI and Medicare, if applicable, are separate benefits.",
    classification: "Procedural payment failure.",
    steps: [
      "Contact the MAWD premium unit or the contact on the notice and confirm the premium amount, arrears, due date, grace or cure period, and proposed termination date.",
      "Replace the expired payment method and pay the amount required to prevent closure through an accepted channel. Keep the receipt and confirmation number.",
      "Ask whether all arrears must be paid at once or whether a payment arrangement, hardship process, or reinstatement procedure is available.",
      "Verify that the payment posted to the correct case and coverage month. Obtain written or electronic confirmation that MAWD remains active.",
      "Set two alerts for future premiums: one before the due date and one after the expected withdrawal so a failed payment is detected immediately.",
      "If termination cannot be cured, apply before the closure date for another Medicaid category supported by the facts, and appeal any incorrect premium calculation.",
    ],
  },
  {
    n: 5,
    id: "kevin_qmb_address",
    persona: "Kevin",
    title: "Address change causes QMB loss",
    group: "procedural",
    programs: ["SSDI", "QMB", "ExtraHelp"],
    trigger:
      "Kevin moves but updates his address only with SSA. Pennsylvania DHS sends the QMB renewal notice to his former address.",
    consequence:
      "QMB may close for non-renewal, causing Medicare premiums and cost sharing to reappear. SSDI and Medicare do not end merely because QMB closes.",
    classification: "Procedural notice and address failure.",
    steps: [
      "Update the address separately with DHS/COMPASS, the County Assistance Office, SSA, Medicare, the prescription or Medicare plan, and any managed-care organization.",
      "Retrieve pending renewals, verification requests, and closure notices from COMPASS and ask the agency to reissue notices to the correct address.",
      "Complete the QMB renewal immediately and submit current income, resource, and Medicare proof with transmission confirmation.",
      "Check the Social Security payment and bank account for a newly deducted Part B premium and track any reimbursement due if QMB is restored retroactively.",
      "Document the move date, address-update history, returned mail, and agency contacts. Request reopening or appeal if ineffective notice caused the missed renewal.",
      "Screen for SLMB, QI, Extra Help, or other Medicare assistance so premium support is not lost entirely if QMB is no longer available.",
    ],
  },
  {
    n: 6,
    id: "aisha_magi_work_proof",
    persona: "Aisha",
    title: "Works enough but cannot prove it",
    group: "procedural",
    programs: ["MedicaidMAGI"],
    trigger:
      "Aisha works approximately 90 hours each month, but irregular payroll records do not clearly show the hours worked during the reporting period under the anticipated 2027 MAGI work-reporting framework.",
    consequence:
      "If those rules are implemented as described, coverage could be threatened for failure to demonstrate compliance even though she completed sufficient qualifying activity.",
    classification: "Procedural non-verification under a future policy framework.",
    steps: [
      "First verify that the rule is in effect, applies to this Medicaid category, and has not been delayed or modified. Do not treat projected implementation details as final.",
      "Create a monthly activity file containing pay stubs, time sheets, work schedules, payroll records, and an employer letter showing the actual dates and hours worked.",
      "If permitted under the final rules, combine employment with education, training, approved volunteering, or other qualifying activity and document each category separately.",
      "Screen for every exemption before requiring hours reporting, including disability, medical frailty, pregnancy, qualifying caregiving, or another exemption in final guidance.",
      "Upload proof by the required reporting deadline and retain the submission confirmation. If delayed payroll understates the month, obtain an employer certification of hours actually worked.",
      "If the agency finds noncompliance incorrectly, request an immediate correction and appeal any adverse notice with the time records, employer certification, and exemption evidence attached.",
    ],
  },
  {
    n: 7,
    id: "noah_waiver_reassessment",
    persona: "Noah",
    title: "Waiver reassessment missed",
    group: "procedural",
    programs: ["MedicaidWaiver", "SSDI"],
    trigger:
      "Noah's caregiver completes the financial renewal but overlooks notices scheduling the separate functional or level-of-care reassessment.",
    consequence:
      "Waiver services may be interrupted or terminated for failure to establish continuing functional eligibility even though financial eligibility was renewed.",
    classification: "Procedural nonfinancial review failure.",
    steps: [
      "Contact the service coordinator, supports coordinator, or managed-care plan immediately and request the earliest rescheduled assessment.",
      "Confirm whether the missed appointment threatens particular services, the waiver enrollment, or the underlying Medicaid category, and identify every open deadline.",
      "Gather current physician records, therapy reports, care plans, incident reports, medication lists, and caregiver statements documenting continuing level-of-care needs.",
      "Request a home visit, remote assessment, interpreter, accessible format, transportation assistance, or another accommodation if disability or communication barriers contributed.",
      "Track the financial renewal and functional reassessment as separate obligations. Completion of one does not substitute for the other.",
      "If a reduction or termination notice issues, appeal promptly and request continuation of existing services during appeal when the notice and program rules permit it.",
    ],
  },
  {
    n: 8,
    id: "maria_earnings_double",
    persona: "Maria",
    title: "Earnings double after starting a job",
    group: "substantive",
    programs: ["SSI", "SSDI", "MedicaidABD", "SNAP"],
    trigger:
      "Maria starts a job and her monthly earnings double while SSA and DHS are still evaluating the work activity.",
    consequence:
      "SSI may decrease, SSDI cash may later be suspended or terminated after applicable work incentives, and SNAP may decrease. Medicaid should not be assumed lost because SSI continued-Medicaid protections, MAWD, Waiver Medicaid, or another category may be available.",
    classification: "Substantive earnings change with preventable cascading consequences.",
    steps: [
      "Before accepting additional hours, project gross wages month by month and separately model SSI countable income, SSDI work incentives, SNAP household income, and each available Medicaid category.",
      "Report wages to SSA and DHS through approved methods and keep every pay stub and reporting receipt so an overpayment or incorrect closure can be contested.",
      "For SSDI, identify and document impairment-related work expenses, employer subsidy, special conditions, unsuccessful work attempt, or other work incentives before treating gross wages as countable earnings.",
      "Track Trial Work Period months and the Extended Period of Eligibility so one high month is not assumed to cause immediate SSDI termination.",
      "Before SSI cash reaches zero, screen for continued Medicaid under SSI work rules, MAWD, Waiver Medicaid, or another category and submit any needed application before the existing category closes.",
      "Recalculate SNAP using the correct household, earned-income deduction, shelter costs, and any allowable disability-related medical expenses. Compare take-home pay, premiums, and benefit changes before changing hours.",
    ],
  },
  {
    n: 9,
    id: "anthony_sga_after_twp",
    persona: "Anthony",
    title: "Earnings remain above SGA",
    group: "substantive",
    programs: ["SSDI", "QMB"],
    trigger:
      "Anthony completes his Trial Work Period and continues working at a level that SSA may treat as substantial gainful activity.",
    consequence:
      "SSDI cash benefits may be suspended or terminated under the work rules. Medicare may continue for a statutory period, while QMB remains subject to separate financial rules.",
    classification: "Substantive SSDI work-cliff risk.",
    steps: [
      "Reconstruct Trial Work Period and later work months from pay stubs, employer records, and SSA's work history. Verify that SSA counted the correct months.",
      "Calculate countable earnings rather than relying on bank deposits alone. Document IRWEs, subsidy, special conditions, paid time not actually worked, and any unsuccessful work attempt.",
      "Submit the evidence before SSA issues a final work determination and request a work review when the agency's earnings record is incomplete or inaccurate.",
      "Use a qualified benefits counselor to compare continued work, cash-benefit suspension, expedited reinstatement, Medicare continuation, employer coverage, and possible MAWD eligibility.",
      "Review QMB separately because loss or suspension of SSDI cash does not automatically establish or eliminate QMB. Recalculate using the actual wage pattern and applicable exclusions.",
      "If a cessation or overpayment notice issues, appeal within the stated deadline and request reconsideration, waiver, or another available remedy supported by the facts.",
    ],
  },
  {
    n: 10,
    id: "sophia_inheritance_checking",
    persona: "Sophia",
    title: "Inheritance retained in checking",
    group: "substantive",
    programs: ["SSI", "MedicaidABD", "SNAP"],
    trigger: "Sophia receives a $12,000 inheritance directly and retains the money into the following month.",
    consequence:
      "The inheritance may be countable income in the month received and a countable resource thereafter, threatening SSI and SSI-related Medicaid. Spending the money later may cure the resource problem but does not necessarily erase the income event in the month of receipt.",
    classification: "Substantive income and resource excess.",
    steps: [
      "Before the estate distributes funds, obtain benefits and estate-planning advice regarding a properly authorized special needs trust, pooled trust, ABLE account, or other lawful arrangement for which she qualifies.",
      "Do not direct her to give the money away or transfer it for less than fair value. An uncompensated transfer can create separate eligibility problems.",
      "If funds will be received directly, distinguish the receipt-month income issue from the next-month resource issue. A same-month spend-down may prevent excess resources but may not eliminate the income consequence.",
      "Prepare a lawful plan for permitted purchases, debt payment, medical needs, housing, education, transportation, or exempt personal property before the next resource-measurement date.",
      "Report the inheritance accurately and preserve the will, estate accounting, deposit record, trust or ABLE documents, and receipts showing the disposition of the funds.",
      "Screen for Medicaid categories with different resource rules and appeal any determination that counts excluded property, uses the wrong month, or misstates the balance.",
    ],
  },
  {
    n: 11,
    id: "george_gift_qmb_lis",
    persona: "George",
    title: "Gift creates QMB and Extra Help resource problems",
    group: "substantive",
    programs: ["SSDI", "QMB", "ExtraHelp"],
    trigger: "George's sister gives him $25,000, which remains in savings.",
    consequence:
      "SSDI and Medicare ordinarily continue because SSDI has no asset test, but QMB and Extra Help may be threatened by their separate resource rules.",
    classification: "Substantive loss limited to means-tested assistance.",
    steps: [
      "Before the gift is made, verify which assets count for QMB and Extra Help and explain to the donor that SSDI's lack of an asset limit does not protect the other programs.",
      "Where appropriate, use a benefit-compatible alternative such as a properly drafted third-party special needs trust, an eligible ABLE contribution, or direct payment of specific expenses when program rules permit it.",
      "If the money has already arrived, identify lawful exempt purchases, debt payments, or permitted transfers before the relevant resource-measurement date. Do not conceal assets or transfer them below fair value.",
      "Keep the gift letter, bank records, receipts, and any trust or ABLE documents so each program can classify the transaction accurately.",
      "Report the change to the agencies administering QMB and Extra Help as required, but do not report or describe it as an SSDI eligibility event.",
      "If QMB is no longer available, screen for SLMB, QI, pharmaceutical assistance, plan-based cost assistance, and any later reapplication date after resources fall.",
    ],
  },
  {
    n: 12,
    id: "denise_marriage_deeming",
    persona: "Denise",
    title: "Marriage causes spouse deeming",
    group: "substantive",
    programs: ["SSI", "MedicaidABD", "SNAP"],
    trigger: "Denise marries and lives with a spouse who earns $4,500 per month and has substantial savings.",
    consequence:
      "Spousal income and resources may be deemed to Denise for SSI and SSI-related Medicaid. SNAP must treat spouses living together as part of the same required household and recalculate income and deductions.",
    classification: "Substantive household and financial change.",
    steps: [
      "Before marriage, run a benefit-impact analysis using the spouse's income, resources, dependents, health coverage, and household expenses. A prenuptial agreement generally does not prevent federal deeming.",
      "Report the marriage and living arrangement timely to SSA and DHS and provide accurate proof of the spouse's income and resources.",
      "Determine whether she qualifies for MAWD, Waiver Medicaid, MAGI Medicaid, a Medicare Savings Program, or another category using different financial rules.",
      "Compare the spouse's employer coverage, Medicare coordination, Medicaid premiums, deductibles, provider networks, and prescription costs before selecting replacement coverage.",
      "Recalculate SNAP using the mandatory spouse household and all available deductions, including shelter and allowable elderly or disabled medical expenses.",
      "If an agency applies deeming incorrectly, counts excluded assets, or uses the wrong household period, submit correction evidence and appeal.",
    ],
  },
  {
    n: 13,
    id: "marcus_age18_cdr",
    persona: "Marcus",
    title: "Age-18 disability redetermination",
    group: "substantive",
    programs: ["SSI", "MedicaidABD"],
    trigger: "Marcus turns 18 and SSA evaluates him under the adult disability standard rather than the childhood standard.",
    consequence:
      "SSI may terminate if SSA finds that he does not meet the adult disability standard. SSI-linked Medicaid may also be endangered unless another Medicaid pathway applies.",
    classification: "Substantive life-course and nonfinancial eligibility transition.",
    steps: [
      "Begin preparation well before age 18 by collecting diagnoses, treatment records, psychological testing, school records, IEPs, vocational evaluations, and evidence of supervision and support needs.",
      "Complete adult function and work-history forms with specific examples of tasks he cannot initiate, sustain, complete, or perform safely and independently.",
      "Ask treating providers to address adult functional limitations such as attendance, pace, concentration, social interaction, self-care, judgment, safety, and the need for prompting or supervision.",
      "Document participation in an IEP, vocational rehabilitation, or another approved education or employment-support program that may support continuation under applicable rules.",
      "If SSA denies adult eligibility, appeal within the deadline on the notice and request continued SSI payments within any shorter continuation period stated on the notice.",
      "Apply for another Medicaid category before SSI-linked Medicaid ends and preserve both SSA and DHS notices so the disability and medical-coverage appeals remain coordinated.",
    ],
  },
  {
    n: 14,
    id: "priya_mawd_stops_work",
    persona: "Priya",
    title: "Stops working while enrolled in MAWD",
    group: "substantive",
    programs: ["MAWD", "SSDI"],
    trigger: "Priya leaves her part-time job and no longer has paid employment or self-employment.",
    consequence:
      "She may lose MAWD because paid work is a program condition even if her income, resources, and disability otherwise remain within MAWD standards.",
    classification: "Substantive Medicaid-category loss.",
    steps: [
      "Before employment ends, determine whether she remains an employee during paid leave, sick leave, a temporary layoff, or another short absence and obtain employer documentation.",
      "If she can safely continue legitimate paid work, preserve a real, documented employment or self-employment relationship. Do not create sham employment solely to satisfy eligibility.",
      "Apply before MAWD closes for another Medicaid category, including SSI-related Medicaid, Waiver Medicaid, MAGI Medicaid, or a Medicare Savings Program, depending on the facts.",
      "Submit proof supporting the alternate category promptly and ask DHS to transfer the case without a coverage gap rather than closing it outright.",
      "Review whether the loss of work reflects a worsening disability that should be documented for SSA or for a waiver or disability-based Medicaid application.",
      "If DHS closes MAWD without evaluating another apparent category, request reconsideration or appeal and attach the alternate-category application and supporting proof.",
    ],
  },
  {
    n: 15,
    id: "beth_snap_voluntary_quit",
    persona: "Beth",
    title: "Voluntarily quits without good cause",
    group: "substantive",
    programs: ["SNAP"],
    trigger: "Beth is subject to SNAP general work rules and plans to quit a suitable 35-hour-per-week job.",
    consequence:
      "She may be sanctioned or disqualified if the separation is treated as a voluntary quit without good cause or an exemption.",
    classification: "Substantive work-rule violation.",
    steps: [
      "Before she resigns, screen for every SNAP exemption and recognized good-cause ground, including illness, disability, unsafe conditions, discrimination, lack of transportation, unavailable childcare, or another documented barrier.",
      "Obtain proof before leaving: physician letters, childcare denials, transportation records, complaints to the employer, schedules, wage records, or evidence of unsafe or unlawful conditions.",
      "Ask the County Assistance Office or employment-and-training worker how the proposed separation will be treated and what proof is required. Record the response.",
      "Where feasible, seek a transfer, accommodation, approved leave, reduced schedule with good cause, or another job before resigning.",
      "If she must leave immediately for health or safety reasons, report the specific reason promptly and submit supporting proof rather than describing the event only as a voluntary quit.",
      "Appeal any sanction that ignores a documented exemption or good cause and confirm how the sanction affects the other members of the SNAP household.",
    ],
  },
  {
    n: 16,
    id: "lucas_magi_income",
    persona: "Lucas",
    title: "Current monthly income exceeds MAGI Medicaid limit",
    group: "substantive",
    programs: ["MedicaidMAGI"],
    trigger:
      "Lucas receives a promotion that raises his expected current monthly household income above the applicable Medicaid expansion standard.",
    consequence:
      "He may lose MAGI Medicaid after proper notice and redetermination. His savings account is not the cause because MAGI Medicaid does not use an asset test.",
    classification: "Substantive current-income loss.",
    steps: [
      "Calculate the household's expected current monthly MAGI using the applicable Medicaid methodology. Do not treat one large bank deposit or one anomalous paycheck as the entire eligibility calculation.",
      "Distinguish Medicaid's current-month income analysis from the Marketplace's projected annual-income calculation. Use the correct period for each program.",
      "Verify tax household, household size, taxable income, and lawful pre-tax adjustments. Correct any agency calculation that uses gross deposits rather than the applicable income methodology.",
      "Report the change and obtain the expected Medicaid termination date in writing.",
      "Use the Medicaid loss as a special enrollment event and select Marketplace or employer coverage before Medicaid ends so the replacement plan can start without a gap.",
      "Screen Lucas and every household member for disability-based Medicaid, MAWD, a Waiver, CHIP, pregnancy coverage, or another category before accepting a complete loss of public coverage.",
    ],
  },
  {
    n: 17,
    id: "david_snt_rent_cash",
    persona: "David",
    title: "SNT sends rent money directly to him",
    group: "hybrid",
    programs: ["SSI", "MedicaidABD", "SNAP"],
    trigger:
      "David's special needs trust plans to transfer $1,500 directly into his checking account so he can pay rent.",
    consequence:
      "Cash paid directly to David may be treated as unearned income for SSI and can affect related means-tested benefits. A direct landlord payment avoids cash to David but can still affect SSI because rent is a shelter expense.",
    classification: "Avoidable substantive consequence caused by the method of trust distribution.",
    steps: [
      "Before the transfer posts, have the trustee stop or cancel the beneficiary-directed cash payment and review the trust's distribution authority.",
      "Where appropriate, have the trustee pay the landlord or vendor directly rather than giving cash, but calculate the possible SSI shelter reduction before choosing that method.",
      "If he is ABLE-eligible, ask qualified benefits counsel whether the trust may transfer funds to his ABLE account and whether the planned expense is a qualified disability expense.",
      "Consider permitted non-shelter goods and services that improve quality of life without creating direct cash income, subject to the trust terms and program rules.",
      "If cash has already arrived, do not assume returning or spending it erases the income event. Preserve the transfer record, notify the trustee, report accurately, and obtain benefits advice before moving the money.",
      "Adopt written trustee instructions requiring a pre-payment benefits-impact review, vendor information, and documentation for every future distribution.",
    ],
  },
  {
    n: 18,
    id: "chloe_family_cash",
    persona: "Chloe",
    title: "Parent deposits recurring cash support",
    group: "hybrid",
    programs: ["SSI", "MedicaidABD", "SNAP"],
    trigger: "Chloe's father deposits $1,200 each month into Chloe's checking account for general expenses.",
    consequence:
      "The deposits may be countable unearned income and, if retained, countable resources in later months.",
    classification: "Hybrid loss caused by uninformed family support.",
    steps: [
      "Stop future unrestricted cash deposits before the next payment date and explain how direct cash can reduce SSI and other means-tested benefits.",
      "Use a properly drafted third-party special needs trust or an eligible ABLE account for future support when appropriate.",
      "For expenses that may be paid directly, have the parent or trustee pay the vendor and evaluate SSI shelter consequences before paying rent, mortgage, or utilities.",
      "Use a written loan only when it is a genuine, enforceable loan with a real repayment obligation. Do not relabel past gifts as loans after the fact.",
      "Report existing deposits accurately and retain records showing the source, date, purpose, and disposition of each payment.",
      "Recalculate SSI, Medicaid, and SNAP separately because the same support payment may be treated differently by each program.",
    ],
  },
  {
    n: 19,
    id: "raymond_settlement",
    persona: "Raymond",
    title: "Settlement arrives just before month-end",
    group: "hybrid",
    programs: ["SSI", "MedicaidWaiver", "SNAP"],
    trigger:
      "Raymond is scheduled to receive a $60,000 settlement on the 28th of the month, and the proceeds would remain in his checking account on the first day of the next month.",
    consequence:
      "Non-excluded proceeds may be income when received and a countable resource thereafter, threatening SSI and resource-tested Medicaid. A trust or structured arrangement must be completed correctly before payment and may not erase every receipt-month issue.",
    classification: "Hybrid settlement and resource event requiring advance planning.",
    steps: [
      "Before signing the release or directing payment, have benefits and settlement counsel identify which portions are countable, excluded, subject to a lien, or reimbursable to a benefit program.",
      "Evaluate a properly established first-party special needs trust, pooled trust, structured settlement, or ABLE contribution where he qualifies. Complete the arrangement before funds are paid and confirm how the receipt month will be treated.",
      "If some money must be paid directly, prepare a documented same-month plan for lawful purchases of exempt resources, debts, medical needs, transportation, housing, or other permitted expenditures.",
      "Do not give away the settlement, transfer it below fair value, or place it in another person's account. Those actions can create additional eligibility and transfer problems.",
      "Preserve the settlement agreement, closing statement, lien payments, trust documents, bank records, and receipts. Report the transaction accurately to each affected program.",
      "If an agency counts excluded damages or ignores a valid preexisting arrangement, submit the governing documents and appeal the determination.",
    ],
  },
  {
    n: 20,
    id: "maya_reimbursements",
    persona: "Maya",
    title: "Reimbursements mistaken for income",
    group: "hybrid",
    programs: ["SSI", "MedicaidABD", "SNAP"],
    trigger:
      "Maya pays shared household expenses for roommates, who reimburse her through electronic transfers without clear memos, receipts, or a ledger.",
    consequence:
      "An eligibility worker may treat the deposits as income or available funds unless she proves that they are reimbursements rather than gifts, wages, or rent paid to her.",
    classification: "Hybrid evidentiary failure creating an apparent substantive violation.",
    steps: [
      "Stop using unmarked transfers. Require each reimbursement to identify the exact shared expense and month in the payment memo.",
      "Keep the original bill, proof that she paid it, the roommate's reimbursement, and a simple ledger matching each incoming payment to the corresponding expense.",
      "Use a separate household-expense account when practical so her own income and resources are not commingled with pass-through reimbursements.",
      "Obtain short signed statements from roommates explaining the cost-sharing arrangement and confirming that the payments are reimbursements, not gifts, wages, or rent to her.",
      "Before renewal, provide a written reconciliation of questioned deposits rather than waiting for the agency to infer that every electronic transfer is income.",
      "If benefits are reduced or closed, appeal and submit the bills, payment records, ledger, and statements showing that the deposits merely repaid expenses she advanced.",
    ],
  },
  {
    n: 21,
    id: "walter_snap_age_limit",
    persona: "Walter",
    title: "Older adult newly exposed to SNAP time limits",
    group: "policy",
    programs: ["SNAP"],
    trigger:
      "Walter is 60, has no dependents, and is not working. He assumes his age automatically exempts him from SNAP work and time-limit rules.",
    consequence:
      "Under the expanded late-2025 SNAP rules described in the market-strategy deck, he may be subject to work or activity requirements and could exhaust time-limited months unless he complies or qualifies for another exemption.",
    classification: "Structural policy-change risk.",
    slideReason: "The deck identifies expanded SNAP work requirements reaching older adults up to age 65.",
    steps: [
      "Verify the current effective rule, covered age range, certification period, and whether Pennsylvania has any applicable waiver or implementation exception.",
      "Screen for a medical-unfitness or disability exemption even if he does not receive disability benefits. Obtain a clinician's statement addressing his ability to work.",
      "Screen for other exemptions, including qualifying caregiving, pregnancy, participation in another recognized program, or another exemption in current guidance.",
      "If no exemption applies, create a documented plan for the required paid work, self-employment, approved training, community service, or permitted combination of activities.",
      "Submit proof each required period and retain time sheets, employer letters, program attendance records, and submission confirmations.",
      "Appeal any termination that applies the wrong age, ignores a waiver or exemption, or counts qualifying activity incorrectly; reapply promptly when compliance or exemption status is established.",
    ],
  },
  {
    n: 22,
    id: "carlos_caregiver_exemption",
    persona: "Carlos",
    title: "Parent of a 15-year-old loses an assumed caregiver exemption",
    group: "policy",
    programs: ["SNAP", "MedicaidMAGI"],
    trigger:
      "Carlos is unemployed and caring for his 15-year-old child. He assumes that being a parent of any minor child automatically protects him from the expanded SNAP work rules.",
    consequence:
      "Under the policy description in the deck, parents or caregivers of children age 14 and older may be newly exposed to SNAP work requirements unless another exemption or good-cause basis applies.",
    classification: "Structural policy-change and exemption-screening risk.",
    slideReason: "The deck states that expanded SNAP rules reach parents or caregivers of children age 14 and older.",
    steps: [
      "Verify the final Pennsylvania rule, effective date, and the exact child-age cutoff before concluding that he is subject to the requirement.",
      "Screen for another exemption, including disability or medical unfitness, caregiving for an incapacitated person, pregnancy, or another recognized status.",
      "If childcare, school schedules, transportation, or the child's special needs prevent compliance, document the barrier and determine whether it supports good cause or another exemption.",
      "If no exemption applies, enroll in paid work, approved training, education, community service, or a permissible combination sufficient to meet the requirement.",
      "Keep the child's birth record, school schedule, childcare records, medical documentation, and all monthly activity proof in one case file.",
      "Appeal any sanction that uses the wrong child age or ignores an exemption or documented good cause.",
    ],
  },
  {
    n: 23,
    id: "deshawn_veteran_exemption",
    persona: "DeShawn",
    title: "Veteran relies on an exemption removed by new SNAP rules",
    group: "policy",
    programs: ["SNAP"],
    trigger:
      "DeShawn is an unemployed veteran who assumes veteran status alone continues to exempt him from SNAP work and time-limit requirements.",
    consequence:
      "The deck states that the former veteran exemption was eliminated. He may lose SNAP unless he meets the activity requirement or qualifies under a different exemption.",
    classification: "Structural policy-change risk.",
    slideReason: "Slides 9–13 identify elimination of the SNAP veteran exemption as a cause of benefit loss.",
    steps: [
      "Verify that the rule applies to this certification period and that no state waiver or transition protection covers him.",
      "Do not stop at veteran status. Screen separately for disability, medical unfitness, receipt of qualifying disability benefits, caregiving, or another exemption.",
      "Obtain VA medical records or a clinician's statement if physical or mental health conditions limit work, even if a formal VA disability rating is still pending.",
      "If no exemption applies, document qualifying work, training, volunteer service, or another permitted activity and submit proof for every reporting period.",
      "Ask the SNAP employment-and-training program for an assignment that accommodates health, transportation, and treatment schedule.",
      "Appeal any termination that ignores medical evidence, miscounts activity, or applies the rule before its effective date.",
    ],
  },
  {
    n: 24,
    id: "farah_immigrant_restriction",
    persona: "Farah",
    title: "Lawfully present immigrant affected by new eligibility restrictions",
    group: "policy",
    programs: ["MedicaidMAGI", "SNAP"],
    trigger:
      "Farah is lawfully present but receives a notice stating that her Medicaid or SNAP category will close under the October 2026 immigrant-eligibility restrictions described in the deck.",
    consequence:
      "Coverage or food assistance may end because of a policy-driven category restriction, or because the agency misclassifies her immigration status or documentation.",
    classification: "Structural policy change with a high risk of classification error.",
    slideReason: "The deck identifies October 2026 Medicaid and SNAP eligibility restrictions for many lawfully present immigrants.",
    steps: [
      "Obtain the actual adverse notice and identify the immigration category, statutory basis, effective date, and benefit program involved. Do not rely on a generic message.",
      "Submit current immigration documents, including any permanent-resident card, employment authorization, I-94, asylum or refugee documentation, or other status proof relevant to the case.",
      "Have qualified immigration and benefits counsel determine whether she falls within an exempt or protected category and whether the agency used the correct waiting-period or status rule.",
      "Screen immediately for emergency Medicaid, pregnancy-related coverage, CHIP for children, Marketplace subsidies, local health programs, and food resources that remain available.",
      "File any replacement application before the termination date so coverage can start without a gap if the original category cannot continue.",
      "Appeal a misclassification, premature effective date, or failure to recognize a protected immigration category, and request continued benefits within any shorter deadline stated on the notice.",
    ],
  },
  {
    n: 25,
    id: "howard_ssdi_medical_improvement",
    persona: "Howard",
    title: "SSDI ends after a medical-improvement review",
    group: "policy",
    programs: ["SSDI", "QMB"],
    trigger:
      "During a continuing disability review, SSA concludes that Howard's medical condition improved enough for him to work.",
    consequence:
      "SSDI cash may cease after the appeal period, and downstream programs may be recalculated. Medicare continuation and QMB eligibility require separate analysis.",
    classification: "Substantive medical-improvement determination.",
    slideReason: "The deck lists medical improvement as a principal SSDI termination reason.",
    steps: [
      "Respond to every continuing disability review form and examination request by the stated deadline. Ask for an extension or accommodation before the deadline if he cannot comply.",
      "Collect treatment records covering the entire review period, including objective testing, medication changes, failed treatments, hospitalizations, therapy, and side effects.",
      "Ask treating clinicians to explain why any apparent improvement does not restore sustained work capacity, including limits in attendance, pace, lifting, concentration, or reliability.",
      "Compare SSA's prior favorable medical findings with the current evidence and identify whether the agency applied the medical-improvement standard correctly.",
      "If SSA issues a cessation notice, appeal within the stated deadline and request continued payments within the shorter continuation period described in the notice.",
      "Protect health coverage separately: confirm Medicare continuation, recalculate QMB, and apply for another Medicaid category if loss of cash benefits changes medical-assistance status.",
    ],
  },
  {
    n: 26,
    id: "linda_ssi_cdr_cooperate",
    persona: "Linda",
    title: "SSI suspended for failure to cooperate with a medical review",
    group: "policy",
    programs: ["SSI", "MedicaidABD"],
    trigger:
      "Linda moves, misses SSA's continuing disability review forms and consultative examination notice, and does not respond.",
    consequence:
      "SSA may suspend or terminate SSI for failure to cooperate even though her disability has not improved. SSI-linked Medicaid may also be placed at risk.",
    classification: "Procedural review failure.",
    slideReason: "The deck identifies failure to cooperate with reviews as a recurring cause of SSI and SSDI loss.",
    steps: [
      "Update address and contact information with SSA and DHS immediately and request copies of every missed form, appointment notice, and suspension or termination notice.",
      "Return the disability-review forms promptly and sign the medical-release authorizations. Provide a complete provider list so SSA can obtain the evidence.",
      "Explain in writing why the review was missed, including cognitive limitations, hospitalization, homelessness, mail problems, or the need for an accommodation.",
      "Request a new consultative examination date and any needed transportation, interpreter, accessible-format, or representative assistance.",
      "If benefits have been suspended, ask what exact act will restore cooperation status and obtain confirmation when the case is reactivated.",
      "Appeal any cessation or termination by the stated deadline and request continued payments within any shorter continuation period available on the notice.",
    ],
  },
  {
    n: 27,
    id: "harold_ssdi_to_retirement",
    persona: "Harold",
    title: "SSDI converts to retirement and triggers a downstream closure",
    group: "policy",
    programs: ["SSDI", "QMB", "SNAP"],
    trigger:
      "Harold reaches full retirement age. SSA converts his SSDI to retirement benefits, and DHS treats the new benefit description as an additional source of income rather than a conversion of the existing payment.",
    consequence:
      "SSDI eligibility ends by life-course conversion, but the cash payment and Medicare generally continue. QMB or SNAP can be reduced incorrectly if the conversion is double-counted or treated as an unreported increase.",
    classification: "Life-course transition with administrative misclassification risk.",
    slideReason: "The deck identifies SSDI-to-retirement conversion as a recurring life-course termination reason.",
    steps: [
      "Obtain SSA's conversion notice showing the effective date, old benefit type, new benefit type, and monthly amount.",
      "Submit the notice to DHS and explain that the retirement payment replaces the SSDI payment rather than being added to it.",
      "Compare the DHS budget before and after conversion and correct any month in which both SSDI and retirement were counted.",
      "Confirm that Medicare remains active and that QMB is recalculated using the actual continuing income rather than the benefit label.",
      "Update SNAP with the conversion notice and verify that the household's Social Security income is counted once.",
      "Appeal any QMB, Medicaid, or SNAP closure based on duplicate counting or an incorrect effective month and request retroactive correction of premiums or benefits.",
    ],
  },
  {
    n: 28,
    id: "nicole_overtime_churn",
    persona: "Nicole",
    title: "Temporary overtime causes Medicaid and SNAP churn",
    group: "policy",
    programs: ["MedicaidMAGI", "SNAP"],
    trigger:
      "Nicole works heavy seasonal overtime for six weeks. The overtime then ends, but the agency continues using the unusually high pay level.",
    consequence:
      "Medicaid or SNAP may close for excess income even though her current income quickly returns below the limit, causing avoidable loss and later re-enrollment.",
    classification: "Temporary substantive fluctuation combined with administrative churn.",
    slideReason: "Slide 13 describes income and asset fluctuations that cause short-term loss followed by re-enrollment.",
    steps: [
      "Report the overtime promptly, but identify it as temporary and provide the expected end date rather than allowing the agency to project it indefinitely.",
      "Submit the final overtime pay stubs, the later regular pay stubs, and an employer letter confirming the normal schedule and the date overtime ended.",
      "For Medicaid, request a current-month prospective calculation using the income expected for the relevant month. For Marketplace coverage, use the separate projected annual-income method.",
      "For SNAP, request recalculation using the current certification-period rules and all allowable deductions once the overtime ends.",
      "If coverage closes, request reconsideration or appeal with the employer letter and new pay records; submit a new application immediately if reopening is unavailable.",
      "Arrange replacement coverage and medication continuity during any gap, and set an alert to re-screen eligibility as soon as the temporary income falls.",
    ],
  },
  {
    n: 29,
    id: "eleanor_medicare_dual",
    persona: "Eleanor",
    title: "Dual-eligible status disrupted because Medicare enrollment is not completed",
    group: "policy",
    programs: ["MedicaidABD", "MedicaidWaiver", "QMB"],
    trigger:
      "After the Medicare waiting period, Eleanor receives enrollment materials but does not complete Part B enrollment or provide proof of Medicare status to DHS.",
    consequence:
      "Her dual-eligible coordination, QMB assistance, or Medicaid case may be disrupted if the agency treats her as failing to pursue available third-party coverage.",
    classification: "Procedural failure to complete a life-course coverage transition.",
    slideReason: "The deck identifies unfulfilled Medicare eligibility as a leading procedural issue among dual-eligible beneficiaries.",
    steps: [
      "Confirm Medicare entitlement date, Parts A and B status, enrollment window, and whether she qualifies for a special enrollment period.",
      "Complete Medicare enrollment through SSA or CMS and retain the application receipt, Medicare number, and effective-date notice.",
      "Submit proof of enrollment or pending enrollment to DHS, the County Assistance Office, the CHC managed-care organization, and relevant providers.",
      "Apply for QMB or another Medicare Savings Program so Medicaid can pay eligible Medicare premiums and cost sharing.",
      "Verify that CHC, waiver, home-care, pharmacy, and transportation services remain authorized during the Medicare transition and that providers bill the correct payer first.",
      "Appeal any Medicaid or service closure that occurs before she had a reasonable opportunity to enroll or that ignores proof of completed Medicare enrollment.",
    ],
  },
  {
    n: 30,
    id: "avery_foster_youth_snap",
    persona: "Avery",
    title: "Former foster youth relies on a SNAP exemption that no longer applies",
    group: "policy",
    programs: ["SNAP"],
    trigger:
      "Avery is 23, recently aged out of foster care, and assumes former foster-youth status still exempts him from work and time-limit requirements.",
    consequence:
      "Under the late-2025 rule change described in the deck, the former foster-youth exemption may no longer protect him. SNAP can end unless he complies or qualifies under another exemption.",
    classification: "Structural policy-change risk.",
    slideReason: "The deck states that the former foster-youth SNAP exemption was eliminated.",
    steps: [
      "Verify the current Pennsylvania rule, his age, the effective date, and whether any transition protection or state waiver applies.",
      "Screen for another exemption, including disability or medical unfitness, pregnancy, qualifying caregiving, student status where recognized, or participation in another qualifying program.",
      "Obtain medical or behavioral-health evidence if trauma, disability, or treatment limits his ability to work, even if he has not been formally approved for disability benefits.",
      "If no exemption applies, enroll in paid work, approved training, education, community service, or another permitted activity sufficient to meet the requirement.",
      "Use an authorized representative, stable mailing address, text reminders, and a document folder so unstable housing or frequent moves do not cause a separate procedural loss.",
      "Appeal any termination that ignores an exemption, miscounts qualifying activity, or applies the new rule before its effective date.",
    ],
  },
];

export const PERSONA_GROUP_LABEL: Record<LossPersonaGroup, string> = {
  procedural: "Procedural and administrative",
  substantive: "Substantive eligibility",
  hybrid: "Hybrid and trap cases",
  policy: "Policy, life-course, and churn",
};

export function personaById(id: string): EligibilityLossPersona | undefined {
  return ELIGIBILITY_LOSS_PERSONAS.find((s) => s.id === id);
}
