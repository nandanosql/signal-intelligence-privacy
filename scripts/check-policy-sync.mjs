#!/usr/bin/env node
// Checks that every permission and host in the extension's manifest.json is
// mentioned in the privacy policy (index.html).
//
// Usage:
//   node scripts/check-policy-sync.mjs <path/to/manifest.json> [path/to/index.html]
//
// Exit code 0 when the policy covers everything, 1 when something is missing,
// 2 on a usage or read error. No dependencies.

import { readFileSync } from "node:fs";

const [manifestPath, policyPath = "index.html"] = process.argv.slice(2);

if (!manifestPath) {
  console.error("usage: check-policy-sync.mjs <manifest.json> [index.html]");
  process.exit(2);
}

let manifest, policy;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  policy = readFileSync(policyPath, "utf8");
} catch (err) {
  console.error(`error: ${err.message}`);
  process.exit(2);
}

// Strip tags and collapse whitespace so matches work across markup.
const text = policy
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/\s+/g, " ")
  .toLowerCase();

// Permissions that need no disclosure because they expose no user data.
const SILENT_PERMISSIONS = new Set(["offscreen", "sidePanel", "unlimitedStorage"]);

// Match patterns such as "*://*.flipkart.com/*" or "https://www.googleapis.com/*".
function hostOf(pattern) {
  if (pattern === "<all_urls>") return "<all_urls>";
  const m = /^[a-z*]+:\/\/([^/]+)/i.exec(pattern);
  return m ? m[1].toLowerCase() : pattern;
}

// "*.flipkart.com" is covered if "flipkart.com" appears anywhere in the policy.
function hostMentioned(host) {
  // "https://*/*" (any https site, used for custom feeds) and <all_urls> need a
  // sentence about arbitrary sites rather than a hostname.
  if (host === "*" || host === "<all_urls>") {
    return /any https (site|feed)|all websites|every website|any website/.test(text);
  }
  const bare = host.replace(/^\*\./, "");
  return text.includes(bare);
}

const permissions = [
  ...(manifest.permissions ?? []),
  ...(manifest.optional_permissions ?? []),
].filter((p) => !SILENT_PERMISSIONS.has(p));

const hosts = [
  ...(manifest.host_permissions ?? []),
  ...(manifest.optional_host_permissions ?? []),
  ...(manifest.content_scripts ?? []).flatMap((cs) => cs.matches ?? []),
].map(hostOf);

// Permissions must appear as code, e.g. <code>alarms</code>, so that an
// ordinary word such as "tabs" in prose does not count as a disclosure.
const codeTerms = new Set(
  [...policy.matchAll(/<code>([^<]+)<\/code>/gi)].map((m) => m[1].trim().toLowerCase()),
);
const missingPermissions = [...new Set(permissions)].filter(
  (p) => !codeTerms.has(p.toLowerCase()),
);
const missingHosts = [...new Set(hosts)].filter((h) => !hostMentioned(h));

if (missingPermissions.length === 0 && missingHosts.length === 0) {
  console.log(
    `ok: ${permissions.length} permission(s) and ${hosts.length} host(s) from ${manifestPath} are covered by ${policyPath}`,
  );
  process.exit(0);
}

if (missingPermissions.length) {
  console.error("Permissions in the manifest that the policy does not mention:");
  for (const p of missingPermissions) console.error(`  - ${p}`);
}
if (missingHosts.length) {
  console.error("Hosts in the manifest that the policy does not mention:");
  for (const h of missingHosts) console.error(`  - ${h}`);
}
console.error(`\nUpdate sections 3 and 4 of ${policyPath} and bump the effective date.`);
process.exit(1);
