import { KUNAL_SIYAG, type Author } from "./authors";

export type BlogLink = { href: string; label: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: string;
  /** YYYY-MM-DD. */
  publishedAt: string;
  /** YYYY-MM-DD. Bump only when the content changes materially. */
  updatedAt: string;
  /** Derived from the word count. */
  readingTime: string;
  author: Author;
  /** Hand-picked slugs shown first under "Related guides". */
  related?: string[];
  /** Buttons for the "Put it into practice" strip. Defaults to a secure note and EnvShare. */
  practice?: { primary: BlogLink; secondary?: BlogLink };
  content: string;
};

type BlogPostSource = Omit<BlogPost, "readingTime" | "author"> & { author?: Author };

/**
 * Retired posts, merged into a stronger page. The blog route answers these with a 308; they stay
 * out of BLOG_POSTS, so the listing and the sitemap drop them.
 */
export { BLOG_REDIRECTS } from "./blog-redirects";
import { BLOG_REDIRECTS } from "./blog-redirects";

const POSTS: BlogPostSource[] = [
  {
    slug: "how-zero-knowledge-encrypted-notes-work",
    title: "How Zero-Knowledge Encrypted Notes Work",
    description:
      "What happens between typing a note and someone reading it: where the key is made, what the server stores, and the limits worth knowing.",
    category: "Security Basics",
    publishedAt: "2026-01-08",
    updatedAt: "2026-10-11",
    related: [
      "client-side-encryption-vs-server-side-encryption",
      "why-aes-256-gcm-matters-for-browser-encryption",
      "what-to-look-for-in-a-private-note-app",
    ],
    content: `## What zero-knowledge means here

"Zero-knowledge" is used loosely in marketing, and it has nothing to do with the zero-knowledge proofs of cryptography research. For a note-sharing tool it should mean one specific thing: the service stores and delivers your note without ever holding what it would need to read it. Your browser encrypts the note before it's uploaded, and the key that decrypts it never reaches the server.

That doesn't mean the service knows nothing. It still sees that a note exists, how large the ciphertext is, when it was created and opened, and the network details of each request. What it can't see is the content.

## The life of an encrypted note

Here is what happens in ProtectedShare's [Secure Notes](/notes) in the default link-key mode:

1. **Your browser makes a key.** It draws 32 random bytes from the Web Crypto API. Nothing about the key comes from the server.
2. **The note is encrypted locally.** The browser derives an AES-256-GCM key from those bytes with HKDF and encrypts the text. A second value, derived the same way with a different label, becomes an access token.
3. **Only ciphertext is uploaded.** The server receives the encrypted note, a random salt and IV, the expiry and burn setting, and a SHA-256 hash of the access token. It never receives the key or the text.
4. **The key goes into the link, after the #.** The link looks like \`https://protectedshare.me/notes/…#k=…\`. Browsers don't send the part after \`#\` to the server when they request a page ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)), so the key reaches the recipient through whatever channel you use, not through the service.
5. **The recipient's browser reverses the process.** It reads the key from the link, derives the same access token, and asks for the ciphertext. The server compares the token with the stored hash before releasing anything, and the browser decrypts locally.
6. **The row is deleted.** With burn after reading on, the note is deleted from the database in the same step that releases it. Otherwise it's deleted at expiry.

If you add a password, instead of or as well as the link key, the browser first stretches the password with PBKDF2-SHA256 at 600,000 iterations, so the password doesn't leave your device either. The full construction is on the [security page](/security), and the code is open source.

## What this protects you from

- **A breach of the database or server.** An attacker gets ciphertext and hashes, not notes.
- **The operator reading notes.** There's no key on the server to read them with.
- **Link previews burning a note.** Chat apps that unfurl links fetch the page without the part after \`#\`, so they can't produce the access token, and the note page waits for a click.

## What it doesn't protect you from

- **Anyone who has the full link.** The key is in the link, so the link is the secret. If the channel you send it through worries you, add a password and send that another way.
- **A compromised device** on either end, or a malicious browser extension that can read the page.
- **Changed code.** A web app delivers its JavaScript on every visit. If that code were tampered with, it could read what you type before encrypting it. Open source and the option to [self-host](/self-host) are the mitigations.
- **The recipient keeping a copy.** Once the note is on their screen, they can copy it.
- **Metadata.** Sizes, timing and IP addresses are visible to the service and its hosting providers.

## Why this model is easier to trust

Most services ask you to trust their staff, their policies and their infrastructure with your data. A zero-knowledge design shrinks that request. Instead of "we promise not to look," the claim becomes "we can't look, and here's the code that shows why."

That's a claim you can check. Read the source, watch the network requests in your browser's developer tools while you create a note, or run your own copy. A service that also tells you what its server sees, and what it can't defend against, gives you what you need to decide whether it fits the secret you're about to send.`,
  },
  {
    slug: "how-to-share-env-files-securely",
    title: "How to Share .env Files Securely",
    description:
      "A developer routine for .env files: trim them, keep them out of git, send them through an expiring encrypted link, and rotate anything that leaks.",
    category: "Developer Security",
    publishedAt: "2026-01-22",
    updatedAt: "2026-10-11",
    related: [
      "how-to-send-api-keys-safely",
      "how-to-share-database-credentials-safely",
      "secrets-management-basics-for-startups",
    ],
    practice: {
      primary: { href: "/secrets", label: "Share a .env" },
      secondary: { href: "/request", label: "Ask for one" },
    },
    content: `A \`.env\` file is where an application keeps the values that change between environments: database URLs, API keys, webhook signing secrets, OAuth client secrets. That's convenient for running code, and it makes the file one of the most sensitive things a developer handles. When a teammate needs it, the file usually travels by chat or email, and every copy left behind is a credential someone has to remember to clean up.

This guide covers what to do before you send a \`.env\` file, how to send it, and what to do afterwards.

## Why .env files need more care than other config

[The Twelve-Factor App](https://12factor.net/config) popularised keeping config in environment variables, and it offers a useful test: could the codebase be made open source at any moment without compromising any credentials? The \`.env\` file is where those credentials end up, which is why the [dotenv README](https://github.com/motdotla/dotenv) answers "Should I commit my .env file?" with a plain "No."

The same reasoning applies to sending it. A \`.env\` pasted into team chat is visible to everyone in the channel, stays in the history, and can turn up in exports: on Slack, workspace owners and admins can [export messages](https://slack.com/help/articles/201658943-Export-your-workspace-data) from public channels, and on some plans from private channels and DMs too. An email attachment sits in both mailboxes and their backups. Stripe's [API key documentation](https://docs.stripe.com/keys) is direct about it: don't share keys over email, chat or other unencrypted channels.

## Before you send: shrink the file

The safest secret is the one you never send. Go through the file line by line first.

1. **Remove what they don't need.** A frontend developer rarely needs the payment provider's secret key or the production database URL. Send the three variables they asked for, not the forty in your file.
2. **Prefer development and sandbox values.** Many providers issue separate test credentials. Stripe's sandbox keys (\`sk_test_\`, \`rk_test_\`) can't move real money, and someone building locally rarely needs live keys.
3. **Give people their own keys where the provider allows it.** Google Cloud's [API key guidance](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices) is to isolate keys and give each team member their own key for each application. A personal key can be revoked without breaking anyone else.
4. **Keep one file per environment.** dotenv recommends one \`.env\` file per environment rather than files that inherit from each other, which also makes it obvious which file you're about to send.
5. **Commit a \`.env.example\`** with the variable names and no values, so the next person knows what exists without anyone sending a file.

## Keep it out of git while you're at it

Plenty of \`.env\` leaks happen through commits rather than messages. A few lines in \`.gitignore\` close that door:

\`\`\`gitignore
.env
.env.*
!.env.example
\`\`\`

The \`!\` prefix re-includes a file that an earlier pattern excluded, which keeps the example file tracked ([gitignore documentation](https://git-scm.com/docs/gitignore)). \`.gitignore\` doesn't affect files Git already tracks, so if \`.env\` was committed before, stop tracking it with \`git rm --cached .env\`.

Then add secret detection before code leaves your machine. The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) recommends enabling secrets detection at the developer level, for example in a pre-commit hook. On GitHub, [push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection) blocks pushes that contain recognised secrets before they reach the repository.

If a \`.env\` file did reach a repository, rotate the secrets first. GitHub's guide to [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) makes revoking or rotating the secret the first step, and notes that rewriting history can't remove copies already in other people's clones.

## How to send a .env file with an expiring encrypted link

When someone genuinely needs the values, send them through a link that's encrypted in your browser and deletes itself. With ProtectedShare's [EnvShare](/secrets):

1. **Paste the trimmed file.** It's encrypted in your browser with AES-256-GCM before anything is uploaded.
2. **Set the number of reads.** One read if one person will open it once; two or three if they'll open it on a laptop and then on a server. The limit can be anything from 1 to 100, so pick the smallest that works.
3. **Set a short expiry.** One hour if they're waiting for it, one day if they aren't. The longest allowed is 30 days.
4. **Optionally require a password,** and send that password through a different channel, such as a phone call. A leaked link alone then opens nothing.
5. **Send the link** in your usual chat. The decryption key sits after the \`#\` in the link, and browsers don't send that part to the server ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)).
6. **Check it was opened.** [My links](/links), in the browser that created the share, shows whether the link was opened or has expired, and lets you revoke one that hasn't been opened yet.

After the last allowed read, or at expiry, the encrypted row is deleted. What stays in the chat is a link that no longer opens anything.

If you also need to send certificates or other binary files, use an [encrypted file drop](/files) instead (up to 25 MB, with a download limit). If you're the one who needs a \`.env\` from someone else, send them a [secret request](/request): whatever they paste is encrypted in their browser to a key only your inbox link holds.

## Common mistakes

- **Sending the whole production file** when the person needed one value.
- **Pasting it into a ticket, wiki page or pull request comment.** Those are built to be searched and kept.
- **Splitting the file across two messages in the same chat.** Anyone with access to the chat has both halves.
- **Taking a screenshot.** Screenshots end up in photo libraries and their cloud backups.
- **Leaving it in the recipient's Downloads folder.** Ask them to move the values into their local config or password manager and delete the file.

## Which method fits which situation

| Situation | What to do |
| --- | --- |
| New developer setting up locally | Personal dev or sandbox keys, and a one-read link for anything shared |
| Teammate needs one production value during an incident | One-read link with a one-hour expiry; rotate afterwards if it was a shared key |
| Contractor joining for a few weeks | Their own scoped keys where possible, a link for the rest, rotation at the end |
| CI/CD or a server needs the values | The platform's secret store, never a link |
| Someone needs to send you their \`.env\` | A [secret request](/request) |

## When not to use a link at all

A one-time link is for the exceptions. If your team passes \`.env\` files around every week, the process is the problem. Move runtime secrets into the secrets manager your platform provides, or keep them encrypted in the repository with tooling built for it; OWASP notes that secrets can be stored encrypted in git, with decryption limited to the consumer that needs them. Onboarding then means granting access, not sending files. [Secrets management basics for startups](/blog/secrets-management-basics-for-startups) describes a lightweight way to get there.

## After sharing: rotate on triggers

You don't need to rotate every value each time a file is shared, but some events should trigger it:

- someone with access leaves the project or changes role, which Stripe lists as a reason to rotate keys;
- the link shows as opened before the recipient says they opened it;
- the file, or any value from it, was pasted somewhere public or committed;
- a contractor engagement ends.

When you rotate, create the new value, deploy it, confirm the old one is no longer in use, then revoke it. Some providers make this smoother with an overlap period: Stripe keeps a rotated key working for up to 7 days. For new random values such as webhook or session secrets, use a [secret key generator](/tools/secret-key-generator).

## Sources

- The Twelve-Factor App, [Config](https://12factor.net/config)
- dotenv, [README](https://github.com/motdotla/dotenv)
- Git, [gitignore documentation](https://git-scm.com/docs/gitignore)
- OWASP, [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- GitHub Docs, [Push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection) and [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- Stripe Docs, [API keys](https://docs.stripe.com/keys)
- Google Cloud, [Best practices for managing API keys](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices)
- Slack Help Center, [Export your workspace data](https://slack.com/help/articles/201658943-Export-your-workspace-data)
- MDN, [URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)`,
  },
  {
    slug: "why-aes-256-gcm-matters-for-browser-encryption",
    title: "Why AES-256-GCM Matters for Browser Encryption",
    description:
      "Why authenticated encryption matters for secret links, how AES-256-GCM is used in the browser, and the details that matter more than key length.",
    category: "Cryptography",
    publishedAt: "2026-02-19",
    updatedAt: "2026-10-11",
    related: [
      "how-zero-knowledge-encrypted-notes-work",
      "client-side-encryption-vs-server-side-encryption",
      "what-to-look-for-in-a-private-note-app",
    ],
    content: `## Key length is the least interesting part

AES-256 is the label people remember, but a 256-bit key is rarely what fails. What matters is the mode of operation, how the key is derived, and whether random values are used correctly. AES-256-GCM is popular because the mode does two jobs at once.

## Confidentiality plus integrity

GCM is an authenticated mode. NIST's specification, [SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final), describes it as an algorithm for "authenticated encryption with associated data." Every ciphertext carries a 16-byte authentication tag, and decryption checks it. If a single byte of the ciphertext, the IV or the associated data has changed, decryption fails outright instead of returning altered text. MDN's [Web Crypto documentation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt) strongly recommends authenticated encryption for exactly this reason.

For a secret-sharing tool that matters: a tampered note should refuse to open, not open with someone else's edits.

## How it's used in the browser

Browsers ship AES-GCM in the Web Crypto API, so there's no need for a hand-written cipher in JavaScript. In ProtectedShare's current scheme:

- **A fresh 12-byte random IV for every encryption.** GCM's security depends on never reusing an IV with the same key; MDN's [AesGcmParams](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams) page puts it plainly: never reuse an IV with the same key.
- **Keys derived with HKDF.** The AES key comes from HKDF-SHA256 ([RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)) over either 32 random bytes carried in the link, a password stretched with PBKDF2-SHA256 at 600,000 iterations, or both. 600,000 is the iteration count the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) recommends for PBKDF2-HMAC-SHA256.
- **The sharing mode is bound in as associated data,** so a note sealed to require both the link key and a password can't be relabelled to skip the password.
- **File chunks carry their position.** In a file drop, each chunk is encrypted separately with its index and the total count as associated data, so chunks can't be reordered, swapped or dropped without decryption failing.
- **Keys are non-extractable CryptoKeys,** so page scripts can use them but can't read the raw key material back out.

## What AES-256-GCM can't fix

- **Weak passwords.** When the key comes from a password, the cipher is only as strong as the password. Stretching makes each guess expensive; it doesn't make "summer2026" safe. Use the random link key, or a long password from a [password generator](/tools/password-generator).
- **Size leaks.** GCM doesn't pad, so the ciphertext is the length of the plaintext plus the tag. A server can tell a short password from a long \`.env\` file.
- **Key handling.** Whoever has the key can decrypt. Where the key travels, and who can see it on the way, matters more than which cipher protects the data.

The exact construction, including what the server stores, is on the [security page](/security).

## Sources

- NIST, [SP 800-38D: Galois/Counter Mode (GCM) and GMAC](https://csrc.nist.gov/pubs/sp/800/38/d/final)
- MDN, [SubtleCrypto.encrypt()](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt) and [AesGcmParams](https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams)
- IETF, [RFC 5869: HKDF](https://www.rfc-editor.org/rfc/rfc5869)
- OWASP, [Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)`,
  },
  {
    slug: "client-side-encryption-vs-server-side-encryption",
    title: "Client-Side Encryption vs Server-Side Encryption",
    description:
      "Where encryption happens decides who can read your data. How in-transit, at-rest and client-side encryption differ, and when each one fits.",
    category: "Security Basics",
    publishedAt: "2026-02-26",
    updatedAt: "2026-10-11",
    related: [
      "how-zero-knowledge-encrypted-notes-work",
      "why-aes-256-gcm-matters-for-browser-encryption",
      "what-to-look-for-in-a-private-note-app",
    ],
    content: `## Three places encryption can happen

"Encrypted" on a product page can mean very different things. The useful question isn't whether data is encrypted, but who holds the key at each point.

- **In transit (TLS).** The connection between your browser and the server is encrypted. That stops people on the network from reading the traffic, but the server receives your data in readable form.
- **At rest (server-side).** The server encrypts data before writing it to disk or backups, with keys the service manages. That helps against stolen disks and some storage leaks, but the service can decrypt whenever its software needs to.
- **Client-side (end-to-end).** Your device encrypts the data before it leaves, with a key the service never receives. The server stores and forwards ciphertext it can't read.

## Side by side

| | TLS in transit | Server-side at rest | Client-side |
| --- | --- | --- | --- |
| Who holds the key | Your browser and the server, per connection | The service | You, and whoever you share it with |
| Can the service read the data? | Yes, once it arrives | Yes | No |
| Stops network snooping | Yes | Not on its own | Yes |
| Helps if the database leaks | No | Partly, if the keys are stored elsewhere | Yes: attackers get ciphertext |
| Server-side search, previews, recovery | Possible | Possible | Not without the key |

## The trade-offs of client-side encryption

Client-side encryption costs features. The server can't search your content, generate previews, scan it, or recover it if you lose the key. For a password manager or a note-sharing tool that's the point. For a team wiki it's often the wrong trade.

It also moves trust rather than removing it. In a web app, the code that does the encrypting is downloaded from the same service every time you visit. If that code were tampered with, it could leak your data before encrypting it. Open-source code and the option to self-host reduce that risk; they don't eliminate it. Native apps face the same question with every update, just less often.

## Choosing the right model

- **Use client-side encryption** when the service should act as a courier rather than a vault: passwords, API keys, \`.env\` files, private notes, files only one person should open. ProtectedShare works this way: notes, EnvShare secrets, file drops and chat messages are encrypted with AES-256-GCM in the browser, and the [security page](/security) lists what the server stores.
- **Server-side encryption is reasonable** when the service has to process the data (search, collaboration, analytics) and you already trust it with access.
- **TLS is the baseline** for everything. On its own, it says nothing about who can read the data after it arrives.

When a vendor says "encrypted," ask which of the three they mean, and who holds the key. [How zero-knowledge encrypted notes work](/blog/how-zero-knowledge-encrypted-notes-work) walks through the client-side flow step by step.`,
  },
  {
    slug: "how-to-send-api-keys-safely",
    title: "How to Send API Keys Safely",
    description:
      "Scope the key, send it through an expiring encrypted link, confirm it arrived, and rotate on the right triggers. A step-by-step guide with a decision table.",
    category: "Developer Security",
    publishedAt: "2026-03-05",
    updatedAt: "2026-10-11",
    related: [
      "how-to-share-env-files-securely",
      "how-to-share-database-credentials-safely",
      "secrets-management-basics-for-startups",
    ],
    practice: {
      primary: { href: "/secrets", label: "Share an API key" },
      secondary: { href: "/request", label: "Ask for a key" },
    },
    content: `An API key is a credential, not a message. Depending on the provider it can read customer data, spend money or change infrastructure, and most keys work from anywhere until someone revokes them. Sending one is a small security event: done well, it leaves nothing behind; done casually, it leaves a working key in a chat history for as long as the key lives.

This guide covers the whole handoff: making the key worth less, sending it, and cleaning up afterwards.

## The short version

1. Ask whether the person can get their own key instead.
2. If not, create a new key for this person and purpose, with the narrowest permissions the provider offers.
3. Send it through an encrypted link that expires after one read, not as text in chat or email.
4. Confirm it arrived, and let the link delete itself.
5. Revoke or rotate the key when the work ends, or straight away if anything looks wrong.

## Why chat and email are the wrong place

Providers say this plainly. Stripe's [API key documentation](https://docs.stripe.com/keys) lists "don't share keys over email, chat or other unencrypted channels" among its rules for protecting keys. The problem isn't only interception, it's retention. Chat history is searchable and synced to every member's devices, and workspace admins can [export it](https://slack.com/help/articles/201658943-Export-your-workspace-data). Email sits in two mailboxes and their backups. A key pasted into any of them stays usable for as long as the key is valid.

Places that feel private often aren't. A GitHub "secret" gist is unlisted, not private: GitHub's documentation on [creating gists](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists) says secret gists aren't private, and anyone who has or discovers the URL can see them. Tickets, wikis and pull request comments are designed to be kept and searched.

## Before you send: make the key worth less

The less a key can do, the less it matters where it ends up.

- **Give people their own keys.** Google Cloud's [best practices for API keys](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices) recommend isolating keys and giving each team member their own key for each application. A personal key can be revoked without breaking anyone else, and usage shows who did what.
- **Restrict permissions.** Stripe's restricted API keys (\`rk_…\`) let you choose exactly which resources a key can touch, and Stripe recommends them over unrestricted secret keys. Google Cloud keys can be limited to specific APIs and to specific apps, websites or IP addresses.
- **Use test or sandbox keys for development.** Someone building locally usually doesn't need a key that can touch production.
- **Prefer short-lived credentials where they exist.** AWS's [IAM best practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html) recommend that workloads use temporary credentials through IAM roles, and that people sign in through federation rather than with long-term access keys.
- **Set an expiry or a spending limit** if the provider supports one.

## How to send an API key, step by step

ProtectedShare's [EnvShare](/secrets) was built for exactly this:

1. **Paste the key with a little context,** for example \`STRIPE_KEY=rk_test_…\` and a line saying which environment it's for. The text is encrypted in your browser with AES-256-GCM before upload.
2. **Choose one read.** Choose two only if they'll genuinely open it in two places.
3. **Choose a short expiry:** an hour if they're online now, a day at most otherwise.
4. **For production keys, add a password** and send it another way: say it on a call, or use a different app from the one carrying the link.
5. **Send the link** through your normal channel. The decryption key travels after the \`#\`, which browsers don't send to servers ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)). The server stores ciphertext and deletes it after the last allowed read.
6. **Confirm and check.** Ask them to confirm the key works. [My links](/links), in the browser you created it from, shows whether the link was opened, and lets you revoke it if it wasn't.

There's a useful side effect. If someone else opens the link first, your recipient finds it already used, which tells you to revoke the key instead of leaving you with a silent leak.

If the direction is reversed and a client needs to give you their key, send them a [secret request](/request). What they paste is encrypted in their browser to a key that only your inbox link holds.

## What to put in the note with the key

A bare key is hard to manage later. Add a few lines of context inside the same encrypted note, so the recipient knows what they're holding and you know what to clean up:

- **Which service and environment** the key is for, and which account or project it belongs to.
- **What it can do,** such as "read-only," "restricted to payments" or "sandbox only."
- **When it will be revoked,** for example at the end of the contract.
- **Where it should live:** "Add it to the project's secret store, not to the repository."

Keep that context inside the note rather than in the chat message that carries the link. The less the visible message says about what's behind the link, the less use it is to anyone else who sees it.

## If you're the one receiving a key

- Open the link when you're ready to store the key, because it may only open once.
- Put the key straight into your password manager or the project's secret store, not a text file or a chat with yourself.
- Tell the sender if the link had already been used when you opened it. Someone else got there first, and the key needs revoking.
- If you'll need access for more than a few days, ask for a key of your own next time.

## Things that look safe but aren't

| Habit | Why it fails |
| --- | --- |
| Half the key in each of two messages | Same chat, same history: anyone with access has both halves |
| A password-protected zip with the password in the same email | One compromised mailbox reveals both |
| A "secret" gist or an unlisted paste | Anyone with the URL can read it |
| A screenshot of the provider's dashboard | Photos sync to cloud backups and are hard to track down |
| A key in a shared doc "for now" | Docs get copied, exported and forgotten |

## After the handoff: rotate on triggers

Rotation is what makes a leaked copy harmless. Revoke or rotate a key:

- **when someone with access leaves or changes role.** Both Stripe and AWS call this out;
- **immediately after a suspected exposure.** The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) says exposed keys should undergo immediate revocation, followed by a replacement and removal from code and logs;
- **when a contractor engagement or project ends;**
- **if the key was ever committed to git.** GitHub's guide to [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) says to revoke or rotate first, because rewriting history can't remove copies in existing clones.

Plan rotation so it doesn't break production: create the new key, deploy it, watch the old key's traffic drop to zero, then revoke it. Stripe keeps a rotated key working for up to 7 days to allow exactly this, and Google Cloud recommends rotating keys periodically and deleting keys you no longer use.

## Which method fits which situation

| Situation | What to do |
| --- | --- |
| Teammate needs access to a provider | Invite them to the account so they can create their own key |
| Contractor needs a key for two weeks | A new restricted key, a one-read link, revocation at the end |
| A service or CI pipeline needs the key | Your platform's secret store, never a human handoff |
| Client needs to give you their key | A [secret request](/request) |
| A key was pasted in a public channel | Revoke it now, then work out how it happened |

## When not to use a one-time link

- **Machine-to-machine delivery.** Servers and pipelines should read keys from a secrets manager, not from a link a person opened.
- **Ongoing shared access.** If several people need the same key for months, keep it in a shared vault in your password manager, or better, give each person their own key.
- **Owner or root credentials.** Don't share them. Create a scoped key instead.
- **When you need an audit trail of who read a secret.** ProtectedShare can tell you that a link was opened, not who opened it.

For webhook signing secrets and other random values you generate yourself, use a [secret key generator](/tools/secret-key-generator). To look inside a token you've been sent, there's a [JWT decoder](/tools/jwt-decoder). Sharing a whole environment file? See [how to share .env files securely](/blog/how-to-share-env-files-securely).

## Sources

- Stripe Docs, [API keys](https://docs.stripe.com/keys)
- Google Cloud, [Best practices for managing API keys](https://docs.cloud.google.com/docs/authentication/api-keys-best-practices)
- AWS, [Security best practices in IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- OWASP, [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- GitHub Docs, [Creating gists](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists) and [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- Slack Help Center, [Export your workspace data](https://slack.com/help/articles/201658943-Export-your-workspace-data)
- MDN, [URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)`,
  },
  {
    slug: "how-freelancers-can-share-secrets-safely",
    title: "How Freelancers Can Share Secrets Safely",
    description:
      "A repeatable way for freelancers and agencies to exchange credentials with clients: get them safely, send them safely, and clean up when the project ends.",
    category: "Workflows",
    publishedAt: "2026-04-16",
    updatedAt: "2026-10-11",
    related: [
      "how-to-share-database-credentials-safely",
      "how-to-send-api-keys-safely",
      "password-manager-vs-one-time-secret-link",
    ],
    practice: {
      primary: { href: "/request", label: "Ask a client for a secret" },
      secondary: { href: "/notes", label: "New secure note" },
    },
    content: `## Freelancers need a repeatable process

Freelancers and small agencies exchange credentials constantly: hosting logins, CMS admin accounts, API keys, database access, exports full of customer data. With several clients at once, a repeatable process saves time and avoids the classic mistakes, such as a password posted in the wrong client's thread or access that's never removed when the project ends.

## Getting credentials from a client

Clients often don't know how to send credentials safely, so make the safe way the easy way.

1. **Ask for your own account first.** Most hosting, CMS, analytics and code platforms can invite a collaborator. That's better for both of you: the client can remove you later without changing their own password.
2. **If they must send a password, send them a [secret request](/request).** They paste the credential into the link you sent, and it's encrypted in their browser to a key only your inbox link holds. One answer is accepted, and opening it deletes it from the server, so copy it into your password manager when you read it.
3. **Keep client credentials in your password manager,** in a separate vault or folder per client.

## Sending credentials to a client

When you hand over something you created, such as a new admin account or a deployment key:

- Send it through a one-time [secure note](/notes), or an [EnvShare](/secrets) link for keys and config, with a short expiry.
- For important accounts, choose *Link + password* and give the password on a call.
- For documents such as contracts or exports with personal data, use an [encrypted file drop](/files) rather than an email attachment.
- Ask the client to change the password after they sign in, so they hold a credential you never saw.

## Ending a project cleanly

Offboarding is where freelancer access most often lingers. At the end of each engagement:

- ask the client to remove your accounts, or remove yourself where you can;
- rotate any shared credentials you knew, or ask the client to;
- delete the client's credentials from your password manager once you no longer need them;
- check [My links](/links) for anything still unopened and revoke it.

## Why this helps your business

A clear process is easy to explain in an onboarding email, reassures clients who care about security, and keeps sensitive data out of long email threads that outlive the project. It protects you too: if a client's account is misused later, you can show that your access was scoped, documented and removed on time.

For specific credentials, see [how to send API keys safely](/blog/how-to-send-api-keys-safely) and [how to share database credentials safely](/blog/how-to-share-database-credentials-safely).`,
  },
  {
    slug: "what-to-look-for-in-a-private-note-app",
    title: "What to Look for in a Private Note App",
    description:
      "A checklist for choosing a private note or secret-sharing tool: where encryption happens, where the key lives, what the server keeps, and what it tracks.",
    category: "Buyer Guide",
    publishedAt: "2026-05-21",
    updatedAt: "2026-10-11",
    related: [
      "how-zero-knowledge-encrypted-notes-work",
      "self-destructing-messages-explained",
      "best-free-encrypted-notepad-online",
    ],
    content: `Plenty of tools promise private notes, and the differences that matter are mostly invisible in the interface. Here are the questions worth asking before you trust one with a password or a private message. Most can be answered from a tool's security page, its privacy policy or its source code.

## 1. Where does encryption happen?

It should happen in your browser, before anything is uploaded. If a service encrypts after receiving your note ("encrypted at rest"), it had the plaintext first and it holds the keys. [Client-side vs server-side encryption](/blog/client-side-encryption-vs-server-side-encryption) explains the difference.

A quick test: open your browser's developer tools, create a note, and look at the network request. You should see unreadable ciphertext, not your text.

## 2. What does the password actually do?

"Password-protected" means very different things. In some products the password unlocks a screen while the note sits readable on the server. In others the password is turned into the encryption key, so without it nobody, the service included, can decrypt the note.

You want the second kind, with the password stretched by a deliberately slow key-derivation function so each guess is expensive. ProtectedShare stretches note passwords with PBKDF2-SHA256 at 600,000 iterations, the figure the [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) recommends. Even so, a password-only note is only as strong as its password, so use a long generated one.

## 3. Where does the key live?

There are two common designs, and a good tool offers both:

- **The key in the link.** A random key goes after the \`#\` in the link. Browsers don't send that part to the server ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)), so the service never sees it. The link itself becomes the secret: anyone with the whole link can open the note.
- **A password sent separately.** The link alone opens nothing; the recipient also needs a password you send another way.

ProtectedShare's [Secure Notes](/notes) supports a link key, a password, or both. Both together is the strongest option: a leaked link opens nothing without the password.

Be wary of claims that the key "never leaves your device." If you're sharing a note, the key has to reach the recipient somehow. The honest version is that it never reaches the server.

## 4. Is deletion real?

"Self-destructing" should mean the stored ciphertext is deleted from the database, not hidden from view. Look for a clear statement of when data is deleted (on first read, after a read limit, at expiry) and how quickly expired data is purged. [Self-destructing messages explained](/blog/self-destructing-messages-explained) covers the difference.

Check how the tool handles link previews too. Messaging apps fetch links to build previews, and a careless tool lets that fetch burn the note before your recipient sees it.

## 5. Does it need an account?

For one-off sharing, an account mostly adds data to collect and another password to manage. A tool without signup can still encrypt locally, enforce expiry and keep the server blind to content. What it gives up is a history that follows you across devices: ProtectedShare keeps your list of shares in My links, in the browser that created them, which is a deliberate trade.

No account also means the recipient never has to sign up, which often decides whether people use the secure option at all or fall back to pasting into chat.

## 6. What does it track?

"Zero tracking" is a strong claim and rarely literally true: web servers and hosting providers see IP addresses and request times, and many sites run analytics. Look for specifics instead:

- Does the site load analytics, and is it kept off the pages where notes are created and opened?
- Does the app set cookies of its own?
- What do the server logs contain?

For transparency, here is ProtectedShare's answer. The hosted site may load Google Analytics on its general pages when the operator enables it; it never loads on pages that open or hold a share, and page views report the path only. The app sets no cookies of its own, though Google Analytics sets its own when it's on. The [privacy page](/privacy) says whether analytics is enabled, and the [security page](/security) lists what the server sees.

## 7. Can you verify any of it?

Claims are cheap. Open-source code lets anyone check where encryption happens and what's sent. A published security model that also says what it doesn't protect against is a good sign. The option to [self-host](/self-host) removes the need to trust the operator at all.

## 8. Does it fit the job?

Finally, the practical details. It should work well on a phone, make expiry and read limits easy to set, and show the recipient clearly what happened, including whether a note was already opened. Tools that are awkward don't get used, and the secret ends up in a chat message instead.

## Quick checklist

| Question | A good answer |
| --- | --- |
| Where is it encrypted? | In the browser, before upload |
| What does the password do? | Derives the key, through a slow key-derivation function |
| Where is the key? | In the link fragment or with you, never on the server |
| What happens when it's read? | The ciphertext is deleted, not hidden |
| Account needed? | Not for sharing |
| Tracking? | Stated specifically, and none on pages that open notes |
| Can you verify it? | Open source, with a documented threat model |`,
  },
  {
    slug: "best-practices-for-sharing-passwords-in-2026",
    title: "Best Practices for Sharing Passwords in 2026",
    description:
      "What NIST, CISA and OWASP currently say about passwords, plus a routine for sharing one safely and knowing when to change it afterwards.",
    category: "Best Practices",
    publishedAt: "2026-06-04",
    updatedAt: "2026-10-11",
    related: [
      "is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
      "password-manager-vs-one-time-secret-link",
      "how-to-share-wifi-password-safely",
    ],
    practice: {
      primary: { href: "/notes", label: "New secure note" },
      secondary: { href: "/tools/password-generator", label: "Generate a password" },
    },
    content: `Password advice has changed more in the last few years than in the decade before it. Composition rules and forced 90-day changes are out; length, uniqueness, breach checks and password managers are in. Sharing is where even good passwords get exposed, so this guide starts with what current guidance says and then turns it into a routine for handing a password to someone else.

## What current guidance says

**NIST SP 800-63B-4**, the US digital identity guidelines finalised in 2025, sets the baseline many organisations follow ([NIST](https://pages.nist.gov/800-63-4/sp800-63b.html)):

- Passwords used on their own must be at least 15 characters. Eight is the minimum only when the password is one factor in multi-factor authentication.
- Services should allow passwords of at least 64 characters.
- Services shall not impose composition rules, such as requiring a mix of character types.
- Services shall not require periodic password changes, but shall force a change when there's evidence a password has been compromised.
- New passwords are checked against a blocklist of commonly used, expected or compromised passwords.
- Services must allow password managers and autofill, and should allow pasting.

**CISA**, the US Cybersecurity and Infrastructure Security Agency, recommends passwords of at least 16 characters that are random (a mix of character types, or a passphrase of 5 to 7 unrelated words) and unique to each account, with a password manager to keep track of them ([CISA](https://www.cisa.gov/secure-our-world/require-strong-passwords)).

**The OWASP Secrets Management Cheat Sheet**, written for teams, adds two points that matter for sharing: avoid a single shared password for all administrators, and ideally don't send a password together with its username ([OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)).

## Rule 1: share access, not passwords, when you can

Every shared password is a credential several people can use and nobody can revoke individually. Before sharing one, check whether the service offers:

- separate accounts or seats for each person;
- single sign-on for your organisation;
- delegated access, family plans or guest access.

If it does, use that. When someone leaves, you remove their access instead of changing a password everyone depends on.

## Rule 2: send it through a channel that forgets

If you do have to share, don't paste the password into chat, email or SMS, where it stays in histories and backups. Send a link to an encrypted note that's deleted when it's opened. [Is it safe to send passwords over WhatsApp, email, or SMS?](/blog/is-it-safe-to-send-passwords-over-whatsapp-email-or-sms) explains what each channel actually protects.

## Rule 3: separate the pieces for anything important

In the spirit of OWASP's advice not to send a username with its password, split what you send. Put the password in a one-time note, and send the username, or an extra password for the note, through a different channel such as a phone call. Someone who gets into one of your accounts then doesn't get everything.

## Rule 4: make it temporary twice

- **Make the link temporary:** burn after reading, and the shortest expiry that works.
- **Make the password temporary** where the service allows it: send an initial password that must be changed at first sign-in, so the recipient ends up with a password only they know.

## Rule 5: confirm, then clean up

Ask the recipient to confirm they received it, and to store it in their password manager rather than a notes app. Check that the link shows as opened. Delete any drafts, screenshots or copies you made along the way.

## Rule 6: change passwords on triggers, not on a timer

NIST no longer asks for periodic changes, but it does require a change when there's evidence of compromise. For shared passwords, the practical triggers are:

- someone who knew it leaves the team, the household or the project;
- the link was opened by someone other than the intended recipient;
- the password was ever sent in plain text, posted in a group chat or committed to a repository;
- the password turns up in a breach. Have I Been Pwned's [Pwned Passwords](https://haveibeenpwned.com/Passwords) lets tools check this with k-anonymity: the password is hashed locally and only the first five characters of the hash are sent. You can run a check with the [breached password checker](/tools/breached-password-checker).

## The routine, step by step

1. **Generate a strong password** with a [password generator](/tools/password-generator): 16 characters or more, or a passphrase of several random words. To test one you already have, use the [password strength checker](/tools/password-strength-checker).
2. **Store it in your password manager first,** so the shared copy is never the only copy.
3. **Create a one-time note** in [Secure Notes](/notes) with burn after reading on and a short expiry. For important accounts, choose *Link + password* and send the extra password through another channel.
4. **Send the link** in your usual app, with a short line about what it's for.
5. **Confirm receipt,** and check [My links](/links) to see that it was opened.
6. **Rotate when a trigger happens,** not before.

## If you're on the receiving end

Good sharing takes two people. When someone sends you a password:

- Open the link when you're ready to save the password, because a one-time note may not open twice.
- Save it in your password manager straight away, not in a notes app, a screenshot or a reply to the sender.
- If the account is now yours alone, change the password, so nobody else knows the current one.
- If the link was already used when you opened it, tell the sender. Someone else saw it first, and the password needs changing.
- Don't forward the link. If someone else needs access, ask the owner to share it with them directly.

## A short team policy you can adapt

Teams follow rules they can remember. Something this short is enough to start with:

> Passwords and keys are never pasted into chat, email, tickets or shared documents. To share one, send a one-time link that expires within a day, and give any extra password through a different channel. Anything needed for longer than a week goes in the password manager. When someone leaves, every shared password they knew is changed.

## Situations and what to do

| Situation | Best practice |
| --- | --- |
| A family member needs a streaming login | The service's profiles or family plan if it has them, otherwise a one-time note |
| A new employee's first password | A temporary password that must be changed at first sign-in, sent as a one-time note |
| A contractor needs a tool for a month | Their own account; if that's impossible, a one-time note and a password change at the end |
| A team shares one social media login | A shared vault in a password manager, with multi-factor authentication on the account |
| Guests need the Wi-Fi | A guest network and a QR code; see [how to share a WiFi password safely](/blog/how-to-share-wifi-password-safely) |
| You need a password from someone | A [secret request](/request) |

## Common mistakes

- **Reusing a password because it's easy to share.** One leak then exposes every account that uses it.
- **Sharing a password manager's master password.** Use the manager's own sharing features instead.
- **Keeping a "passwords" document in a shared drive.** It's a vault without any of a vault's protections.
- **Reading out multi-factor codes.** One-time codes exist to prove it's you. Treat anyone who asks you for one with suspicion.

## Where passkeys fit

Passkeys sidestep sharing for the accounts that support them. The [FIDO Alliance](https://fidoalliance.org/passkeys/) describes them as a password replacement that is phishing-resistant and designed so that there are no shared secrets. For every account still on passwords, the rules above apply.

## When ProtectedShare isn't the right tool

- **Ongoing shared access** belongs in a password manager's shared vault, where a changed password updates for everyone.
- **Organisations with compliance requirements** may need sharing that's logged and tied to identities. ProtectedShare records that a link was opened, not who opened it.
- **Your own recovery codes** belong in your password manager, not in a link that deletes itself.

## Sources

- NIST, [SP 800-63B-4: Authentication and Authenticator Management](https://pages.nist.gov/800-63-4/sp800-63b.html)
- CISA, [Require Strong Passwords](https://www.cisa.gov/secure-our-world/require-strong-passwords)
- OWASP, [Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- Have I Been Pwned, [Pwned Passwords](https://haveibeenpwned.com/Passwords)
- FIDO Alliance, [Passkeys](https://fidoalliance.org/passkeys/)`,
  },
  {
    slug: "is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
    title: "Is It Safe to Send Passwords Over WhatsApp, Email, or SMS?",
    description:
      "What WhatsApp, Signal, Telegram, email and SMS actually protect, where copies of a password end up, and a safer routine when you have to send one.",
    category: "Security Basics",
    publishedAt: "2026-06-11",
    updatedAt: "2026-10-11",
    related: [
      "best-practices-for-sharing-passwords-in-2026",
      "how-to-send-sensitive-information-online-safely",
      "password-manager-vs-one-time-secret-link",
    ],
    practice: {
      primary: { href: "/notes", label: "New secure note" },
      secondary: { href: "/request", label: "Ask for a password" },
    },
    content: `## The short answer

It depends on the channel, and on what happens to the message after it arrives.

- **WhatsApp and Signal** encrypt messages end to end, so the service can't read them on the way. But the password then sits in the chat history on every device in the conversation, and possibly in backups.
- **Email** usually isn't end-to-end encrypted. It's often encrypted between servers, but each provider stores a readable copy.
- **SMS** isn't end-to-end encrypted at all.

For a low-stakes password, an end-to-end encrypted chat with disappearing messages turned on is reasonable. For anything that matters (banking, email, admin accounts, production systems, a password manager's master password), don't put the password itself into any chat history. Send a link that stops working once it's opened.

## What each channel actually protects

| Channel | Protected in transit? | Who could read it on the way | Where copies end up |
| --- | --- | --- | --- |
| WhatsApp | End-to-end encrypted | Not WhatsApp | Every device in the chat; cloud backups, which are end-to-end encrypted only if you turn that on |
| Signal | End-to-end encrypted | Not Signal | Every device in the chat |
| iMessage (Apple to Apple) | End-to-end encrypted | Not Apple | Every device in the chat, and their backups |
| RCS in Google Messages | End-to-end encrypted between Google Messages users | Not Google | Every device in the chat |
| Telegram (regular and group chats) | Encrypted between each device and Telegram's servers, not end to end | Telegram's servers | Telegram's cloud, and every device you sign in on |
| SMS and MMS | Not end-to-end encrypted | Mobile carriers, and anyone with access to their networks | Both phones and carrier systems |
| Email | Usually TLS between servers | Both email providers | Both mailboxes, sent folders, backups and archives |

The details behind that table:

- **WhatsApp** uses the Signal Protocol, which its technical [encryption overview](https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf) says is designed to prevent third parties and WhatsApp itself from having plaintext access to messages or calls. Backups are a separate matter. End-to-end encrypted backups are an option users enable; otherwise backups are secured by the cloud storage service rather than by WhatsApp's encryption ([Engineering at Meta](https://engineering.fb.com/2021/09/10/security/whatsapp-e2ee-backups/)).
- **iMessage** encrypts messages end to end so that only the sender and receiver can read them ([Apple Platform Security](https://support.apple.com/guide/security/imessage-security-overview-secd9764312f/web)).
- **Google Messages** encrypts RCS conversations between Google Messages users by default, and states that end-to-end encryption isn't available for SMS and MMS ([Google Messages Help](https://support.google.com/messages/answer/10262381)).
- **SMS:** the US Cybersecurity and Infrastructure Security Agency puts it bluntly in its [mobile communications guidance](https://www.cisa.gov/resources-tools/resources/mobile-communications-best-practice-guidance): SMS messages are not encrypted, and someone with access to a carrier's network who intercepts them can read them.
- **Email:** Gmail uses TLS to protect messages in transit when the other service supports it, and flags messages that weren't encrypted ([Gmail Help](https://support.google.com/mail/answer/6330403)). TLS protects the trip between servers; both mailboxes still hold readable copies. Stronger options such as S/MIME and client-side encryption exist, mainly for work and school accounts.

## What about Telegram and work chat?

Two other places passwords often end up deserve a closer look.

- **Telegram:** ordinary chats, groups included, are "cloud chats" that use server-client encryption and are stored in Telegram's cloud. Only secret chats, a separate one-to-one mode, use end-to-end encryption ([Telegram FAQ](https://telegram.org/faq)). A password sent in a normal Telegram chat isn't end-to-end encrypted, and it's there on every device you sign in to.
- **Slack and other workplace chat:** these run under your organisation's account and its settings for how long messages are kept. On Slack, workspace owners and admins can export messages from public channels on every plan, and from private channels and direct messages on some plans ([Slack Help Center](https://slack.com/help/articles/201658943-Export-your-workspace-data)). Treat a password posted in work chat as visible to the people who run the workspace, for as long as the workspace keeps messages.

## Encryption protects the trip, not the copies

End-to-end encryption answers one question: can someone in the middle read this? It doesn't answer the question that matters most for passwords: where does this password live from now on?

After you send a password in a chat, it typically exists:

- in the chat history on your phone and theirs, and on any linked desktop or tablet (WhatsApp supports several devices per account, each with its own keys);
- in phone and cloud backups;
- in notification previews on lock screens;
- in any screenshot either of you takes.

Each copy is somewhere the password can be found later: by someone who picks up an unlocked phone, by malware, or by anyone who gets into a backup account.

**Disappearing messages** reduce this, and CISA recommends enabling message expiration to delete sensitive messages automatically. But they're a tidiness feature, not a guarantee. When Signal introduced them, it said they're [not for situations where your contact is your adversary](https://signal.org/blog/disappearing-messages/), since a recipient can always photograph the screen.

## A safer routine for sending a password

1. **Put the password in an encrypted note.** Open [Secure Notes](/notes) and paste it. It's encrypted in your browser with AES-256-GCM before upload. Keep **burn after reading** on, and pick a short expiry.
2. **Send the link through the chat you'd normally use.** The chat now holds a link, not the password. The decryption key sits after the \`#\` in the link, and browsers don't send that part to servers ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)).
3. **For high-stakes passwords, split across two channels.** Choose *Link + password*. Send the link by email or chat, and the extra password another way: a phone call, in person, or a different messaging app. Someone who gets into one account doesn't get both pieces.
4. **Confirm it arrived.** Ask the recipient to tell you when they've read it. [My links](/links), in the browser you used, shows when it was opened.
5. **If it was opened before they say they opened it, treat the password as exposed** and change it. A note the recipient finds already used is a warning, not a silent leak.

It works in reverse too. If you need someone to send you a password, send them a [secret request](/request): what they paste is encrypted in their browser to a key only your inbox link holds.

## Splitting the link and the password

| Link goes by | Password goes by | Good for |
| --- | --- | --- |
| Work email | A phone call | Clients and colleagues |
| Slack or Teams | A different messaging app | Teams that already use both |
| WhatsApp or Signal | Said in person | Family and household accounts |

Keep the instructions simple. Tell the recipient which message has the link and which has the password; confusion is how both end up pasted into the same thread.

## When a one-time link isn't the answer

- **They'll need the password again and again.** Use a password manager's sharing features; see [password manager vs one-time secret link](/blog/password-manager-vs-one-time-secret-link).
- **The service supports separate users.** Inviting someone to their own account beats sharing yours.
- **You suspect their phone or computer is compromised.** No sharing tool fixes a compromised device.

## If you already sent a password in plain text

Deleting the message helps less than it seems: the other person's devices, linked devices and backups may still have copies. If the account matters, change the password, using a [password generator](/tools/password-generator) for the new one, and send it properly this time. If the same password is used anywhere else, change it there too, and check old passwords with a [breached password checker](/tools/breached-password-checker).

## Sources

- WhatsApp, [WhatsApp Encryption Overview](https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf) (technical white paper)
- Engineering at Meta, [How WhatsApp is enabling end-to-end encrypted backups](https://engineering.fb.com/2021/09/10/security/whatsapp-e2ee-backups/)
- Apple Platform Security, [iMessage security overview](https://support.apple.com/guide/security/imessage-security-overview-secd9764312f/web)
- Google Messages Help, [How end-to-end encryption in Google Messages provides more security](https://support.google.com/messages/answer/10262381)
- Gmail Help, [Learn how Gmail encrypts your emails](https://support.google.com/mail/answer/6330403)
- CISA, [Mobile Communications Best Practice Guidance](https://www.cisa.gov/resources-tools/resources/mobile-communications-best-practice-guidance)
- Signal, [Disappearing messages for Signal](https://signal.org/blog/disappearing-messages/)
- Telegram, [FAQ](https://telegram.org/faq)
- Slack Help Center, [Export your workspace data](https://slack.com/help/articles/201658943-Export-your-workspace-data)
- MDN, [URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)`,
  },
  {
    slug: "secrets-management-basics-for-startups",
    title: "Secrets Management Basics for Startups",
    description:
      "Where API keys, certificates and credentials should live when your team is small, plus simple team rules for sharing and rotating them.",
    category: "Teams",
    publishedAt: "2026-06-18",
    updatedAt: "2026-10-11",
    related: [
      "how-to-send-api-keys-safely",
      "how-to-share-env-files-securely",
      "how-to-share-database-credentials-safely",
    ],
    practice: {
      primary: { href: "/secrets", label: "Share a .env" },
      secondary: { href: "/request", label: "Ask for a secret" },
    },
    content: `## Start with an inventory, not a platform

Small teams rarely lack tools for secrets; they lack a clear picture of where their secrets currently live. Before adopting anything, list every credential the team relies on and where copies exist: cloud consoles, repositories, laptops, CI settings, chat threads, and the shared document nobody admits to. For each one, note who can access it and how you'd rotate it.

The inventory usually surfaces the urgent fixes on its own, such as a production token in an old commit or a credential pasted into an onboarding document.

## Three habits that cover most of the risk

**1. Keep secrets out of source control.** Use git-ignored environment files locally, and detect secrets before code is pushed. The [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) recommends enabling detection at the developer level, such as a pre-commit hook, and GitHub's [push protection](https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection) blocks pushes that contain recognised secrets.

**2. Centralise runtime secrets.** Use the secret store your cloud or deployment platform already provides rather than a homegrown scheme, and give each service access only to the secrets it needs. OWASP recommends scoping access so that no single identity can read every secret, and using dynamic, short-lived secrets where you can.

**3. Fix the human path.** A lot of avoidable exposure happens when credentials move between people: onboarding, incidents, contractors. Give the team one standard way to do it, such as an encrypted link that expires, and make chat and email the exception that needs a reason.

## Simple team rules for sharing

Small teams move faster than formal policy. A short set of defaults, written down where everyone can find them, does more than a long policy nobody reads:

| Situation | Default |
| --- | --- |
| Sending a password or key to one person | A one-time [EnvShare](/secrets) link: one read, expiring within a day |
| A few people need the same value briefly | A read limit equal to the number of people, and the shortest workable expiry |
| Anyone needs it for longer than a week | It goes in the password manager or secret store, not a link |
| Someone outside the team needs to send you a secret | A [secret request](/request) |
| A secret was pasted into chat, email or a ticket | Rotate it, then delete the message |
| Someone leaves | Rotate every shared secret they could see |

Make exceptions explicit. If someone has to break a rule during an incident, they say so, and the secret is rotated afterwards.

## Rotation without drama

Rotation is the safety net for every other mistake, so make it routine:

- Know how to rotate each secret in your inventory before you need to.
- Prefer setups that allow overlap, where a new key works before the old one is revoked, so rotation doesn't cause downtime.
- Rotate on triggers: departures, suspected exposure, the end of a contractor engagement. OWASP's guidance is that exposed secrets should be revoked immediately.

## When to invest in more

A dedicated secrets platform starts to pay off when you have several environments, several services sharing credentials, or compliance requirements that call for audit logs. Until then, the three habits and the team rules above get you most of the way, and they make the move to a bigger system easier when it comes.

For the handoff itself, see [how to send API keys safely](/blog/how-to-send-api-keys-safely) and [how to share .env files securely](/blog/how-to-share-env-files-securely).`,
  },
  {
    slug: "how-to-send-sensitive-information-online-safely",
    title: "How to Send Sensitive Information Online Safely",
    description:
      "A routine for sending ID numbers, bank details, documents and passwords online: verify who's asking, send less, encrypt it, expire it, and confirm.",
    category: "Privacy",
    publishedAt: "2026-07-02",
    updatedAt: "2026-10-11",
    related: [
      "is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
      "best-practices-for-sharing-passwords-in-2026",
      "self-destructing-messages-explained",
    ],
    practice: {
      primary: { href: "/notes", label: "New secure note" },
      secondary: { href: "/files", label: "Send a file" },
    },
    content: `"Sensitive information" covers a lot: a passport scan for a landlord, bank details for an invoice, a tax document for an accountant, a password for a family member, a medical letter, a signed contract. The channels most people use for these, email and chat, were built to keep things, not to forget them.

This guide is a routine you can apply to any of them, in five steps: check who's asking, send less, pick the channel, make it expire, and confirm.

## 1. Check who's asking

Before you think about encryption, make sure the request is real. Requests for personal details, payment changes and login codes are exactly what phishing imitates. The FTC's advice on [recognising phishing](https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams) is to contact the company using a phone number or website you know is real, not the contact details in the message.

Be especially careful with:

- requests to change the bank details for a payment you were already going to make;
- urgency ("today, or the account will be closed");
- anyone asking you to read out a one-time login code. A code sent to you is there to prove it's you; nobody who contacts you needs it.

## 2. Send less

Every detail you don't send is one you never have to worry about.

- Send the last four digits of a number when that's enough to identify the account.
- Crop or redact a document to the part that's needed. For an ID, cover the fields you weren't asked for, if the recipient accepts that.
- Add a visible note to scans, such as "For [company] rental application only," which makes a leaked copy less useful for anything else.
- Check photos before sending them: phone cameras can record location data in the file.

## 3. Pick the channel by what you're sending

| What you're sending | A good option | Avoid |
| --- | --- | --- |
| A password or PIN | A [one-time note](/notes) that burns after reading | SMS, email, group chats |
| An API key or \`.env\` file | [EnvShare](/secrets), with one read | Chat, tickets, wikis |
| ID scans, contracts, tax documents (up to 25 MB) | An [encrypted file drop](/files), or the recipient's own secure portal | Plain email attachments |
| Bank details for a payment | The payee's portal or invoicing system, then confirm by phone | Replying to an email that asked you to change them |
| Something you need from someone else | A [secret request](/request) | Asking them to email it |
| A login several people use for months | A shared vault in a password manager | A fresh link every week |

If the organisation you're dealing with has its own secure upload portal, that's usually the right choice: it was set up for that data and for its retention rules.

## 4. Send it so it expires

For anything that only needs to be read once, send a link that deletes itself instead of the information itself.

**For text** such as passwords, account numbers or short notes:

1. Open [Secure Notes](/notes) and paste the text.
2. Leave **burn after reading** on, so the note is deleted from the database the first time it's opened.
3. Choose the shortest expiry that works: 1 hour, 1 day, 7 days, or a custom date up to 30 days away.
4. For anything high-stakes, add a password and send it another way, such as a phone call.
5. Copy the link and send it through your usual channel.

**For documents,** use a [file drop](/files). Files up to 25 MB are encrypted in your browser, file names included, and the drop is deleted after the number of downloads you choose (1 to 100) or at expiry.

**Tell the recipient what to expect,** especially if they don't use tools like this often. A one-line message such as "This link opens once. Save what's inside before you close it" prevents the most common problem: someone opens the link on a phone, closes the tab, and has to ask you to send it again.

What the server sees, stated plainly: the encrypted data and its size, the timing of requests, and network details such as IP addresses. It doesn't see the content, the file names or the key, which travels in the part of the link after the \`#\` that browsers don't send to servers ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)). The [security page](/security) lists exactly what's stored.

## 5. Confirm, then clean up

- Ask the recipient to confirm they received it. [My links](/links) shows when your link was opened, in the browser you created it from.
- If the link was opened before they say they opened it, assume someone else saw it and act accordingly: change the password, or warn your bank.
- Delete the copies you made along the way, such as a scan sitting in your Downloads folder.

## Three common situations

**An ID scan for a landlord or an employer.** Ask whether they have an upload portal first. If they don't, send the scan through a [file drop](/files) with one download and a short expiry, and mark the image with what it's for. Only send it to contact details you've confirmed, not to an address from an advert or an unexpected message.

**Bank details for an invoice.** Put them on the invoice in your usual invoicing tool, or send them in a one-time note. If you're the one paying, never act on an emailed change of bank details without first phoning the payee on a number you already had.

**A password for a family member.** Send a one-time note, and give the extra password out loud the next time you talk. If your family already shares a password manager vault or a family plan, use that instead, so the password updates for everyone when it changes.

## When email is the only option

Sometimes a form or an organisation leaves no choice. In that case:

- Gmail and other major providers use TLS to protect mail between servers when both sides support it, and Gmail shows a red open padlock on messages that weren't encrypted ([Gmail Help](https://support.google.com/mail/answer/6330403)). That protects the trip, not the readable copies stored in both mailboxes.
- Features like Gmail's confidential mode limit forwarding and downloading, but Google notes that recipients can still take screenshots or photos, and malicious programs may still copy the message ([Gmail Help](https://support.google.com/mail/answer/7674059)).
- Encrypt the content before it goes into the email. For text, [Encrypt text](/tools/encrypt-text) turns it into a password-protected block you can paste into the message. Send the password through another channel.

## Receiving sensitive information

If you're the one who needs a document or a password, make it easy for the other person to send it safely. A [secret request](/request) gives them a link where whatever they paste is encrypted in their browser to a key only your inbox link holds. One answer is accepted, and collecting it deletes it from the server, so copy it somewhere safe when you open it.

## What encryption can't do

- **The recipient can keep a copy.** Once they've read it, it's theirs. Share only with people you'd trust with it anyway.
- **A compromised device defeats any tool.** If your computer or theirs is infected, encryption in the browser won't help.
- **Whoever opens the link first can read it.** That's why burn after reading, a short expiry and a separate password matter.

## When not to use ProtectedShare

- **When an organisation requires its own channel.** Many banks, employers, healthcare providers and government services do, and their portals come with the retention and access rules the data needs.
- **When records have to be kept.** Workplace retention rules or legal holds may require messages to be archived, which a self-deleting link deliberately prevents.
- **When several people need ongoing access.** Use a shared vault or a document system with proper access controls.

## Sources

- FTC, [How To Recognize and Avoid Phishing Scams](https://consumer.ftc.gov/articles/how-recognize-and-avoid-phishing-scams)
- Gmail Help, [Learn how Gmail encrypts your emails](https://support.google.com/mail/answer/6330403)
- Gmail Help, [Send & open confidential emails](https://support.google.com/mail/answer/7674059)
- MDN, [URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)`,
  },
  {
    slug: "encrypted-pastebin-alternative-for-code-snippets",
    title: "Encrypted Pastebin Alternative for Code Snippets and Secrets",
    description:
      "Why public pastebins and secret gists are a poor place for config, tokens and logs, and how encrypted, expiring snippets compare.",
    category: "Developer Security",
    publishedAt: "2026-07-09",
    updatedAt: "2026-10-11",
    related: [
      "how-to-share-env-files-securely",
      "how-to-send-api-keys-safely",
      "client-side-encryption-vs-server-side-encryption",
    ],
    content: `## The problem with ordinary pastebins

Pastebins are handy for sharing a stack trace or a snippet, which is exactly why they're risky for everything else. Public pastes can be crawled, indexed and archived. Unlisted isn't the same as private, either: GitHub's documentation on [creating gists](https://docs.github.com/en/get-started/writing-on-github/editing-and-sharing-content-with-gists/creating-gists) says secret gists aren't private, and anyone who has or discovers the URL can see them.

Most pastebins also store the paste in readable form on their servers, often indefinitely. For a log that happens to include a token, or config that includes a database URL, that's a leak waiting to be noticed.

## How encrypted snippet sharing differs

An encrypted alternative flips the model. Your browser encrypts the snippet before upload, so the server stores ciphertext it can't read. The decryption key rides in the part of the URL after the \`#\`, which browsers don't send to the server ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)), or reaches the recipient as a separate password.

Add an expiry and a read limit, and a shared snippet stops being a permanent artifact. The recipient gets what they need, and the paste is deleted when its job is done.

ProtectedShare's [EnvShare](/secrets) works this way for config and keys, with 1 to 100 reads and up to 30 days, and [Secure Notes](/notes) handles anything else, with Markdown and inline code. PrivateBin is a long-standing open-source encrypted pastebin; [ProtectedShare vs PrivateBin](/vs/privatebin) compares the two.

## Before you paste anything

- **Redact first.** Logs often contain tokens, session cookies, email addresses and internal host names. Replace them with placeholders before sharing.
- **Share the smallest snippet** that reproduces the problem.
- **If a secret did end up in a public paste, assume it's compromised.** Revoke or rotate it, then delete the paste. Deleting alone doesn't undo copies already made.

## When a public pastebin is fine

For public code samples, open-source bug reports and anything you'd be happy to see indexed, a public pastebin or gist is the right tool: being searchable and permanent is the point there. Keep encrypted, expiring sharing for everything else.`,
  },
  {
    slug: "best-free-encrypted-notepad-online",
    title: "How to Choose an Encrypted Notepad",
    description:
      "What separates a genuinely encrypted notepad from a lock icon: local versus synced storage, offline access, journaling, and the limits worth knowing.",
    category: "Notetaking",
    publishedAt: "2026-07-16",
    updatedAt: "2026-10-11",
    related: [
      "what-to-look-for-in-a-private-note-app",
      "how-zero-knowledge-encrypted-notes-work",
      "client-side-encryption-vs-server-side-encryption",
    ],
    practice: {
      primary: { href: "/notepad", label: "Open the notepad" },
      secondary: { href: "/notes", label: "New secure note" },
    },
    content: `## Not every "encrypted" notepad encrypts your notes

Plenty of note apps advertise privacy while storing your content in readable form on their servers. The lock icon protects the screen, not the data. A genuinely encrypted notepad does the cryptography on your device, so the server, if there is one, only ever receives ciphertext.

That's the first thing to verify. Look for a plain explanation of where encryption happens and where the keys live. Phrases like "bank-level security" without that explanation usually mean the service can read everything.

## Local, synced, or both

Encrypted notepads come in two basic shapes, and each protects against different things.

| | Local only | Synced |
| --- | --- | --- |
| Where notes live | In this browser or device | An encrypted copy on a server, plus your devices |
| Works offline | Yes | Yes, if the app keeps notes locally too |
| Survives a lost or wiped device | No, unless you export | Yes |
| What the server can see | Nothing | Ciphertext, its size, and when you save |
| Main risk | Losing the device or clearing browser data | A weak password, since it protects the server copy |

Local-only is the most private and the most fragile. Synced is convenient, but the password you choose becomes the thing protecting the copy on the server, so it needs to be long and unique.

## Offline-first matters more than it sounds

An offline-first notepad lets you keep writing when the network is slow or absent, and saves on your device first. That's a reliability feature, and also a privacy one: you're less tempted to paste a private draft into some other app while you wait for a connection.

Exports matter for the same reason. A notepad that can export notes in a form you can open without the service means you're never locked in, and you have a backup if the service disappears.

## Keeping a private journal

Journals hold names, health details, plans and feelings, the kind of writing that should be private by default. A few habits make an encrypted notepad a good home for one:

- **Use a long passphrase** you don't use anywhere else, and keep it in your password manager.
- **Lock your devices.** Encryption in the app doesn't help if someone can open your unlocked laptop with the notepad already open.
- **Export now and then** to an encrypted file you control, so a cleared browser or a lost phone doesn't take months of entries with it.
- **Make it quick to open.** A journal only works if you write in it, and a tool that fights you every time won't get used.

## The checklist

Before trusting an encrypted notepad with private notes, check that:

1. encryption happens on your device, before anything is uploaded;
2. you can start without an account, and sync is optional;
3. it works offline;
4. it can export notes you can open without the service;
5. it's clear about what the server stores when you do sync.

## How ProtectedShare's notepad fits

ProtectedShare's [encrypted notepad](/notepad) is a Markdown scratchpad. In local mode the vault stays in your browser and nothing is uploaded; the key for local mode is kept in the same browser, so it keeps your notes away from the server, not from someone who can use your browser profile. For multi-device sync you choose a username and password, and the server stores the encrypted vault, a SHA-256 hash of the username and a password proof that authorizes saves, never the text. Any note can be exported as a self-decrypting HTML file that opens offline with its password.

One honest detail: the notepad still uses ProtectedShare's original encryption scheme, AES-256-GCM with a key stretched by PBKDF2-SHA256 at 210,000 iterations, rather than the newer scheme used for shared links. The [security page](/security) describes both.

If you want to send a note to someone rather than keep it, use a [secure note](/notes) instead. It's built for one-time delivery and deletes itself after reading.`,
  },
  {
    slug: "anonymous-chat-room-no-signup-how-it-works",
    title: "Anonymous Chat Rooms With No Signup: How They Work",
    description:
      "How signup-free encrypted chat rooms work, where the room key lives, what the server can still see, and what makes a temporary chat private.",
    category: "Privacy",
    publishedAt: "2026-07-23",
    updatedAt: "2026-10-11",
    related: [
      "how-zero-knowledge-encrypted-notes-work",
      "self-destructing-messages-explained",
      "client-side-encryption-vs-server-side-encryption",
    ],
    practice: {
      primary: { href: "/chat", label: "Start a chat room" },
      secondary: { href: "/notes", label: "New secure note" },
    },
    content: `## Why no-signup chat exists

Sometimes you need a quick private conversation without installing an app or handing over a phone number: coordinating with someone outside your organisation, discussing something personal, or talking through an incident away from a workplace chat that keeps everything.

No-signup chat rooms make identity optional. You open a URL, share it with the people you need, and talk. Without accounts there's no profile, phone number or contact list to collect.

## Where the encryption happens

What matters is who can read the messages. In a well-built anonymous chat, encryption happens in the browser, using a key carried in the invite link after the \`#\`, which browsers don't send to the server. Messages reach the server only as encrypted blobs that are relayed to the other participants.

That makes the invite link the room key. Anyone with the full link can join and read, so share it the way you'd share a password, and only with the people who should be in the room. Rooms protected by a password instead derive their key from that password, so the password needs to be strong.

In ProtectedShare's [encrypted chat](/chat), members can also compare five **safety words** derived from the room key over another channel, such as a phone call. If everyone sees the same words, everyone derived the same key.

## What the server can still see

Encryption hides the content, not the fact that a conversation is happening. The operator and its hosting providers can see that a room exists, when encrypted messages arrive and how large they are, how many people are present, and the IP addresses of connections. A good service says so plainly, as ProtectedShare's [security page](/security) does.

"No account" isn't the same as "untraceable," either. Hosting providers see network details, as they would for any website.

## Temporary by design

Private chat rooms are most useful when they don't build up history. In ProtectedShare's chat, messages are deleted once the room is empty (on the room's next request, or by a cleanup job within 30 minutes), when a message's own disappearing timer runs out, or when anyone in the room burns it. Images and files travel inside the encrypted messages.

## When to use something else

For an ongoing relationship, such as a team or a family group, a dedicated end-to-end encrypted messenger with verified contacts is the better fit. Anonymous rooms are for the conversation you want to have once, and not keep.`,
  },
  {
    slug: "password-manager-vs-one-time-secret-link",
    title: "Password Manager vs One-Time Secret Link: When to Use Each",
    description:
      "A password manager stores credentials you reuse; a one-time link delivers one, once. How they differ, when to use each, and how to combine them.",
    category: "Comparisons",
    publishedAt: "2026-07-30",
    updatedAt: "2026-10-11",
    related: [
      "best-practices-for-sharing-passwords-in-2026",
      "is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
      "how-to-send-api-keys-safely",
    ],
    practice: {
      primary: { href: "/notes", label: "New secure note" },
      secondary: { href: "/vs/bitwarden-send", label: "Compare with Bitwarden Send" },
    },
    content: `Password managers and one-time secret links are often presented as alternatives. They aren't. A password manager is a vault: long-term storage for credentials you use again. A one-time link is a courier: it carries one secret to one person and then disappears. Most people and teams need both, and the trouble starts when one is used to do the other's job.

## What a password manager is for

A password manager generates, stores and fills passwords, so you can use a long, unique one everywhere. Security agencies recommend them: CISA's [mobile communications guidance](https://www.cisa.gov/resources-tools/resources/mobile-communications-best-practice-guidance) says to use a password manager to store all passwords, and NIST's digital identity guidelines, [SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), require services to allow password managers and autofill.

For sharing, most managers offer shared vaults or collections. A team or family keeps common credentials in one place, access is granted and removed per person, and when a password changes, everyone sees the new one.

## What a one-time secret link is for

A one-time link solves a narrower problem: getting a secret to someone who isn't in your vault, once. You paste the secret, it's encrypted in your browser, and the recipient gets a link that opens it and then stops working. In ProtectedShare's [Secure Notes](/notes), the note is encrypted with AES-256-GCM before upload, the key travels in the link after the \`#\`, and a burn-after-reading note is deleted from the database when it's opened. Nobody needs an account on either side.

## Side by side

| | Password manager | One-time secret link |
| --- | --- | --- |
| Job | Store and fill credentials you use again | Deliver one secret, once |
| Recipient needs | Usually an account in the same manager, for shared vaults | Only a browser |
| Lifetime | Until someone deletes it | Until it's opened or expires (ProtectedShare: 30 days at most) |
| When the password changes | Everyone with access sees the new value | You send a new link |
| Taking access back | Remove them from the vault, though they may have copied it | Revoke an unopened link; after that, change the password |
| Best for | Your own accounts, team credentials, anything used repeatedly | Handoffs to people outside your vault, one-off secrets |

## How the security compares

Both can be designed so the provider can't read your secrets: the encryption happens on your devices, and the provider stores ciphertext. The differences are in who can open what, and for how long.

- **Who can open it.** A vault item sits behind someone's account sign-in, often with multi-factor authentication. A link opens for anyone who has the whole link. That's why one-time links should be short-lived and, for important secrets, paired with a password sent another way.
- **How long it exists.** A vault item lives until someone deletes it, in every synced copy. A burned link's ciphertext is deleted from the server when it's opened, so there's nothing left there to breach later.
- **What you can take back.** You can remove someone from a shared vault, but not from their memory or their own copy. A link can be revoked only until it's opened. Either way, changing the password is the only real way to take access back.

## Four questions that decide it

1. **Will they need it again?** If so, it belongs in a password manager.
2. **Are they already in your password manager?** Then share it there.
3. **Will the password change?** A shared vault keeps everyone current; a link would have to be sent again.
4. **Do you need something from them instead?** Reverse the direction and send a [secret request](/request).

If the answer to all four is no, a one-time link is the simpler tool.

## Many password managers can send one-time links too

If you already use a password manager, check its sharing features before adding another tool.

- **1Password** can [share a copy of an item](https://support.1password.com/share-items/) with anyone, even if they don't have a 1Password account. You choose when the link expires and whether it's available to anyone with the link or only to specific people.
- **Bitwarden Send** transmits text or files through temporary links. According to Bitwarden's [documentation](https://bitwarden.com/help/about-send/), data is encrypted on creation and decrypted only when a recipient opens the link, a Send lives for at most 31 days, and you can set a maximum access count. Recipients don't need a Bitwarden account to [open a Send](https://bitwarden.com/help/receive-send/).

A standalone tool still earns its place when you don't use a password manager, or the person sending isn't part of your organisation; when you need a secret sent to you ([secret requests](/request) encrypt the reply to a key only your inbox link holds); for \`.env\` files with a read limit ([EnvShare](/secrets)) or for files ([file drop](/files)); or when you want something you can [self-host](/self-host). There's a fuller comparison in [ProtectedShare vs Bitwarden Send](/vs/bitwarden-send).

## Setting up team sharing in a password manager

If a small team is about to start sharing credentials in a password manager, a little structure at the start saves cleanup later:

1. **Create shared vaults or collections by purpose,** such as "Marketing accounts" or "Production break-glass," rather than one vault for everything.
2. **Add only the people who need each one,** and review membership whenever someone joins, leaves or changes role.
3. **Turn on multi-factor authentication** for the password manager itself, since it now guards every shared credential.
4. **Write down who owns each shared account,** so someone is responsible for changing the password when the team changes.

## When to use a password manager

- For your own accounts, all of them.
- For credentials a team uses every week, such as a shared social media login that can't have individual users.
- For anything that changes and has to stay in sync for several people.
- For recovery codes and other secrets you'll need to find again.

## When to use a one-time link

- Sending a new hire their first password before they're set up in your vault. They change it at first sign-in.
- Giving a contractor a credential for a short job, with a password change when the job ends.
- Moving a secret between your own devices when they don't share a vault.
- Getting a password or key from a client or a family member: send them a [secret request](/request).

## The mistakes that come from mixing them up

- **Using links as storage.** Creating long-lived links "so the team can always find it" turns a courier into a badly organised vault. If a link keeps needing to be re-sent, the credential belongs in a password manager.
- **Exporting vault entries to share them.** An exported file or a screenshot bypasses the vault's access control. Use the manager's own sharing, or a one-time link.
- **Giving outsiders vault access for one password.** A guest seat for someone who needs a single credential once grants more than the job requires, and it's easy to forget to remove.

## A routine that uses both

1. Keep every credential in your password manager.
2. When someone outside the vault needs one, send it through a one-time link, from your manager or from ProtectedShare.
3. Ask them to store it in their own password manager, not in a notes app or a chat.
4. When the work ends, remove access and change the password.

## When neither is the right tool

The best credential to share is the one you don't have to share. Prefer individual accounts, single sign-on or delegated access where a service supports them. Passkeys go further: the [FIDO Alliance](https://fidoalliance.org/passkeys/) describes them as a password replacement that is phishing-resistant and designed so that there are no shared secrets. For machine credentials, such as API keys used by servers, use your platform's secrets manager rather than either tool.

## Sources

- CISA, [Mobile Communications Best Practice Guidance](https://www.cisa.gov/resources-tools/resources/mobile-communications-best-practice-guidance)
- NIST, [SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html)
- 1Password Support, [Securely share 1Password items with anyone](https://support.1password.com/share-items/)
- Bitwarden Help, [About Send](https://bitwarden.com/help/about-send/) and [Receive a Send](https://bitwarden.com/help/receive-send/)
- FIDO Alliance, [Passkeys](https://fidoalliance.org/passkeys/)`,
  },
  {
    slug: "how-to-share-database-credentials-safely",
    title: "How to Share Database Credentials Safely",
    description:
      "A connection string is a whole login in one line. How to create a scoped database user, send it through an expiring encrypted link, and revoke it after.",
    category: "Developer Security",
    publishedAt: "2026-08-13",
    updatedAt: "2026-10-11",
    related: [
      "how-to-send-api-keys-safely",
      "how-to-share-env-files-securely",
      "secrets-management-basics-for-startups",
    ],
    practice: {
      primary: { href: "/secrets", label: "Share credentials" },
      secondary: { href: "/request", label: "Ask for credentials" },
    },
    content: `Database access is one of the most valuable things a team hands out, and one of the most casually shared. A connection string goes into a chat message "just for today" and stays there long after the person who needed it has moved on.

This guide is about doing it properly: giving the right person the least access that works, sending it without leaving copies behind, and taking it back afterwards.

## Why a connection string is worse than a password

A PostgreSQL connection URI can carry everything needed to log in, in the form \`postgresql://user:password@host:5432/dbname\` ([PostgreSQL documentation](https://www.postgresql.org/docs/current/libpq-connect.html)). Other databases use similar formats. One line holds the host, the account and its password, and if the database accepts connections from the internet, that line works for whoever reads it, wherever they are.

That's what makes the usual shortcuts risky. Chat messages are kept and synced, emails sit in mailboxes and backups, and a \`DATABASE_URL\` in a shared document gets copied into places nobody tracks.

## Step 1: don't share your login, create one for them

The best credential to share is one that exists only for this person and this job. The [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html) recommends that application accounts have only the permissions they need, that each environment uses separate accounts, and that applications never use built-in accounts such as \`root\`, \`sa\` or \`SYS\`. The same logic applies to people.

In PostgreSQL, a time-limited, read-only role for a contractor looks like this:

\`\`\`sql
CREATE ROLE contractor_alex WITH LOGIN CONNECTION LIMIT 2 VALID UNTIL '2026-11-30';
GRANT CONNECT ON DATABASE app TO contractor_alex;
GRANT USAGE ON SCHEMA public TO contractor_alex;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO contractor_alex;
\`\`\`

Then set the password from \`psql\` with \`\\password contractor_alex\`. PostgreSQL's [ALTER ROLE documentation](https://www.postgresql.org/docs/current/sql-alterrole.html) warns that a password written into the command itself is sent to the server in cleartext and can end up in command history or server logs, and recommends \`\\password\` for that reason. Make the password long and random, for example with a [password generator](/tools/password-generator).

\`VALID UNTIL\` makes the password stop working after a date, though it applies only to password logins ([CREATE ROLE](https://www.postgresql.org/docs/current/sql-createrole.html)). \`GRANT\` hands out specific privileges on specific objects ([GRANT](https://www.postgresql.org/docs/current/sql-grant.html)); note that \`ON ALL TABLES\` covers the tables that exist now, not ones created later. If read-only isn't enough, widen access table by table. MySQL, SQL Server and managed databases have equivalents.

Two other ways to make access smaller:

- **A read replica** for analysts and debugging, so a mistake can't touch the primary.
- **A staging copy** for anyone who doesn't truly need production data.

## Step 2: prefer credentials that expire on their own

Some platforms can take the long-lived password out of the handoff entirely.

- **Amazon RDS IAM database authentication** replaces the database password with an authentication token that has a lifetime of 15 minutes ([AWS documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)). Access is managed through IAM, and there's nothing long-lived to send.
- **HashiCorp Vault's database secrets engine** generates credentials on demand, unique to each client, and revokes them when their lease expires ([Vault documentation](https://developer.hashicorp.com/vault/docs/secrets/databases)).

If your setup supports something like this, use it, and keep the rest of this guide for the cases where a password still has to travel.

## Step 3: send it through a link that forgets

When you do have to send a password or a connection string:

1. Open [EnvShare](/secrets) and paste the connection string, or the host, user and password on separate lines.
2. Set **one read** and a **short expiry**, from one hour to one day.
3. For production access, **add a password** and send it another way, such as on a call. The host name can live in the ticket; the password shouldn't.
4. Send the link. It's encrypted in your browser with AES-256-GCM, the key stays after the \`#\` in the link, which browsers don't send to servers ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)), and the ciphertext is deleted after the read.
5. Ask the recipient to confirm they can connect, and check [My links](/links) to see that the link was opened.

On the receiving end, for example when a client needs to give your agency access to their database, send them a [secret request](/request) instead. Their browser encrypts the credentials to a key only your inbox link can open.

## Step 4: lock down the network path

A leaked password matters less if the database can't be reached.

- **Don't expose the database to the internet** unless you have to. Use private networking, a VPN or bastion host, or an IP allowlist.
- **Require TLS.** OWASP recommends configuring the database to allow only encrypted connections. On the client side, PostgreSQL's \`sslmode=verify-full\` both requires TLS and checks that the server's certificate matches the host name you connected to.

## Step 5: take access back when the work ends

- **Disable or remove the role,** for example with \`ALTER ROLE contractor_alex NOLOGIN;\`, or drop it once nothing depends on it. \`VALID UNTIL\` is a safety net, not a substitute.
- **Rotate any shared password the person saw,** such as an application user's password that appeared in a \`.env\` file they received.
- **If a credential reached git, rotate it first** and clean up history afterwards; GitHub's guide to [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) notes that rewriting history can't remove copies in existing clones.

## What to put in the handoff

Connection details are easier to use, and easier to clean up, when they arrive with context. A note like this, sent through the one-read link, covers it:

\`\`\`text
Host:     db.internal.example.com  (VPN required)
Port:     5432
Database: app
User:     contractor_alex  (read-only, expires 30 Nov)
Password: <long random value>
TLS:      sslmode=verify-full
Questions: reply to the person who sent this link
\`\`\`

The expiry date in the note tells the recipient when their access ends, and reminds you what to check when it does.

## Quick checklist

- A dedicated role for this person, with only the privileges the job needs
- A long random password, set with \`\\password\` rather than typed into SQL
- \`VALID UNTIL\` and a connection limit on the role
- Network access restricted, and TLS required
- Sent through a one-read link with a short expiry, with the password for production access given another way
- A reminder in your calendar to disable the role when the work ends

## Who gets what

| Who needs access | What to give them | How to send it |
| --- | --- | --- |
| A developer debugging production for an afternoon | A read-only role with \`VALID UNTIL\` set to tomorrow | A one-read link, with the password given on a call |
| An analyst running reports | A read-only role on a replica | A one-read link |
| A new service | Its own role, stored in your platform's secret store | No human handoff |
| An agency taking over the project | Their own admin role, then a rotation of yours | A one-read link with a password |
| A client giving you access to their database | A dedicated role, not their admin login | A [secret request](/request) |

## When a link is the wrong tool

- **Application config** belongs in a secrets manager or your deployment platform's environment settings, not in links people open.
- **Ongoing team access** is better handled with individual accounts, single sign-on or IAM-based authentication where your database supports it, or a shared vault in a password manager.
- **Environments that require approved tools and audit trails** should use those. ProtectedShare records that a link was opened, not who opened it.

## Sources

- PostgreSQL documentation: [connection strings](https://www.postgresql.org/docs/current/libpq-connect.html), [CREATE ROLE](https://www.postgresql.org/docs/current/sql-createrole.html), [ALTER ROLE](https://www.postgresql.org/docs/current/sql-alterrole.html), [GRANT](https://www.postgresql.org/docs/current/sql-grant.html)
- OWASP, [Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
- AWS, [IAM database authentication for MariaDB, MySQL, and PostgreSQL](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html)
- HashiCorp, [Database secrets engine](https://developer.hashicorp.com/vault/docs/secrets/databases)
- GitHub Docs, [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- MDN, [URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)`,
  },
  {
    slug: "self-destructing-messages-explained",
    title: "Burn After Reading: How Self-Destructing Messages Work",
    description:
      "What actually gets deleted when a message self-destructs, how burn after reading, read limits and expiry differ, and how to choose the right settings.",
    category: "Secret Sharing",
    publishedAt: "2026-08-20",
    updatedAt: "2026-10-11",
    related: [
      "how-zero-knowledge-encrypted-notes-work",
      "is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
      "what-to-look-for-in-a-private-note-app",
    ],
    content: `"Self-destructing" covers two quite different mechanisms. Knowing which one a tool uses tells you what it actually protects against.

## Hidden versus deleted

In messaging apps, disappearing messages remove old messages from a conversation after a timer. That keeps the chat tidy and limits what's left on a lost phone, but the app can only control its own copies. Signal, which popularised the feature, said when it launched that disappearing messages are [not for situations where your contact is your adversary](https://signal.org/blog/disappearing-messages/): a recipient can always photograph the screen.

In secret-sharing tools, the stronger version deletes the stored ciphertext from the server's database after a set number of reads or at an expiry time, and the link then points at nothing. Combined with encryption in the browser, a deleted ciphertext can't be decrypted later by anyone, whatever links or keys surface afterwards.

A good tool tells you which one it does. In ProtectedShare, a burned note is deleted from the database in the same request that delivers it, not marked as hidden. Expired shares are refused on every read, and a cleanup job deletes them every 30 minutes.

## Three controls: burn after reading, read limits and expiry

| Control | What it does | Good for |
| --- | --- | --- |
| Burn after reading | Deletes the secret the first time it's opened | Passwords, recovery codes, anything one person reads once |
| Read limit | Deletes it after a set number of opens (EnvShare allows 1 to 100) | A key someone needs on a laptop and a server; a small team |
| Expiry | Deletes it at a set time, opened or not (1 hour up to 30 days) | A ceiling on how long a forgotten link stays live |

Use them together. A read limit without a short expiry leaves an unopened link alive for weeks; an expiry without a read limit lets anyone who gets the link before then read it.

## Choosing the settings

Start from the job, not the defaults:

- **One person, one action,** such as a password or a verification code: burn after reading, and 1 hour to 1 day.
- **One person, several devices,** such as an API key for a laptop and a server: two or three reads, and 1 day.
- **A small group,** such as a deploy key for three engineers: a read count equal to the number of people, and the shortest expiry that covers everyone's time zone.
- **Someone who won't see it until next week:** 7 days, still one read, and a password sent separately.

When in doubt, shorter wins. A link that expires before it's used costs a minute to recreate; a link that outlives its purpose is a credential nobody is watching.

## Habits that make temporary links work

- **Keep the link and any password in different channels,** so one leaked inbox doesn't reveal both.
- **Tell the recipient what to expect:** "This opens once, so copy it into your password manager."
- **Check the status.** [My links](/links), in the browser that created the link, shows whether it was opened, burned or expired, and lets you revoke an unopened link.
- **Treat surprises as signals.** If the recipient finds the link already used, someone else opened it. Change the secret.
- **Don't worry about link previews with a well-built tool.** Chat apps that unfurl links fetch the page without the key, and ProtectedShare's note page waits for a click before anything is read or burned.

## What self-destruction doesn't do

- It doesn't stop the recipient from copying what they read.
- It doesn't protect a secret on a compromised device.
- It doesn't stop the wrong person from opening the link first; it only makes that visible.

## When to use it, and when not to

Self-destructing delivery fits any secret whose value ends once it's received: a Wi-Fi password for a guest, a verification code for a family member, credentials for a contractor, an activation key moved between your own devices.

It's the wrong tool for anything that needs to be found again. Recovery codes, shared team credentials and records you're required to keep belong in a password manager or a proper document system.

To try it, create a [secure note](/notes), where burn after reading is on by default, or an [EnvShare link](/secrets) with a read limit.`,
  },
  {
    slug: "how-to-share-wifi-password-safely",
    title: "How to Share a WiFi Password Safely",
    description:
      "Guest networks, phone-to-phone sharing, QR codes and one-time links: the safe ways to hand out a WiFi password, and when to change it afterwards.",
    category: "Workflows",
    publishedAt: "2026-08-21",
    updatedAt: "2026-10-11",
    related: [
      "best-practices-for-sharing-passwords-in-2026",
      "is-it-safe-to-send-passwords-over-whatsapp-email-or-sms",
      "self-destructing-messages-explained",
    ],
    practice: {
      primary: { href: "/notes", label: "New secure note" },
      secondary: { href: "/tools/wifi-qr-code-generator", label: "Make a WiFi QR code" },
    },
    content: `Sharing a WiFi password feels harmless, and for a friend in your living room it mostly is. But the password lets someone onto the same network as your laptops, printers, cameras and smart speakers, and the usual ways of sharing it (reading it aloud, taping it to the wall, texting it) leave copies you don't control.

## The short answer

- **Put visitors on a guest network** with its own password, so your main password stays private.
- **If they're in the room,** share it from your phone or show a QR code. Nothing gets written down.
- **If they're not,** send a one-time link instead of texting the password.
- **Change the guest password** when the list of people who know it gets longer than you're comfortable with.

## What a WiFi password actually gives someone

On a typical home or small-office network (WPA2 or WPA3 Personal), the password is the only thing standing between a device and your local network. Anyone who knows it can join, from any device, for as long as the password stays the same. Once connected, they're on the same network as everything else you own, unless the router keeps guests apart.

That's why the FTC's advice on [securing a home Wi-Fi network](https://consumer.ftc.gov/articles/how-secure-your-home-wi-fi-network) recommends WPA3 or WPA2 encryption, a unique network password, and a separate guest network, so fewer people know your main password and visitors' devices can't reach the rest of your network.

## Option 1: a guest network (do this first)

Most home routers can run a separate guest network with its own name and password. It's the single most useful step, because it changes what you're sharing:

- your main password stays with the people who live or work there;
- you can change the guest password at any time without reconnecting your own devices;
- many routers can stop guest devices from seeing each other or your main network. The setting is often called client isolation or AP isolation, and names vary by brand.

## Pick a guest password that's easy to type and hard to guess

Guests often type the password on a TV, a games console or a laptop with an unfamiliar keyboard, which tempts people into short, simple passwords. A passphrase solves both problems: several random, unrelated words are long enough to resist guessing and easy to read out or type. CISA's guidance on [strong passwords](https://www.cisa.gov/secure-our-world/require-strong-passwords) suggests a passphrase of 5 to 7 unrelated words, or at least 16 random characters. The [password generator](/tools/password-generator) can make a passphrase for you.

Avoid anything guessable from the outside: the street name, the family name or the name of the network itself.

## Option 2: share it in person, phone to phone

When the other person is standing next to you, let the phones do it.

- **iPhone and iPad:** when a nearby Apple device tries to join your network, your device can offer to share the password. Apple's [instructions](https://support.apple.com/en-us/102635) list the requirements: both devices need Wi-Fi and Bluetooth on, each person must be signed in to their Apple Account, each must have the other's Apple Account email or phone number in Contacts, and the devices need to be close together.
- **Android:** in Settings, open your saved network and choose **Share**. The phone shows a QR code the other person can scan ([Android Help](https://support.google.com/android/answer/9075847)).

Either way, the password is never typed into a chat or written down.

## Option 3: a WiFi QR code

Phone cameras recognise a standard WiFi QR format and offer to join the network when they scan it. Inside the code is a short line of text: \`WIFI:T:WPA;S:network-name;P:password;;\`, where \`T\` is the security type, \`S\` the network name and \`P\` the password. Special characters such as \`;\`, \`,\`, \`:\` and \`"\` in the name or password have to be escaped with a backslash ([ZXing barcode contents](https://github.com/zxing/zxing/wiki/Barcode-Contents)). A generator does that for you; you can make one with the [WiFi QR code generator](/tools/wifi-qr-code-generator).

One thing to understand before printing it: **a QR code is the password, just encoded.** Anyone who photographs it can read the password straight back out. That makes a printed code ideal for a guest network you're happy to share widely, such as a café, an office lobby or a holiday rental, and a poor idea for your main network. Print the network name and password as text beside the code too, for guests whose camera or device can't read it.

## Option 4: when they're not in the room, a one-time link

Texting the password leaves it in both message histories, on every linked device and in backups, and possibly on a lock screen notification. A one-time link leaves a link in the chat instead, and the link stops working once it's opened.

With ProtectedShare's [Secure Notes](/notes):

1. Paste the network name and password into a new note.
2. Keep **burn after reading** on, and choose an expiry of 1 hour or 1 day.
3. Copy the link and send it in your usual app.

The note is encrypted in your browser with AES-256-GCM before upload, and the key sits after the \`#\` in the link, a part browsers don't send to the server ([MDN](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)). The first open deletes the note from the database. If your guest finds the link already used, someone else opened it first, which is your cue to change the guest password.

## Which option fits which situation

| Situation | Best option | Why |
| --- | --- | --- |
| A friend in your living room | Phone-to-phone sharing, or the QR code from your phone | Nothing is written down or sent |
| Holiday rental or Airbnb | Guest network with a printed QR code | Expect it to be photographed; change it between stays if you want |
| Café or office lobby | Guest network with a printed QR code | Deliberately shared widely, kept apart from your own devices |
| A contractor arriving next week | One-time link to the guest network password | Not left in a chat history, and it expires |
| New staff in an office | Each person's own WiFi login (WPA2 or WPA3 Enterprise), if your equipment supports it | Access can be removed person by person |
| A smart TV or other device | Type it in directly, or use a separate network for those devices | No need to share the password with anyone |

## When not to use a link

- **When the person is in the room.** A QR code or phone sharing is quicker and leaves nothing behind.
- **For office staff, a shared password is the wrong tool altogether.** Business access points support WPA2 and WPA3 Enterprise, which gives each person their own login that can be revoked individually. If that's out of reach, keep staff on a different network from guests.
- **When you're about to change the password anyway.** Just share the new one in person.

## After sharing: when to change the password

You don't need to change a WiFi password on a schedule for the sake of it. Change it when the group of people who know it changes in a way you care about:

- a tenant, housemate or employee moves out or leaves;
- a printed QR code or a photo of the password has been somewhere you don't control;
- you can no longer say who has it.

This is where a guest network pays off: changing the guest password only affects guests. Changing the main password means re-entering it on every device you own. And whenever you're in the router's settings, the FTC also recommends changing the router's default admin password and keeping its firmware up to date.

## Sources

- FTC, [How To Secure Your Home Wi-Fi Network](https://consumer.ftc.gov/articles/how-secure-your-home-wi-fi-network)
- CISA, [Require Strong Passwords](https://www.cisa.gov/secure-our-world/require-strong-passwords)
- Apple Support, [How to share your Wi-Fi password from your iPhone or iPad](https://support.apple.com/en-us/102635)
- Android Help, [Connect to Wi-Fi networks on your Android device](https://support.google.com/android/answer/9075847)
- ZXing, [Barcode Contents: Wi-Fi network config](https://github.com/zxing/zxing/wiki/Barcode-Contents)
- MDN, [URI fragment](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Fragment)`,
  },
];

const WORDS_PER_MINUTE = 230;

/** Words a reader sees: markdown syntax and link targets don't count. */
export function countWords(markdown: string): number {
  return markdown
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[#>*_`|[\]]/g, " ")
    .split(/\s+/)
    .filter((word) => /[A-Za-z0-9]/.test(word)).length;
}

function readingTimeFor(content: string): string {
  return `${Math.max(1, Math.round(countWords(content) / WORDS_PER_MINUTE))} min read`;
}

export const BLOG_POSTS: BlogPost[] = POSTS.map((post) => ({
  ...post,
  author: post.author ?? KUNAL_SIYAG,
  readingTime: readingTimeFor(post.content),
}));

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}

export function getBlogSlugs(): string[] {
  return BLOG_POSTS.map((post) => post.slug);
}

/** Where a retired slug now lives, or undefined. Own keys only, so "constructor" isn't a redirect. */
export function getBlogRedirect(slug: string): string | undefined {
  return Object.prototype.hasOwnProperty.call(BLOG_REDIRECTS, slug) ? BLOG_REDIRECTS[slug] : undefined;
}

/** Hand-picked related posts first, then posts from the same category, then the newest. */
export function getRelatedPosts(post: BlogPost, count = 3): BlogPost[] {
  const picked: BlogPost[] = [];
  const add = (candidate: BlogPost | undefined) => {
    if (candidate && candidate.slug !== post.slug && !picked.some((item) => item.slug === candidate.slug)) {
      picked.push(candidate);
    }
  };
  for (const slug of post.related ?? []) add(getBlogPost(slug));
  for (const candidate of BLOG_POSTS) if (candidate.category === post.category) add(candidate);
  for (const candidate of [...BLOG_POSTS].reverse()) add(candidate);
  return picked.slice(0, count);
}

export function getBlogLastModified(): string {
  return BLOG_POSTS.reduce((latest, post) => {
    const current = new Date(post.updatedAt).getTime();
    return current > latest ? current : latest;
  }, 0)
    .toString();
}
