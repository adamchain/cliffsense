import type { AdminAuditAction } from "@/lib/db/models/AdminAuditLog";

/** Human-readable labels for admin audit actions, shared across admin views. */
export const ADMIN_AUDIT_LABEL: Record<AdminAuditAction, string> = {
  grant_admin: "Granted admin",
  revoke_admin: "Revoked admin",
  disable_user: "Disabled account",
  enable_user: "Enabled account",
  start_impersonation: "Started impersonation",
  stop_impersonation: "Stopped impersonation",
  create_threshold: "Created threshold",
  update_threshold: "Edited threshold",
  delete_threshold: "Deleted threshold",
  reset_threshold: "Reset threshold to default",
  revoke_invite: "Revoked invite",
  approve_application: "Approved application",
  reject_application: "Rejected application",
  request_application_info: "Requested more info",
  verify_application_document: "Verified document",
  reject_application_document: "Rejected document",
};

/** Tailwind classes tinting an action badge by severity of the action. */
export function auditActionTone(action: AdminAuditAction): string {
  switch (action) {
    case "revoke_admin":
    case "disable_user":
    case "delete_threshold":
    case "revoke_invite":
    case "reject_application":
    case "reject_application_document":
      return "bg-[var(--color-cs-danger-bg)] text-[var(--color-cs-danger)]";
    case "grant_admin":
    case "enable_user":
    case "approve_application":
    case "verify_application_document":
      return "bg-[var(--color-cs-success-bg)] text-[var(--color-cs-success)]";
    case "start_impersonation":
    case "stop_impersonation":
    case "request_application_info":
      return "bg-[var(--color-cs-info-bg)] text-[var(--color-cs-info)]";
    default:
      return "bg-[var(--color-cs-surface)] text-[var(--color-cs-text-secondary)]";
  }
}
