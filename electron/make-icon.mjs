// Generate build/icon.ico for the Windows app from the existing PWA icon.
import pngToIco from "png-to-ico";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import path from "path";

const root = path.resolve(".");
const buildDir = path.join(root, "build");
mkdirSync(buildDir, { recursive: true });

const src = path.join(root, "public", "icon-512.png");
if (!existsSync(src)) {
  console.error("Missing public/icon-512.png");
  process.exit(1);
}

const buf = await pngToIco(src);
writeFileSync(path.join(buildDir, "icon.ico"), buf);
console.log("build/icon.ico written.");
