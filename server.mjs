import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
process.env.LOCAL_DATABASE_PATH ||= "./dexterous.sqlite";
const { handler } = await import("./lib/backend.mjs");
const root = process.cwd();
const allowed = new Set([
  "index.html",
  "app.js",
  "style.css",
  "config.js",
  "sw.js",
  "manifest.webmanifest",
]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};
createServer(async (req, res) => {
  const p = new URL(req.url, "http://localhost").pathname;
  if (p.startsWith("/api/")) return handler(req, res);
  let path;
  try {
    path = decodeURIComponent(p).replace(/^\//, "") || "index.html";
  } catch {
    res.writeHead(400);
    return res.end("Invalid URL");
  }
  if (!(
    allowed.has(path) ||
    /^(assets|data)\/[a-zA-Z0-9._-]+$/.test(path) ||
    ["lib/data.js", "lib/store.js"].includes(path)
  )) {
    res.writeHead(404);
    return res.end("Not found");
  }
  try {
    const data = await readFile(resolve(root, path));
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(Number(process.env.PORT) || 4173, "0.0.0.0", () =>
  console.log(
    "Dexterous running on http://localhost:" + (process.env.PORT || 4173),
  ),
);
