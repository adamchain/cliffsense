import { connectDB } from "@/lib/db/mongodb";
import ActivityLog from "@/lib/db/models/ActivityLog";
import type { Types } from "mongoose";

export type LogActivityInput = {
  userId: Types.ObjectId | string;
  beneficiaryId?: Types.ObjectId | string | null;
  sessionId?: string;
  category:
    | "auth"
    | "account"
    | "beneficiary"
    | "bank"
    | "transaction"
    | "threshold"
    | "alert"
    | "vault"
    | "advisor"
    | "export"
    | "admin"
    | "recurring";
  action: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  severity?: "info" | "warning" | "security";
};

export async function logActivity(input: LogActivityInput): Promise<void> {
  try {
    await connectDB();
    await ActivityLog.create({
      userId: input.userId,
      beneficiaryId: input.beneficiaryId ?? null,
      sessionId: input.sessionId ?? "",
      category: input.category,
      action: input.action,
      resourceType: input.resourceType ?? "",
      resourceId: input.resourceId ?? "",
      details: input.details ?? {},
      ipAddress: input.ipAddress ?? "",
      userAgent: input.userAgent ?? "",
      severity: input.severity ?? "info",
    });
  } catch (e) {
    console.error("logActivity failed", e);
  }
}
