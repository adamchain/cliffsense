/** Private-beta invite code. Kept in one place so sign-in and sign-up stay in sync. */
export const BETA_ACCESS_CODE = "access0108";

/** sessionStorage flag set after a correct code so /auth/signup cannot be opened cold. */
export const BETA_SESSION_KEY = "mbpa:beta-ok";

export function isValidBetaAccessCode(value: string): boolean {
  return value.trim() === BETA_ACCESS_CODE;
}
