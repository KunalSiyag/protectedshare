# Security policy

ProtectedShare encrypts secrets in the browser and the storage API keeps only ciphertext and verifiers. The full model,
including what we can't protect against, is on the [security page](https://protectedshare.me/security).

## Reporting a vulnerability

Please email **admin@protectedshare.me** before publishing anything, with:

- what you found and where (URL, file or endpoint),
- steps to reproduce, and
- what an attacker could do with it.

Please don't include real secrets, links with keys (the part after `#`), or other people's data in a report. Test only
against links and rooms you created yourself, or against your own self-hosted instance.

We'll acknowledge reports as quickly as we can, keep you updated while we fix the issue, and credit you if you'd like.
The machine-readable contact is at [`/.well-known/security.txt`](https://protectedshare.me/.well-known/security.txt).

## Scope

- The hosted site and API at protectedshare.me
- The code in this repository (web app, API Worker, crypto package, MCP server)

Self-hosted instances run by other people are operated by them; report issues in the code here, and issues with a
specific deployment to its operator.
