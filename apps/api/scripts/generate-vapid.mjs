#!/usr/bin/env node
// Prints a fresh VAPID key pair for read notifications (Web Push), in the format the Worker expects:
//   VAPID_PUBLIC_KEY  = uncompressed P-256 public key (65 bytes), base64url
//   VAPID_PRIVATE_KEY = the private scalar (JWK "d"), base64url
// The key lines go to stdout; setup hints go to stderr. Nothing is written to disk.
import { webcrypto } from "node:crypto";

const { subtle } = webcrypto;
const pair = await subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
const publicKey = Buffer.from(await subtle.exportKey("raw", pair.publicKey)).toString("base64url");
const { d: privateKey } = await subtle.exportKey("jwk", pair.privateKey);

console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.error(`
Production setup (keep the private key secret; never commit it):
  cd apps/api
  npx wrangler secret put VAPID_PRIVATE_KEY   # paste the private key
  npx wrangler secret put VAPID_PUBLIC_KEY    # paste the public key
  npx wrangler secret put VAPID_SUBJECT       # e.g. mailto:admin@protectedshare.me
Web app (Vercel, or any host that builds apps/web):
  NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}   # same public key, then redeploy
Local development: put the three VAPID_* lines in apps/api/.dev.vars and
NEXT_PUBLIC_VAPID_PUBLIC_KEY in apps/web/.env.development.local (both git-ignored).
Rotating keys silently ends existing subscriptions; browsers subscribe again the next time someone turns notifications on.`);
