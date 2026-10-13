# protectedshare-mcp

Local [MCP](https://modelcontextprotocol.io) server for [ProtectedShare](https://protectedshare.me). It lets Claude, or any MCP
client, turn a password, API key or `.env` file into an end-to-end encrypted link that burns after reading, ask someone to send
you a secret, check whether a link was opened, revoke it, and open links people send you.

Encryption and decryption run on your computer. ProtectedShare's servers only receive ciphertext. There is no account and
nothing to configure.

Setup guide and privacy comparison: https://protectedshare.me/integrations/claude

## Set up

Needs Node.js 20 or later.

**Claude Code**

```sh
claude mcp add protectedshare -- npx -y protectedshare-mcp
```

**Claude Desktop**: open Settings, then Developer, and choose Edit Config. Add this to `claude_desktop_config.json` and restart
Claude:

```json
{
  "mcpServers": {
    "protectedshare": {
      "command": "npx",
      "args": ["-y", "protectedshare-mcp"]
    }
  }
}
```

**Other MCP clients**: run `npx -y protectedshare-mcp` as a stdio server.

Would rather not install anything? The same tools, minus the local-only ones, are available as a remote connector at
`https://mcp.protectedshare.me/mcp` (Streamable HTTP, no sign-in). With the remote connector, the text you share is encrypted on
ProtectedShare's MCP server instead of your computer; see the setup guide for the difference.

## Tools

| Tool | What it does | Effect |
| --- | --- | --- |
| `create_secret_link` | Encrypts text into a Secure Note link. Burns after one read by default; optional password. | Creates a link |
| `share_env_file` | Encrypts a `.env` file or other credentials into an EnvShare link that opens 1 to 100 times. Optional password. | Creates a link |
| `request_secret` | Makes a link someone uses to send you a secret, encrypted to a key only your inbox link holds. | Creates a link |
| `check_link_status` | Shows whether a link was opened, reads left and expiry. Needs the link's manage token. | Read-only |
| `revoke_link` | Deletes a link's encrypted content right away. Needs the link's manage token. | Deletes data |
| `generate_password` | Random password, passphrase or PIN, with its entropy. | Read-only |
| `open_secret_link` | Decrypts a note, EnvShare or request-inbox link on your computer. Uses up a read. | Deletes data (a read) |
| `check_password_breach` | Checks a password against Have I Been Pwned's Pwned Passwords (k-anonymity). | Read-only |

Links expire after 1 hour, 1 day (default), 7 days or 30 days. Every link a tool creates comes with a `manage_token` for
`check_link_status` and `revoke_link`; nothing else keeps a copy of it. Links made here don't appear in "My links" in a browser.

## Configuration

| Variable | Default | Meaning |
| --- | --- | --- |
| `PROTECTEDSHARE_API_URL` | `https://protectedshare.me` | The ProtectedShare instance (web app origin), for example a self-hosted one. Must be https, except for localhost. |
| `PROTECTEDSHARE_HIBP_URL` | `https://api.pwnedpasswords.com` | Where `check_password_breach` sends its 5-character hash prefix. |

## How it works

The server uses the same encryption code as the ProtectedShare website. A random 32-byte key goes in the link after the `#`,
which is never sent to a server. HKDF-SHA256 derives an AES-256-GCM key and a separate auth token from it (with a password,
the password is first stretched with PBKDF2-SHA256, 600,000 iterations). The server stores the ciphertext and a SHA-256 hash of
the auth token, and releases the ciphertext only to a reader who presents the token. Secret requests use ECDH P-256 so only the
inbox link's private key can open the answer. Details: https://protectedshare.me/security

## Privacy Policy

This section covers the `protectedshare-mcp` package. The full ProtectedShare privacy policy is at
https://protectedshare.me/privacy.

**What it collects.** The server collects nothing about you. It keeps no files, logs, analytics or caches; data exists in memory
only while a tool call runs. Diagnostics it writes to stderr name an error's type and never include arguments, results or
secrets.

**What it sends, and where.**

- To ProtectedShare's storage API (`PROTECTEDSHARE_API_URL`, by default https://protectedshare.me/api, relayed by our web host
  Vercel to a Cloudflare Worker): when you create a link, the ciphertext, its random salt and IV, SHA-256 hashes of the auth
  token and the manage token, the expiry and the read limit. For a secret request: the request's public key, an encrypted
  title and note, and SHA-256 hashes of the inbox and respond tokens. When you open a link: the link's ID and the auth token
  (derived from the key; it proves you hold the link but can't decrypt anything). When you check or revoke a link: its type,
  its ID and the manage token. The plaintext, the link key, link passwords and private keys are never sent.
- To Have I Been Pwned (`api.pwnedpasswords.com`), only when you use `check_password_breach`: the first 5 hexadecimal
  characters of the password's SHA-1 hash. The password and the rest of the hash stay on your computer.
- Like any web request, these carry your IP address and the User-Agent `protectedshare-mcp/<version>`, which Vercel,
  Cloudflare and Have I Been Pwned can see.

**How it is used and stored.** ProtectedShare stores the ciphertext only to deliver it to whoever holds the link. It is deleted
when the link burns after reading, runs out of reads, is revoked, or expires (expired rows are refused at once and purged
every 30 minutes). A secret request is deleted when its answer is opened. A receipt holding no content (type, ID, status,
read counts and timestamps) is kept until 30 days after the link expires, so `check_link_status` keeps working.

**Third parties.** Vercel (web host, relays API requests), Cloudflare (runs the API and its database, keeps request logs with
metadata such as the path, status and timing) and, for breach checks only, Have I Been Pwned. ProtectedShare doesn't sell or
share data with anyone else. Your MCP client (for example Claude) sees the tool calls and results in your conversation,
including links, which carry their decryption key; that is governed by your client's own terms.

**Retention.** As above: content until it is opened, used up, revoked or expired (30 days at most); receipts until 30 days
after expiry. The package itself retains nothing.

**Contact.** admin@protectedshare.me

## Support and security

Questions and bugs: admin@protectedshare.me or https://github.com/KunalSiyag/protectedshare/issues. Report vulnerabilities as
described at https://protectedshare.me/security.

## License

MIT. Source: https://github.com/KunalSiyag/protectedshare (`packages/mcp-server`, `packages/mcp-core`). It depends on the
official MCP TypeScript SDK (`@modelcontextprotocol/server`, Apache-2.0).
