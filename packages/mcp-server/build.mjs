// Bundles the CLI into dist/cli.js: our code (@protectedshare/mcp-core, @protectedshare/crypto)
// is inlined; the official MCP SDK stays a normal runtime dependency.
import { build } from "esbuild";
import { chmod, readFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
const outfile = `${root}dist/cli.js`;

await rm(`${root}dist`, { recursive: true, force: true });
await build({
  absWorkingDir: root,
  entryPoints: ["src/cli.ts"],
  outfile,
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  tsconfig: "tsconfig.json",
  banner: { js: "#!/usr/bin/env node" },
  external: ["@modelcontextprotocol/server", "@modelcontextprotocol/server/*"],
  define: { __VERSION__: JSON.stringify(pkg.version) },
  legalComments: "none",
  logLevel: "info",
});
await chmod(outfile, 0o755);
