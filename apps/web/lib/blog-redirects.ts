/**
 * Retired blog slugs and where they now point. Served as permanent redirects from next.config.ts
 * (so they never render) and also checked by the blog route as a fallback.
 * Kept in its own dependency-free module so next.config.ts can import it.
 */
export const BLOG_REDIRECTS: Record<string, string> = {
  // Competed with the comparison pages.
  "privnote-alternative-for-one-time-secrets": "/vs/privnote",
  "envshare-vs-protectedshare": "/vs/envshare",
  "protectedtext-alternative-for-modern-teams": "/vs/protectedtext",
  // Off-topic.
  "how-secure-notes-improve-seo-for-a-product-site": "/blog",
  // Burn-after-read / self-destructing cluster.
  "burn-after-read-secrets-explained": "/blog/self-destructing-messages-explained",
  "self-destructing-secret-links-best-practices": "/blog/self-destructing-messages-explained",
  "how-to-choose-read-limits-and-expirations": "/blog/self-destructing-messages-explained",
  // Encrypted notepad cluster.
  "offline-first-encrypted-notepad-guide": "/blog/best-free-encrypted-notepad-online",
  "how-to-protect-personal-journal-entries": "/blog/best-free-encrypted-notepad-online",
  // No-signup / private note cluster.
  "secure-note-sharing-without-signup": "/blog/what-to-look-for-in-a-private-note-app",
  "password-protected-notes-online-free": "/blog/what-to-look-for-in-a-private-note-app",
  "zero-tracking-privacy-tools-for-developers": "/blog/what-to-look-for-in-a-private-note-app",
  // Zero-knowledge explainers.
  "why-zero-knowledge-sharing-builds-trust": "/blog/how-zero-knowledge-encrypted-notes-work",
  // Team and API key habits.
  "secure-sharing-thresholds-for-small-teams": "/blog/secrets-management-basics-for-startups",
  "api-key-security-best-practices-for-small-teams": "/blog/how-to-send-api-keys-safely",
  // Channel splitting.
  "secure-password-sharing-across-channels": "/blog/is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
};
