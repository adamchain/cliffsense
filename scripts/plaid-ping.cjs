#!/usr/bin/env node
/**
 * Verifies PLAID_CLIENT_ID / PLAID_SECRET / PLAID_ENV against Plaid's sandbox (or production).
 * Usage: npm run plaid:ping
 * Loads .env then .env.local from the project root (same pattern as Next.js).
 */
const fs = require("fs");
const path = require("path");
const { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } = require("plaid");

const root = path.join(__dirname, "..");

function loadEnvFile(rel) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const clientId = process.env.PLAID_CLIENT_ID;
const secret = process.env.PLAID_SECRET;
const env = (process.env.PLAID_ENV ?? "sandbox").toLowerCase();

if (!clientId || !secret) {
  console.error("Missing PLAID_CLIENT_ID or PLAID_SECRET in .env / .env.local");
  process.exit(1);
}

const basePath =
  env === "production"
    ? PlaidEnvironments.production
    : env === "development"
      ? PlaidEnvironments.development
      : PlaidEnvironments.sandbox;

console.log("PLAID_ENV:", env);
console.log("basePath:", basePath);
console.log("PLAID_CLIENT_ID:", String(clientId).slice(0, 8) + "…");

const api = new PlaidApi(
  new Configuration({
    basePath,
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": clientId,
        "PLAID-SECRET": secret,
      },
    },
  }),
);

(async () => {
  try {
    const resp = await api.linkTokenCreate({
      user: { client_user_id: "cli-plaid-ping" },
      client_name: "CliffSense",
      language: "en",
      country_codes: [CountryCode.Us],
      products: [Products.Transactions],
    });
    const token = resp.data?.link_token;
    if (!token) {
      console.error("Unexpected response: no link_token in resp.data");
      console.error(Object.keys(resp.data || {}));
      process.exit(1);
    }
    console.log("OK — link_token prefix:", String(token).slice(0, 24) + "…");
    console.log("expires:", resp.data?.expiration);
    process.exit(0);
  } catch (e) {
    const status = e.response?.status;
    const body = e.response?.data;
    console.error("Plaid linkTokenCreate failed", status, body || e.message);
    process.exit(1);
  }
})();
