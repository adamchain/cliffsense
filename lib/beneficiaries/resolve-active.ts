export function resolveActiveBeneficiaryId(
  requestedId: string | null | undefined,
  accessibleIds: string[],
  primaryId: string | null,
): string | null {
  if (requestedId && accessibleIds.includes(requestedId)) return requestedId;
  if (primaryId && accessibleIds.includes(primaryId)) return primaryId;
  return accessibleIds[0] ?? null;
}
