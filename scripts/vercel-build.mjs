import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const output = resolve("dist");
const files = [
  "app.js",
  "config.js",
  "index.html",
  "manifest.webmanifest",
  "style.css",
  "sw.js",
  "assets",
  "data/catalog.json",
  "lib/data.js",
  "lib/store.js",
];

await mkdir(output, { recursive: true });
for (const file of files) {
  const destination = resolve(output, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(file), destination, { recursive: true });
}
