// After `next build`, the standalone server in .next/standalone does NOT include
// the static assets or /public. Copy them in so the bundled server can serve them.
import { cpSync, existsSync } from "fs";
import path from "path";

const root = path.resolve(".");
const standalone = path.join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error("Missing .next/standalone — run `next build` (with output:'standalone') first.");
  process.exit(1);
}

cpSync(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"), {
  recursive: true,
});

if (existsSync(path.join(root, "public"))) {
  cpSync(path.join(root, "public"), path.join(standalone, "public"), { recursive: true });
}

console.log("Standalone bundle prepared (static + public copied).");
